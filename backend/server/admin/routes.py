import os
from dotenv import load_dotenv
from .admin_db import analytics_collection  

load_dotenv()


os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from flask import Blueprint, jsonify

admin = Blueprint(name='admin', import_name=__name__)

@admin.route("/dashboard", methods=["GET"])
def get_analytics():
    try:
        # Fetch all analytics records
        records = list(analytics_collection.find({}, {'_id': 0}))  # Exclude Mongo _id field

        return jsonify({
            "success": True,
            "data": records
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
