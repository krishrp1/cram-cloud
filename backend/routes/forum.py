from flask import Blueprint, request, jsonify
from app import db
from models import ForumThread, ForumReply
from middleware import token_required

forum_bp = Blueprint('forum', __name__)

@forum_bp.route('/', methods=['GET'])
@token_required
def get_threads(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    semester = request.args.get('semester', current_user.semester)
    threads = ForumThread.query.filter_by(semester=semester)\
        .order_by(ForumThread.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'threads': [t.to_dict() for t in threads.items],
        'total': threads.total, 'pages': threads.pages, 'currentPage': page
    }), 200

@forum_bp.route('/', methods=['POST'])
@token_required
def create_thread(current_user):
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content required'}), 400
    t = ForumThread(user_id=current_user.id, title=data['title'].strip(),
                    content=data['content'].strip(), semester=current_user.semester)
    db.session.add(t)
    db.session.commit()
    return jsonify({'thread': t.to_dict()}), 201

@forum_bp.route('/<int:thread_id>', methods=['GET'])
@token_required
def get_thread(current_user, thread_id):
    thread = ForumThread.query.get_or_404(thread_id)
    replies = ForumReply.query.filter_by(thread_id=thread_id)\
        .order_by(ForumReply.created_at.asc()).all()
    return jsonify({'thread': thread.to_dict(), 'replies': [r.to_dict() for r in replies]}), 200

@forum_bp.route('/<int:thread_id>', methods=['DELETE'])
@token_required
def delete_thread(current_user, thread_id):
    thread = ForumThread.query.get_or_404(thread_id)
    if thread.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(thread)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@forum_bp.route('/<int:thread_id>/reply', methods=['POST'])
@token_required
def add_reply(current_user, thread_id):
    ForumThread.query.get_or_404(thread_id)
    data = request.get_json()
    if not data or not data.get('content', '').strip():
        return jsonify({'error': 'Content required'}), 400
    r = ForumReply(thread_id=thread_id, user_id=current_user.id, content=data['content'].strip())
    db.session.add(r)
    db.session.commit()
    return jsonify({'reply': r.to_dict()}), 201

@forum_bp.route('/reply/<int:reply_id>', methods=['PUT'])
@token_required
def edit_reply(current_user, reply_id):
    r = ForumReply.query.get_or_404(reply_id)
    if r.user_id != current_user.id:
        return jsonify({'error': 'Not allowed'}), 403
    data = request.get_json()
    if not data or not data.get('content', '').strip():
        return jsonify({'error': 'Content required'}), 400
    r.content = data['content'].strip()
    db.session.commit()
    return jsonify({'reply': r.to_dict()}), 200

@forum_bp.route('/reply/<int:reply_id>', methods=['DELETE'])
@token_required
def delete_reply(current_user, reply_id):
    r = ForumReply.query.get_or_404(reply_id)
    if r.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200