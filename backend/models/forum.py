from app import db
from datetime import datetime

class ForumThread(db.Model):
    __tablename__ = 'forum_threads'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    semester = db.Column(db.String(50), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='threads')
    replies = db.relationship('ForumReply', backref='thread', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'userName': self.user.email,
            'title': self.title,
            'content': self.content,
            'semester': self.semester,
            'createdAt': self.created_at.isoformat(),
            'replyCount': len(self.replies)
        }

class ForumReply(db.Model):
    __tablename__ = 'forum_replies'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey('forum_threads.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='replies')

    def to_dict(self):
        return {
            'id': self.id,
            'threadId': self.thread_id,
            'userId': self.user_id,
            'userName': self.user.email,
            'content': self.content,
            'createdAt': self.created_at.isoformat()
        }