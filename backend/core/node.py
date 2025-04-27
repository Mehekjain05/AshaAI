from langchain_core.messages import BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
from ast import arguments
import json
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from core.tools import vectorstore_retriever_tool, publicapi_retriever_tool, career_guidance_tool, current_events_tool, update_user_profile_tool
from models.data_model import JobResponseList, CareerResponse, CurrentEvents, UserProfile
from core.guardrails import CustomDetectPII, CustomDetectBias
from guardrails import Guard
from langchain_core.runnables.config import RunnableConfig
from langgraph.store.base import BaseStore
from langgraph.func import entrypoint
from langgraph.config import get_config
from langgraph.store.memory import InMemoryStore
from langmem import create_memory_store_manager

# feedback, preferred jobs, preferred location, preferred work mode
guard = Guard().use_many(CustomDetectPII(on_fail="fix"), CustomDetectBias(on_fail="fix"))

tools = [vectorstore_retriever_tool, publicapi_retriever_tool, career_guidance_tool, current_events_tool, update_user_profile_tool]
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

STORE = InMemoryStore(
    index={
        "dims":3072,
        "embed": GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-exp-03-07")
    }
)
manager = create_memory_store_manager(
    llm,
    namespace=("users", "{user_id}", "profile"),
    schemas=[UserProfile],
    enable_inserts=False,
    store=STORE,
)
class Node:
    SYSTEM_PROMPT = """You are **Asha**, an AI chatbot developed for the **JobsForHer Foundation**, empowering women in their professional journeys. Your goal is to provide accurate, ethical, and context-aware assistance focused on careers, job listings, community events, mentorship programs, and professional networking.  

You have access to these tools:
- `vectorstore_retriever_tool` for platform-specific info (events, sessions, mentorships).
- `publicapi_retriever_tool` for live job listings from public APIs.
- `career_guidance_tool` for career advice sourced from the web.
- `current_events_tool` for current event information relevant to professional development.
- `update_user_profile_tool` for updating user profiles with feedback, preferred jobs, locations, and work modes.

**Guidelines:**  
- **Context-Awareness:** Handle multi-turn conversations coherently, using non-personalized session data.  
- **Tool Usage:** Select tools smartly based on user needs to fetch real-time, verified information.  
- **Bias Detection:** Identify and gently correct gender-biased queries. Maintain inclusive, respectful, and empowering language at all times.  
- **Content Relevance:** Ensure discussions stay within JobsForHer’s domains (career growth, jobs, events, mentorship, networking). Redirect gently if a query is out of scope.  
- **Privacy & Security:** Never request or retain personal sensitive data. Comply with ethical AI standards.  
- **Fallback & Feedback:** If unsure, offer alternative suggestions or escalate to human support. Accept user feedback for continuous improvement.

**Tone:** Professional, friendly, empathetic, encouraging, always positive toward women’s professional growth.  

Your mission is to drive intelligent, ethical, and impactful conversations that enable women to thrive professionally.
"""

    @entrypoint(store=STORE)
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
        configurable = get_config()["configurable"]
        results = STORE.search(
            ("users", configurable["user_id"], "profile")
        )
        profile= None
        SYSTEM_PROMPT = """You are **Asha**, an AI chatbot developed for the **JobsForHer Foundation**, empowering women in their professional journeys. Your goal is to provide accurate, ethical, and context-aware assistance focused on careers, job listings, community events, mentorship programs, and professional networking.  

You have access to these tools:
- `vectorstore_retriever_tool` for platform-specific info (events, sessions, mentorships).
- `publicapi_retriever_tool` for live job listings from public APIs.
- `career_guidance_tool` for career advice sourced from the web.
- `current_events_tool` for current event information relevant to professional development.
- `update_user_profile_tool` for updating user profiles with feedback, preferred jobs, locations, and work modes.

**Guidelines:**  
- **Context-Awareness:** Handle multi-turn conversations coherently, using non-personalized session data.  
- **Tool Usage:** Select tools smartly based on user needs to fetch real-time, verified information.  
- **Bias Detection:** Identify and gently correct gender-biased queries. Maintain inclusive, respectful, and empowering language at all times.  
- **Content Relevance:** Ensure discussions stay within JobsForHer’s domains (career growth, jobs, events, mentorship, networking). Redirect gently if a query is out of scope.  
- **Privacy & Security:** Never request or retain personal sensitive data. Comply with ethical AI standards.  
- **Fallback & Feedback:** If unsure, offer alternative suggestions or escalate to human support. Accept user feedback for continuous improvement.

**Tone:** Professional, friendly, empathetic, encouraging, always positive toward women’s professional growth.  

Your mission is to drive intelligent, ethical, and impactful conversations that enable women to thrive professionally.
"""
        if results:
            profile = f"""\n<User Profile>:
        {results[0].value}
        </User Profile>
        """
            SYSTEM_PROMPT += profile 
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        model = model.bind_tools(tools)

        response = model.invoke(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                *state["messages"]
            ]
        )
        return {"messages": [response]}

    @entrypoint(store=STORE)
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
        configurable = get_config()["configurable"]
        results = STORE.search(
            ("users", configurable["user_id"], "profile")
        )
        profile= None
        SYSTEM_PROMPT = """You are **Asha**, an AI chatbot developed for the **JobsForHer Foundation**, empowering women in their professional journeys. Your goal is to provide accurate, ethical, and context-aware assistance focused on careers, job listings, community events, mentorship programs, and professional networking.  

You have access to these tools:
- `vectorstore_retriever_tool` for platform-specific info (events, sessions, mentorships).
- `publicapi_retriever_tool` for live job listings from public APIs.
- `career_guidance_tool` for career advice sourced from the web.
- `current_events_tool` for current event information relevant to professional development.
- `update_user_profile_tool` for updating user profiles with feedback, preferred jobs, locations, and work modes.

**Guidelines:**  
- **Context-Awareness:** Handle multi-turn conversations coherently, using non-personalized session data.  
- **Tool Usage:** Select tools smartly based on user needs to fetch real-time, verified information.  
- **Bias Detection:** Identify and gently correct gender-biased queries. Maintain inclusive, respectful, and empowering language at all times.  
- **Content Relevance:** Ensure discussions stay within JobsForHer’s domains (career growth, jobs, events, mentorship, networking). Redirect gently if a query is out of scope.  
- **Privacy & Security:** Never request or retain personal sensitive data. Comply with ethical AI standards.  
- **Fallback & Feedback:** If unsure, offer alternative suggestions or escalate to human support. Accept user feedback for continuous improvement.

**Tone:** Professional, friendly, empathetic, encouraging, always positive toward women’s professional growth.  

Your mission is to drive intelligent, ethical, and impactful conversations that enable women to thrive professionally.
"""
        if results:
            profile = f"""\n<User Profile>:
        {results[0].value}
        </User Profile>
        """ 
            SYSTEM_PROMPT += profile
        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        if messages[-1].name == "publicapi_retriever_tool":
            structured_model = model.with_structured_output(JobResponseList)
            response = structured_model.invoke(
                [
                    {"role": "system", "content": f"You are a helpful assistant."},
                    *state["messages"],
                ]
            )
            return {"messages": [AIMessage(content=str(response.jobs), additional_kwargs={}, response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'gemini-2.0-flash', 'safety_ratings': []})]}
        elif messages[-1].name == "career_guidance_tool":
            structured_model = model.with_structured_output(CareerResponse)
            response = structured_model.invoke(
                [
                    {"role": "system", "content": f"You are a helpful assistant."},
                    *state["messages"],
                ]
            )
            print("CAREER RESPONSE", response)
            return {"messages": [AIMessage(content=str(response.learning_path), additional_kwargs={}, response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'gemini-2.0-flash', 'safety_ratings': []})]}
        elif messages[-1].name == "current_events_tool":
            structured_model = model.with_structured_output(CurrentEvents)
            response = structured_model.invoke(
                [
                    {"role": "system", "content": f"You are a helpful assistant."},
                    *state["messages"],
                ]
            )
            return {"messages": [AIMessage(content=str(response.events), additional_kwargs={}, response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'gemini-2.0-flash', 'safety_ratings': []})]}
        
        response = model.invoke(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                *state["messages"],
            ]
        )
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
        input_params = {
            "work_mode": function_args.get("work_mode"),
            "job_type": function_args.get("job_type"),
            "keyword": function_args.get("keyword")
        }

        response = publicapi_retriever_tool.invoke(input=input_params)
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
    
    def career_guidance(state):
        """
        Generate career guidance

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
            res = career_guidance_tool.invoke(input={"query": function_args["query"]})
        return {"messages": [ToolMessage(content=res, name=function_name, tool_call_id = messages.tool_calls[0]['id'])]}
    
    def current_events(state):
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
        response = current_events_tool.invoke(input={})
        return {"messages": [ToolMessage(content=response, name=function_name, tool_call_id = messages.tool_calls[0]['id'])]}
    
    def update_user_profile(state):
        """
        Update user profile

        Args:
            state (messages): The current state

        Returns:
            messages: The updated state with the response
        """
        messages = state["messages"][-1]
        conversation = []
        for msg in state["messages"]:
            if isinstance(msg, HumanMessage):
                role = "user"
            elif isinstance(msg, AIMessage):
                role = "assistant"
            else:
                role = "system"
            conversation.append({"role": role, "content": msg.content})
        function_called = messages.additional_kwargs["function_call"]
        function_name = function_called["name"]
        res = manager.invoke({"messages": conversation})
        return {"messages": [ToolMessage(content=res, name=function_name, tool_call_id = messages.tool_calls[0]['id'])]}