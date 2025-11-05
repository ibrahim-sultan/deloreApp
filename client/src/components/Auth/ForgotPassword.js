import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setStatus({ loading: false, message: 'If an account with that email exists, a reset link has been sent.', error: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset';
      setStatus({ loading: false, message: '', error: msg });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
        </div>

        {status.error && <div className="alert alert-error">{status.error}</div>}
        {status.message && <div className="alert alert-success">{status.message}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={status.loading}>
            {status.loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="link">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
