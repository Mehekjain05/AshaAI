from typing import Annotated, Sequence
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
from ast import arguments
from typing import Annotated, Literal, Sequence, List
from typing_extensions import TypedDict
import json
from langchain import hub
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from core.tools import vectorstore_retriever_tool, publicapi_retriever_tool
from models.data_model import JobResponseList
from core.guardrails import CustomDetectPII, CustomDetectBias
from guardrails import Guard

guard = Guard().use_many(CustomDetectPII(on_fail="fix"), CustomDetectBias(on_fail="fix"))

tools = [vectorstore_retriever_tool, publicapi_retriever_tool]   
class Node:
    def agent(state):
        """
        Invokes the agent model to generate a response based on the current state. Given
        the question, it will decide to retrieve using the retriever tool, or simply end.

        Args:
            state (messages): The current state

        Returns:
            dict: The updated state with the agent response appended to messages
        """
        print("---CALL AGENT---")

        
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        model = model.bind_tools(tools)
        response = model.invoke(
            [
            {
                "role": "system",
                "content": f"""You are a helpful assistant"""
            },
            *state["messages"]
        ]
        )
        return {"messages": [response]}

    def generate(state):
        """
        Generate answer

        Args:
            state (messages): The current state

        Returns:
            dict: The updated state with re-phrased question
        """
        print("---GENERATE---")
        messages = state["messages"]
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        if messages[-1].name == "publicapi_retriever_tool":
            structured_model = model.with_structured_output(JobResponseList)
            response = structured_model.invoke(
                [
                    {
                        "role": "system",
                        "content": f"""You are a helpful assistant"""
                    },
                    *state["messages"],
                ]
            )
            return {"messages": [AIMessage(content=str(response.jobs), additional_kwargs={}, response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'gemini-2.0-flash', 'safety_ratings': []})]}
        response = model.invoke(
            [
            {
                "role": "system",
                "content": f"""You are a helpful assistant"""
            },
            *state["messages"],
        ]
        )
        # print("NEW RESPONSE", response)
        return {"messages": [response]}

    def publicapi_retrieve(state):
        """
        Generate answer

        Args:
            state (messages): The current state

        Returns:
            messages: The updated state with the response
        """
        messages = state["messages"][-1]
        function_called = messages.additional_kwargs["function_call"]
        function_name = function_called["name"]
        function_args = json.loads(function_called["arguments"])
        if "work_mode" in function_args and "job_type" in function_args:
            response = publicapi_retriever_tool.invoke(input={"work_mode": function_args["work_mode"], "job_type": function_args["job_type"]})
        elif "work_mode" in function_args:
            response = publicapi_retriever_tool.invoke(input={"work_mode": function_args["work_mode"], "job_type": None})
        elif "job_type" in function_args:
            response = publicapi_retriever_tool.invoke(input={"work_mode": None, "job_type": function_args["job_type"]})
        else:
            response = publicapi_retriever_tool.invoke(input={"work_mode":None, "job_type":None})
        return {"messages": [ToolMessage(content=response, name=function_name, tool_call_id = messages.tool_calls[0]['id'])]}

    def vector_store_retrieve(state):
        """
        Generate answer

        Args:
            state (messages): The current state

        Returns:
            messages: The updated state with the response
        """
        messages = state["messages"][-1]
        function_called = messages.additional_kwargs["function_call"]
        function_name = function_called["name"]
        function_args = json.loads(function_called["arguments"])
        if "query" in function_args:
            response = vectorstore_retriever_tool.invoke(input={"query": function_args["query"]})
        return {"messages": [ToolMessage(content=response, name=function_name, tool_call_id = messages.tool_calls[0]['id'])]}
