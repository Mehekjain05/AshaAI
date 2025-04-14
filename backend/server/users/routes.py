import os
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")


from flask import Blueprint, request, jsonify, Response, stream_with_context
import json
from core.agent import AshaAI

users = Blueprint(name='users', import_name=__name__)
ASHA = AshaAI.create_agent()
@users.route("/chat", methods = ["GET", "POST"])
def agent_chat():
    data: dict = request.get_json()
    user_message = data.get("query")
    if not user_message:
        return "No message provided", 400

    inputs = {
        "messages":[
            {"role": "user", "content": user_message},
        ]
    }
    config = {"configurable": {"user_id": "user-123", "thread_id": "1"}}


    def generate():
        for s in ASHA.stream(
            inputs, config=config, stream_mode=["values", "messages"]
        ):
            # print(f"\n\nStreamed response: \n{s}\n\n")
            function_name = None
            arguments = None
            function_call = False
            tool_call = False
            tool_name = None
            if s[0]=="messages":
                s = s[1]
                if hasattr(s[0], "additional_kwargs") and s[0].additional_kwargs.get(
                    "function_call"
                ):
                    print(f"Function call: {s[0].additional_kwargs['function_call']}")
                    function_call = True
                    function_name = s[0].additional_kwargs["function_call"]["name"]
                    arguments = json.loads(
                        s[0].additional_kwargs["function_call"]["arguments"]
                    )
                elif hasattr(s[0], "tool_call_id"):
                    print(f"Tool call: {s[0].name}")
                    tool_name = s[0].name
                    tool_call = True

                data = {
                    "payload_type": "message",
                    "content": s[0].content,
                    "function_call": function_call,
                    "function_name": function_name,
                    "arguments": arguments,
                    "tool_call": tool_call,
                    "tool_name": tool_name,
                }
                yield f"data: {json.dumps(data)}\n\n".encode("utf-8")
            elif s[0] == "values":
                values_data = s[1]
                print("VALUES DATA", values_data)
                data = {}
                data["payload_type"] = "values"
                if "error" or "action" in values_data:
                    if "action" in values_data:
                        action = values_data["action"]
                        data["action"] = action
                    if "error" in values_data:
                        error_message = values_data["error"]
                        data["error"] = error_message
                yield f"data: {json.dumps(data)}\n\n".encode("utf-8")
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
    )