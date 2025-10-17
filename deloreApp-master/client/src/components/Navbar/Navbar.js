import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <h2>Delore</h2>
        </Link>

        {isAuthenticated ? (
          <div className="navbar-menu">
            <div className="navbar-nav">
              <Link 
                to="/dashboard" 
                className="nav-link"
              >
                Dashboard
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="nav-link"
                >
                  Admin Panel
                </Link>
              )}
            </div>

            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">Welcome, {user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary btn-logout"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
