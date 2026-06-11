from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import config
import os

db = SQLAlchemy()

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    CORS(app)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    from routes.auth import auth_bp
    from routes.pdf import pdf_bp
    from routes.comments import comments_bp
    from routes.forum import forum_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(pdf_bp, url_prefix='/api/pdf')
    app.register_blueprint(comments_bp, url_prefix='/api/comments')
    app.register_blueprint(forum_bp, url_prefix='/api/forum')

    with app.app_context():
        db.create_all()

    return app