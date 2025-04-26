from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import uuid
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.environ.get('MONGODB_URI')
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# Database and collection setup
db = client["asha_admin"]
analytics_collection = db["admin_data"]

def insert_analytics_record(data: dict):
    try:
        query_id = str(uuid.uuid4())
        data["query_id"] = query_id
        result = analytics_collection.insert_one(data)
        print(f"Inserted document with ID: {result.inserted_id}")
    except Exception as e:
        print(f"Insert failed: {e}")
