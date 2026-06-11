from flask import Flask, render_template, request, jsonify, redirect, session, url_for
import requests as req
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret')
API = os.getenv('BACKEND_URL', 'http://localhost:5000/api')

def get_headers():
    token = session.get('token')
    return {'Authorization': f'Bearer {token}'} if token else {}

# ---- Page routes ----
@app.route('/test')
def test():
    return render_template('test.html')

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

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    try:
        res = req.post(f'{API}/auth/login', json=data, timeout=10)
        result = res.json()
        if res.status_code == 200:
            session['token'] = result['token']
            session['user'] = result['user']
        return jsonify(result), res.status_code
    except Exception as e:
        return jsonify({'error': 'Backend unreachable'}), 503

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    try:
        res = req.post(f'{API}/auth/register', json=data, timeout=10)
        return jsonify(res.json()), res.status_code
    except Exception as e:
        return jsonify({'error': 'Backend unreachable'}), 503

if __name__ == '__main__':
    app.run(port=3000, debug=True)