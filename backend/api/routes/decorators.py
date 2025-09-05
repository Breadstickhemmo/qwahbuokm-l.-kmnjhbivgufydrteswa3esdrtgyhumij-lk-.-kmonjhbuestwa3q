from functools import wraps
from flask import request, jsonify, g
import jwt
from flask import current_app
from ..models import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'authorization' in request.headers:
            token = request.headers['authorization'].split(' ')[1]
        if not token:
            return jsonify({'message': 'Токен аутентификации отсутствует'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            g.current_user = User.query.get(data['user_id'])
            if not g.current_user:
                return jsonify({'message': 'Пользователь не найден'}), 401
        except Exception as e:
            print(f"Token error: {e}")
            return jsonify({'message': 'Недействительный токен'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.current_user or not g.current_user.is_admin:
            return jsonify({"message": "Требуются права администратора"}), 403
        return f(*args, **kwargs)
    return decorated_function