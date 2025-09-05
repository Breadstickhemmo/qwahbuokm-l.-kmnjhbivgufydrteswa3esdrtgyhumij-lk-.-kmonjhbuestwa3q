from flask import request, jsonify, Blueprint, current_app
from datetime import datetime, timedelta, timezone
import jwt
import re
from ..models import User
from ..extensions import db, bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email и пароль обязательны'}), 400

    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        return jsonify({'message': 'Некорректный формат email'}), 400

    if len(password) < 6:
        return jsonify({'message': 'Пароль должен быть не менее 6 символов'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Пользователь с таким email уже существует'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Пользователь успешно зарегистрирован'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email и пароль обязательны'}), 400

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'is_admin': user.is_admin
            }
        }), 200
    
    return jsonify({'message': 'Неверный email или пароль'}), 401