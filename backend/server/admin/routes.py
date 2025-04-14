import os
from dotenv import load_dotenv


load_dotenv()


os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from flask import Blueprint

admin = Blueprint(name='admin', import_name=__name__)