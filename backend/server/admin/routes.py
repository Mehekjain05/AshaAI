import os
from dotenv import load_dotenv


load_dotenv()


os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
os.environ["TAVILY_API_KEY"] = os.getenv("TAVILY_API_KEY")

from flask import Blueprint

users = Blueprint(name='users', import_name=__name__)