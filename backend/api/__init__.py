import os
from flask import Flask
from .config import Config
from .extensions import db, migrate, bcrypt, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    cors.init_app(app)

    from .routes.auth import auth_bp
    from .routes.presentations import presentations_bp
    from .routes.slides import slides_bp
    from .routes.elements import elements_bp
    from .routes.ai_generator import ai_bp 

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(presentations_bp, url_prefix='/api')
    app.register_blueprint(slides_bp, url_prefix='/api')
    app.register_blueprint(elements_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api')

    return app