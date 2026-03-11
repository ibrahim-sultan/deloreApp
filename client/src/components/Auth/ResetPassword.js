import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ loading: false, message: '', error: 'Invalid or missing token' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ loading: false, message: '', error: 'Passwords do not match' });
      return;
    }

    setStatus({ loading: true, message: '', error: '' });
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword: form.newPassword });
      setStatus({ loading: false, message: 'Password reset successful. Redirecting to login...', error: '' });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setStatus({ loading: false, message: '', error: msg });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter a new password for your account</p>
        </div>

        {status.error && <div className="alert alert-error">{status.error}</div>}
        {status.message && <div className="alert alert-success">{status.message}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-input"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={status.loading}>
            {status.loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="link">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
