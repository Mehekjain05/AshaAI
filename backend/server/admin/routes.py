import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify
from server.admin.admin_db import db
from collections import defaultdict

load_dotenv()


os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from flask import Blueprint

admin = Blueprint(name='admin', import_name=__name__)

@admin.route("/analytics", methods=["GET"])
def get_analytics():
    collection = db["admin_data"]

    # Get all analytics records
    data = list(collection.find({}).sort("timestamp", 1))  # Oldest to newest

    user_ids = set()
    query_type_freq = defaultdict(int)
    response_times_by_query = defaultdict(list)

    for doc in data:
        user_ids.add(doc.get("user_id"))
        query_type = doc.get("query_type")
        query_type_freq[query_type] += 1
        response_times_by_query[query_type].append({
            "timestamp": doc.get("timestamp"),
            "response_time_ms": doc.get("response_time_ms")
        })

    return jsonify({
        "user_count": len(user_ids),
        "query_type_frequency": query_type_freq,
        "response_times_by_query_type": response_times_by_query
    })