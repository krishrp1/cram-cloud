from app import db
from datetime import datetime

class PDF(db.Model):
    __tablename__ = 'pdfs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    semester = db.Column(db.String(50), nullable=False, index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    uploader = db.relationship('User', backref='pdfs')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'filename': self.filename,
            'semester': self.semester,
            'uploadedBy': self.uploader.email,
            'fileUrl': self.file_url,
            'uploadDate': self.upload_date.isoformat()
        }