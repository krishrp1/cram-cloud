from flask import Flask, render_template, request, jsonify, redirect, session
import requests as req
import os
from dotenv import load_dotenv

from config import SEMESTERS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
if not app.secret_key:
    raise RuntimeError('SECRET_KEY environment variable is not set')

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=os.getenv('FLASK_ENV') == 'production',
)

API = os.getenv('BACKEND_URL', 'http://localhost:8000/api')
REQUEST_TIMEOUT = 10
UPLOAD_TIMEOUT = 30


def get_headers():
    token = session.get('token')
    return {'Authorization': f'Bearer {token}'} if token else {}


@app.context_processor
def inject_globals():
    return {'semesters': SEMESTERS}


# ---- Page routes ----

@app.route('/')
def index():
    if not session.get('token'):
        return redirect('/login')
    return redirect('/dashboard')

@app.route('/login')
def login_page():
    if session.get('token'):
        return redirect('/dashboard')
    return render_template('login.html')

@app.route('/register')
def register_page():
    if session.get('token'):
        return redirect('/dashboard')
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    if not session.get('token'):
        return redirect('/login')
    return render_template('dashboard.html')

@app.route('/forum')
def forum():
    if not session.get('token'):
        return redirect('/login')
    return render_template('forum.html')

@app.route('/admin')
def admin():
    if not session.get('token'):
        return redirect('/login')
    user = session.get('user', {})
    if user.get('role') != 'admin':
        return redirect('/dashboard')
    return render_template('admin.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

# ---- API proxy routes ----
# Login/register set up the server-side session; everything else after that
# goes through the generic proxy below, which attaches the bearer token
# server-side so the JWT never touches the browser (localStorage/XSS risk).

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True)
    try:
        res = req.post(f'{API}/auth/login', json=data, timeout=REQUEST_TIMEOUT)
        result = res.json()
        if res.status_code == 200:
            session['token'] = result['token']
            session['user'] = result['user']
        return jsonify(result), res.status_code
    except req.exceptions.RequestException:
        return jsonify({'error': 'Backend unreachable'}), 503

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True)
    try:
        res = req.post(f'{API}/auth/register', json=data, timeout=REQUEST_TIMEOUT)
        return jsonify(res.json()), res.status_code
    except req.exceptions.RequestException:
        return jsonify({'error': 'Backend unreachable'}), 503

@app.route('/api/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(subpath):
    if not session.get('token'):
        return jsonify({'error': 'Not authenticated'}), 401

    url = f'{API}/{subpath}'
    headers = get_headers()

    try:
        if request.method == 'GET':
            res = req.get(url, headers=headers, params=request.args, timeout=REQUEST_TIMEOUT)
        elif request.method == 'DELETE':
            res = req.delete(url, headers=headers, params=request.args, timeout=REQUEST_TIMEOUT)
        elif request.content_type and 'multipart/form-data' in request.content_type:
            files = {name: (f.filename, f.stream, f.mimetype) for name, f in request.files.items()}
            res = req.request(request.method, url, headers=headers, data=request.form,
                               files=files, timeout=UPLOAD_TIMEOUT)
        else:
            res = req.request(request.method, url, headers=headers,
                               json=request.get_json(silent=True), timeout=REQUEST_TIMEOUT)
    except req.exceptions.RequestException:
        return jsonify({'error': 'Backend unreachable'}), 503

    if res.status_code == 401:
        session.clear()

    content_type = res.headers.get('Content-Type', 'application/json')
    return res.content, res.status_code, {'Content-Type': content_type}

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(port=port, debug=os.getenv('FLASK_ENV') != 'production')
