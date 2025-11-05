import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './StaffSidebar.css';

const getIcon = (iconName) => {
  const icons = {
    'house-fill': '🏠',
    'calendar-fill': '📅',
    'file-text-fill': '📄',
    'dollar-sign': '💵',
    'umbrella-fill': '☂️',
    'chat-fill': '💬',
    'person-lock-fill': '👤'
  };
  return icons[iconName] || '•';
};

const StaffSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'house-fill', path: '/staff/dashboard' },
    { name: 'Schedule', icon: 'calendar-fill', path: '/staff/schedule' },
    { name: 'Documents', icon: 'file-text-fill', path: '/staff/documents' },
    { name: 'Pay Stubs', icon: 'dollar-sign', path: '/staff/paystubs' },
    { name: 'Request Leave', icon: 'umbrella-fill', path: '/staff/leave' },
    { name: 'Messages', icon: 'chat-fill', path: '/staff/messages' },
    { name: 'Profile & Security', icon: 'person-lock-fill', path: '/staff/profile' }
  ];

  return (
    <>
      {isOpen && <div className="staff-sidebar-overlay" onClick={onClose}></div>}
      <div className={`staff-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="staff-sidebar-header">
        <div className="staff-logo">
          <div className="staff-logo-icon">D</div>
          <span className="staff-logo-text">Delore</span>
        </div>
      </div>

      <nav className="staff-sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`staff-nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
          >
            <span className="staff-nav-icon">{getIcon(item.icon)}</span>
            <span className="staff-nav-text">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="staff-user-section">
        <div className="staff-user-box">
          <div className="staff-user-role">Staff Member</div>
          <div className="staff-user-type">Staff</div>
        </div>
      </div>

      <div className="staff-sidebar-footer">
        <button className="staff-logout-btn" onClick={handleLogout}>
          <span className="staff-nav-icon">→</span>
          <span className="staff-nav-text">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default StaffSidebar;

