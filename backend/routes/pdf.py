from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app import db
from models import PDF
from middleware import token_required, admin_required
import os, time
from werkzeug.utils import secure_filename

pdf_bp = Blueprint('pdf', __name__)
ALLOWED = {'pdf'}

def allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

@pdf_bp.route('/', methods=['GET'])
@token_required
def get_pdfs(current_user):
    semester = request.args.get('semester', current_user.semester)
    pdfs = PDF.query.filter_by(semester=semester).order_by(PDF.upload_date.desc()).all()
    return jsonify({'pdfs': [p.to_dict() for p in pdfs]}), 200

@pdf_bp.route('/all', methods=['GET'])
@token_required
def get_all_pdfs(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    pdfs = PDF.query.order_by(PDF.upload_date.desc()).all()
    return jsonify({'pdfs': [p.to_dict() for p in pdfs]}), 200

@pdf_bp.route('/<int:pdf_id>', methods=['GET'])
@token_required
def get_pdf(current_user, pdf_id):
    pdf = PDF.query.get_or_404(pdf_id)
    return jsonify({'pdf': pdf.to_dict()}), 200

@pdf_bp.route('/file/<int:pdf_id>', methods=['GET'])
def serve_pdf(pdf_id):
    pdf = PDF.query.get_or_404(pdf_id)
    return send_from_directory(os.path.abspath(current_app.config['UPLOAD_FOLDER']), pdf.filename)

@pdf_bp.route('/', methods=['POST'])
@token_required
@admin_required
def upload_pdf(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    title = request.form.get('title')
    semester = request.form.get('semester')
    if not title: return jsonify({'error': 'Title required'}), 400
    if not semester: return jsonify({'error': 'Semester required'}), 400
    if not file.filename: return jsonify({'error': 'No file selected'}), 400
    if not allowed(file.filename): return jsonify({'error': 'PDF only'}), 400
    base, ext = os.path.splitext(secure_filename(file.filename))
    filename = f"{base}_{int(time.time())}{ext}"
    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
    pdf = PDF(title=title, filename=filename, semester=semester,
          uploaded_by=current_user.id, file_url='')
    db.session.add(pdf)
    db.session.commit()
    # Now pdf has id
    pdf.file_url = f'http://localhost:5000/api/pdf/file/{pdf.id}'
    db.session.commit()
    db.session.add(pdf)
    db.session.commit()
    # Fix file_url now we have id
    pdf.file_url = f'http://localhost:5000/api/pdf/file/{pdf.id}'
    db.session.commit()
    return jsonify({'message': 'Uploaded', 'pdf': pdf.to_dict()}), 201

@pdf_bp.route('/<int:pdf_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_pdf(current_user, pdf_id):
    pdf = PDF.query.get_or_404(pdf_id)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], pdf.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    db.session.delete(pdf)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200