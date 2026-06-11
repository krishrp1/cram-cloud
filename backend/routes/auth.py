from flask import Blueprint, request, jsonify
from app import db
from models import User
from middleware import token_required
import jwt, os
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    for field in ['email', 'password', 'semester']:
        if not data or not data.get(field):
            return jsonify({'error': f'Missing: {field}'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(email=data['email'], role=data.get('role', 'student'), semester=data['semester'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Registered', 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = jwt.encode({
        'user_id': user.id, 'email': user.email,
        'role': user.role, 'semester': user.semester,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, os.getenv('JWT_SECRET'), algorithm='HS256')
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def me(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    return jsonify({'users': [u.to_dict() for u in User.query.all()]}), 200

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200