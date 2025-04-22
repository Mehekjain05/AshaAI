from typing import Annotated, Sequence
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from core.node import Node
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

class AshaAI:
    @staticmethod
    def route(state: AgentState):
        if state["messages"][-1].tool_calls:
            if state["messages"][-1].additional_kwargs["function_call"]["name"] == "vectorstore_retriever_tool":
                return "vector_store_retrieve"
            elif state["messages"][-1].additional_kwargs["function_call"]["name"] == "publicapi_retriever_tool":
                return "publicapi_retrieve"
            elif state["messages"][-1].additional_kwargs["function_call"]["name"] == "career_guidance_tool":
                return "career_guidance"
        return END

    @staticmethod
    def create_agent():
        
        memory = MemorySaver()

        workflow = StateGraph(AgentState)

        workflow.add_node("agent", Node.agent)
        workflow.add_node("vector_store_retrieve", Node.vector_store_retrieve)
        workflow.add_node("publicapi_retrieve", Node.publicapi_retrieve)
        workflow.add_node("career_guidance", Node.career_guidance)
        workflow.add_node(
            "generate", Node.generate
        )
        workflow.add_edge(START, "agent")

        workflow.add_conditional_edges(
            "agent",
            AshaAI.route,
            {
                "vector_store_retrieve": "vector_store_retrieve",
                "publicapi_retrieve": "publicapi_retrieve",
                "career_guidance": "career_guidance",
                END: END
            },
        )

        workflow.add_edge("vector_store_retrieve", "generate")
        workflow.add_edge("publicapi_retrieve", "generate")
        workflow.add_edge("career_guidance", "generate")
        workflow.add_edge("generate", END)
        # Compile
        graph = workflow.compile(checkpointer=memory)

        return graph

    