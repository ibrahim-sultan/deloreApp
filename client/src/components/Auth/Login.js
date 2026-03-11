import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const { login, isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Handle navigation after authentication state is updated
  useEffect(() => {
    if (pendingNavigation && isAuthenticated && user) {
      console.log('Authentication confirmed, navigating to:', pendingNavigation);
      navigate(pendingNavigation, { replace: true });
      setPendingNavigation(null);
      setLoading(false);
    }
  }, [isAuthenticated, user, pendingNavigation, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPendingNavigation(null);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      console.log('Login successful, user role:', result.user.role);
      
      // Set pending navigation based on user role
      const targetRoute = result.user.role === 'admin' ? '/admin' : '/dashboard';
      console.log('Setting pending navigation to:', targetRoute);
      setPendingNavigation(targetRoute);
      
      // The useEffect will handle the actual navigation once state is updated
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your Delore account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <div style={{ marginTop: '12px' }}>
            <Link to="/forgot-password" className="link">
              Forgot your password?
            </Link>
          </div>
          <div style={{ marginTop: '12px' }}>
            <Link to="/privacy-policy" className="link">
              Privacy Policy
            </Link>
          </div>
          <p className="auth-note">
            Staff accounts are created by administrators only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
