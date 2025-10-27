import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin' },
    { name: 'Assign Task', icon: '📝', path: '/admin/assign-task' },
    { name: 'Manage Staff', icon: '👥', path: '/admin/staff' },
    { name: 'Manage Clients', icon: '🏢', path: '/admin/clients' },
    { name: 'Staff Logs', icon: '📋', path: '/admin/staff-logs' },
    { name: 'Staff Reports', icon: '📊', path: '/admin/staff-reports' },
    { name: 'Payroll', icon: '💰', path: '/admin/payments' },
    { name: 'Messages', icon: '💬', path: '/admin/messages' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">D</div>
          <span className="logo-text">Delore</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-name">Admin User</div>
          <div className="user-role">{user?.email || 'admin'}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
