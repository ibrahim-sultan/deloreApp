import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Password resets are managed by your administrator</p>
        </div>

        <div className="alert alert-info" role="alert" style={{ marginBottom: '16px' }}>
          Please contact your admin to reset your password.
        </div>

        <div className="auth-footer">
          <Link to="/login" className="link">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
