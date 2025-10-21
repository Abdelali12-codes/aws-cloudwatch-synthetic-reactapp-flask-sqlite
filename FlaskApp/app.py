from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import timedelta
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

CORS(app, supports_credentials=True, origins=['*'])

def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/health', methods=['GET'])
def health():
    return jsonify(status="healthy"), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    hashed_password = generate_password_hash(password)
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                  (username, email, hashed_password))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        session.permanent = True
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({
            'message': 'Registration successful',
            'user': {'id': user_id, 'username': username, 'email': email}
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT id, username, email, password FROM users WHERE username = ?', (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[3], password):
        session.permanent = True
        session['user_id'] = user[0]
        session['username'] = user[1]
        
        return jsonify({
            'message': 'Login successful',
            'user': {'id': user[0], 'username': user[1], 'email': user[2]}
        }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('SELECT id, username, email FROM users WHERE id = ?', (session['user_id'],))
        user = c.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'authenticated': True,
                'user': {'id': user[0], 'username': user[1], 'email': user[2]}
            }), 200
    
    return jsonify({'authenticated': False}), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)