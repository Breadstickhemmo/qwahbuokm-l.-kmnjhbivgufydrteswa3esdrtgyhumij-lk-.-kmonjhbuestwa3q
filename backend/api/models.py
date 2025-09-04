from .extensions import db
from datetime import datetime
import uuid

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    presentations = db.relationship('Presentation', backref='owner', lazy=True, cascade="all, delete-orphan")

class Presentation(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(150), nullable=False, default="Новая презентация")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    slides = db.relationship('Slide', backref='presentation', lazy=True, cascade="all, delete-orphan")

class Slide(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slide_number = db.Column(db.Integer, nullable=False)
    background_color = db.Column(db.String(7), nullable=False, default='#FFFFFF')
    presentation_id = db.Column(db.String(36), db.ForeignKey('presentation.id'), nullable=False)
    elements = db.relationship('SlideElement', backref='slide', lazy=True, cascade="all, delete-orphan")

class SlideElement(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    element_type = db.Column(db.String(10), nullable=False)
    pos_x = db.Column(db.Integer, nullable=False, default=100)
    pos_y = db.Column(db.Integer, nullable=False, default=100)
    width = db.Column(db.Integer, nullable=False, default=400)
    height = db.Column(db.Integer, nullable=False, default=150)
    content = db.Column(db.Text, nullable=True)
    font_size = db.Column(db.Integer, nullable=False, default=24)
    slide_id = db.Column(db.Integer, db.ForeignKey('slide.id'), nullable=False)