import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import StaffSidebar from './StaffSidebar';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import DailyReportPage from './pages/DailyReportPage';
import PayStubsPage from './pages/PayStubsPage';
import RequestLeavePage from './pages/RequestLeavePage';
import MessagesPage from './pages/MessagesPage';
import ProfileSecurityPage from './pages/ProfileSecurityPage';
import DocumentsPage from './pages/DocumentsPage';
import LoadingSpinner from '../Common/LoadingSpinner';
import PasswordChange from '../Auth/PasswordChange';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchUserDetails();
    }
  }, [user]);

  // Redirect to dashboard if at root staff path
  useEffect(() => {
    if (location.pathname === '/staff') {
      navigate('/staff/dashboard', { replace: true });
    }
  }, [location, navigate]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUserDetails(response.data.user);
      
      if (response.data.user.isTemporaryPassword) {
        setShowPasswordChange(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = async () => {
    setShowPasswordChange(false);
    await fetchUserDetails();
  };

  if (loading || !user) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="staff-page-container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  if (showPasswordChange && userDetails?.isTemporaryPassword) {
    return (
      <div className="staff-page-container">
        <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
          <strong>Password Change Required:</strong> You must change your temporary password before accessing your dashboard.
        </div>
        <PasswordChange onPasswordChanged={handlePasswordChanged} />
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="staff-dashboard-container">
      {/* Mobile Hamburger Button */}
      <button className="staff-mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      
      <StaffSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="staff-main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/reports" element={<DailyReportPage />} />
          <Route path="/paystubs" element={<PayStubsPage />} />
          <Route path="/leave" element={<RequestLeavePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/profile" element={<ProfileSecurityPage />} />
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default StaffDashboard;
