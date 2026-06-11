from flask import Blueprint, request, jsonify
from app import db
from models import Comment, PDF
from middleware import token_required

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/<int:pdf_id>', methods=['GET'])
@token_required
def get_comments(current_user, pdf_id):
    PDF.query.get_or_404(pdf_id)
    comments = Comment.query.filter_by(pdf_id=pdf_id).order_by(Comment.created_at.asc()).all()
    return jsonify({'comments': [c.to_dict() for c in comments]}), 200

@comments_bp.route('/<int:pdf_id>', methods=['POST'])
@token_required
def add_comment(current_user, pdf_id):
    PDF.query.get_or_404(pdf_id)
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({'error': 'Text required'}), 400
    c = Comment(pdf_id=pdf_id, user_id=current_user.id, text=data['text'].strip())
    db.session.add(c)
    db.session.commit()
    return jsonify({'comment': c.to_dict()}), 201

@comments_bp.route('/<int:comment_id>', methods=['PUT'])
@token_required
def edit_comment(current_user, comment_id):
    c = Comment.query.get_or_404(comment_id)
    if c.user_id != current_user.id:
        return jsonify({'error': 'Not your comment'}), 403
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({'error': 'Text required'}), 400
    c.text = data['text'].strip()
    db.session.commit()
    return jsonify({'comment': c.to_dict()}), 200

@comments_bp.route('/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, comment_id):
    c = Comment.query.get_or_404(comment_id)
    if c.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(c)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
