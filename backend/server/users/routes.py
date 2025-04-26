import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
os.environ["TAVILY_API_KEY"] = os.getenv("TAVILY_API_KEY")

from flask import Blueprint, request, jsonify, Response, stream_with_context
import json
from core.agent import AshaAI
from core.guardrails import CustomDetectPII, CustomDetectBias
from guardrails import Guard
from guardrails.classes import ValidationOutcome
from ..admin.admin_db import insert_analytics_record
import time
users = Blueprint(name='users', import_name=__name__)

GUARD = Guard().use_many(CustomDetectPII(on_fail="fix"), CustomDetectBias(on_fail="fix"))
ASHA = AshaAI.create_agent()

start_time = time.time()

@users.route("/chat", methods=["GET", "POST"])
def agent_chat():
    user_id = "user-123"
    data: dict = request.get_json()
    user_message = data.get("query")

    if not user_message:
        return "No message provided", 400

    validation_results: ValidationOutcome = GUARD.validate(user_message)

    bias_detected = False
    if validation_results.validation_summaries:
        for summary in validation_results.validation_summaries:
             if summary.validator_name == 'CustomDetectBias':
                bias_detected = True
                break
    
    def detect_query_type(query: str) -> str:
        q = query.lower()
        if "job" in q or "internship" in q:
            return "job"
        elif "event" in q or "webinar" in q:
            return "events"
        elif "career" in q or "guidance" in q:
            return "career_guidance"
        else:
            return "other"
    
    def generate():
        if bias_detected:
            error_data = {
                "payload_type": "validation_error",
                "validator": "CustomDetectBias",
                "outcome": "fail",
                "details": validation_results.to_dict()
            }
            yield f"data: {json.dumps(error_data)}\n\n".encode("utf-8")
            return

        inputs = {
            "messages": [
                {"role": "user", "content": validation_results.validated_output},
            ]
        }
        config = {"configurable": {"user_id": user_id, "thread_id": "1"}}

        for s in ASHA.stream(
            inputs, config=config, stream_mode=["values", "messages"]
        ):
            function_name = None
            arguments = None
            function_call = False
            tool_call = False
            tool_name = None
            content = None

            if s[0] == "messages":
                message_chunk = s[1][0]
                content = message_chunk.content

                if hasattr(message_chunk, "additional_kwargs") and message_chunk.additional_kwargs.get(
                    "function_call"
                ):
                    print(f"Function call: {message_chunk.additional_kwargs['function_call']}")
                    function_call = True
                    function_name = message_chunk.additional_kwargs["function_call"]["name"]
                    try:
                        arguments = json.loads(message_chunk.additional_kwargs["function_call"]["arguments"])
                    except json.JSONDecodeError:
                         arguments = message_chunk.additional_kwargs["function_call"]["arguments"]
                         print("Partial arguments received or invalid JSON:", arguments)
                         arguments = {"raw": arguments, "status": "incomplete"}


                elif hasattr(message_chunk, "tool_call_id"):
                    print(f"Tool call detected (tool_call_id): {message_chunk.tool_call_id}")
                    tool_call = True
                    tool_name = getattr(message_chunk, 'name', 'unknown_tool')

                data = {
                    "payload_type": "message",
                    "content": content,
                    "function_call": function_call,
                    "function_name": function_name,
                    "arguments": arguments,
                    "tool_call": tool_call,
                    "tool_name": tool_name,
                }
                yield f"data: {json.dumps(data)}\n\n".encode("utf-8")

            elif s[0] == "values":
                values_data = s[1]
                data = {}
                data["payload_type"] = "values"
                if "action" in values_data:
                    data["action"] = values_data["action"]
                if "error" in values_data:
                    data["error"] = values_data["error"]
                if "final_answer" in values_data:
                    data["final_answer"] = values_data["final_answer"]

                if len(data) > 1:
                     yield f"data: {json.dumps(data)}\n\n".encode("utf-8")
    
    response_time_ms = int((time.time() - start_time) * 1000)
   
    analytics_data = {
    "user_id": user_id,  # Replace with real user ID if dynamic
    "user_query": validation_results.validated_output,
    "query_type": detect_query_type(user_message),
    "page_visited": "chatbot",
    "response_time_ms": response_time_ms,
    "timestamp": datetime.utcnow().isoformat()
    # "clicked_job_id": None,  # Update this when job click is implemented

    }
    insert_analytics_record(analytics_data)
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
    )