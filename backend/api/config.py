import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/uploads')
    KANDINSKY_API_KEY=os.environ.get('KANDINSKY_API_KEY')
    KANDINSKY_SECRET_KEY=os.environ.get('KANDINSKY_SECRET_KEY')
    TELEGRAM_BOT_TOKEN=os.environ.get('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHAT_ID=os.environ.get('TELEGRAM_CHAT_ID')