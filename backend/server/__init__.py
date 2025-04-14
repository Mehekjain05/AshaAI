from flask import Flask
# from flask_bcrypt import Bcrypt
from server.config import Config
from flask_cors import CORS

# bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    app.json.sort_keys = False
    CORS(app, supports_credentials=True)

    # bcrypt.init_app(app)

    from server.users.routes import users
    from server.admin.routes import admin
    app.register_blueprint(users, url_prefix = "/users")
    app.register_blueprint(admin, url_prefix = "/admin")
    return app