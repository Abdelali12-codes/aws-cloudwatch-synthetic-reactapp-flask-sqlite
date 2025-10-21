import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-auth', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.authenticated) {
        setUser(data.user);
        setCurrentPage('home');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setCurrentPage('home');
        setFormData({ username: '', email: '', password: '' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setCurrentPage('home');
        setFormData({ username: '', email: '', password: '' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setCurrentPage('login');
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentPage === 'login') {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (currentPage === 'home' && user) {
    return (
      <div className="dashboard-page">
        <nav className="navbar">
          <div className="navbar-container">
            <div className="navbar-content">
              <div className="navbar-brand">
                <h1>MyApp</h1>
              </div>
              <div className="navbar-user">
                <span>Welcome, {user.username}!</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="dashboard-container">
          <div className="dashboard-card">
            <h2>Dashboard</h2>
            <div className="card-grid">
              <div className="info-card">
                <h3>Profile</h3>
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
              </div>
              <div className="info-card">
                <h3>Statistics</h3>
                <p>Member since today</p>
                <p>Status: Active</p>
              </div>
              <div className="info-card">
                <h3>Quick Actions</h3>
                <p>Start exploring!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          {currentPage === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
            />
          </div>

          {currentPage === 'register' && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              placeholder="Enter your password"
            />
          </div>

          <button onClick={handleSubmit} className="submit-btn">
            {currentPage === 'login' ? 'Login' : 'Register'}
          </button>
        </div>

        <div className="toggle-link">
          <button
            onClick={() => {
              setCurrentPage(currentPage === 'login' ? 'register' : 'login');
              setError('');
              setFormData({ username: '', email: '', password: '' });
            }}
          >
            {currentPage === 'login' 
              ? "Don't have an account? Register" 
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
