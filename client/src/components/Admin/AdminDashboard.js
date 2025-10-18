import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import EmergencyAdminOverview from './EmergencyAdminOverview';
import StaffManagement from './StaffManagement';
import DocumentManagement from './DocumentManagement';
import TaskManagement from './TaskManagement';
import PaymentManagement from './PaymentManagement';
import MessageManagement from './MessageManagement';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorBoundary from '../Common/ErrorBoundary';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('AdminDashboard useEffect:', { authLoading, isAuthenticated, user: user?.email });
    
    // Wait for auth to be determined
    if (authLoading) {
      console.log('Still checking authentication...');
      return;
    }
    
    // Check if user is authenticated and is admin
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to login');
      setError('Authentication required');
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      console.log('User is not admin:', user.role);
      setError('Admin access required');
      setLoading(false);
      return;
    }
    
    // Check if we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      setError('Session expired - please login again');
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    
    console.log('Authentication confirmed for admin:', user.email);
    console.log('Token present, fetching dashboard data...');
    
    // Everything looks good, fetch dashboard data
    fetchDashboardData();
  }, [authLoading, isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin dashboard data...');
      
      // Get fresh token from localStorage
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('No authentication token found');
        setError('Please login again - session expired');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      // Set token in axios headers for this request
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Making request with headers:', headers);
      console.log('Request URL: /api/admin/dashboard-test');
      
      const response = await axios.get('/api/admin/dashboard-test', { headers });
      console.log('Dashboard data fetched successfully');
      setDashboardData(response.data);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      let errorMessage = 'Something went wrong while rendering this page.';
      let errorDetails = '';
      
      if (error.response?.status === 401) {
        errorMessage = 'Unauthorized access. Please login again.';
        // Force logout on auth error
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while loading dashboard.';
        errorDetails = error.response?.data?.error || error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorDetails = error.response.data.error || '';
      } else if (error.message) {
        errorMessage = 'Network or connection error';
        errorDetails = error.message;
      }
      
      // Show detailed error in development or for debugging
      const fullErrorMessage = errorDetails ? 
        `${errorMessage}\n\nDetails: ${errorDetails}\nStatus: ${error.response?.status || 'Unknown'}\nURL: ${error.config?.url || '/api/admin/dashboard'}` :
        errorMessage;
      
      setError(fullErrorMessage);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    fetchDashboardData();
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/messages')) return 'messages';
    return 'overview';
  };

  const navigateToTab = (tab) => {
    if (tab === 'overview') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tab}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <h3>Dashboard Load Error</h3>
          <pre style={{whiteSpace: 'pre-wrap', fontSize: '14px', marginTop: '10px'}}>
            {error}
          </pre>
          <div style={{marginTop: '15px'}}>
            <button 
              onClick={() => {
                setError('');
                fetchDashboardData();
              }}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry Loading Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage staff, documents, tasks, and payments</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${getActiveTab() === 'overview' ? 'active' : ''}`}
          onClick={() => navigateToTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${getActiveTab() === 'staff' ? 'active' : ''}`}
          onClick={() => navigateToTab('staff')}
        >
          Staff Management
          {dashboardData?.statistics?.totalStaff > 0 && (
            <span className="tab-badge">{dashboardData.statistics.totalStaff}</span>
          )}
        </button>
        <button
          className={`tab-button ${getActiveTab() === 'documents' ? 'active' : ''}`}
          onClick={() => navigateToTab('documents')}
        >
          Documents
          {dashboardData?.statistics?.totalDocuments > 0 && (
            <span className="tab-badge">{dashboardData.statistics.totalDocuments}</span>
          )}
        </button>
        <button
          className={`tab-button ${getActiveTab() === 'tasks' ? 'active' : ''}`}
          onClick={() => navigateToTab('tasks')}
        >
          Tasks
          {dashboardData?.statistics?.totalTasks > 0 && (
            <span className="tab-badge">{dashboardData.statistics.totalTasks}</span>
          )}
        </button>
        <button
          className={`tab-button ${getActiveTab() === 'payments' ? 'active' : ''}`}
          onClick={() => navigateToTab('payments')}
        >
          Payments
          {dashboardData?.statistics?.totalPayments > 0 && (
            <span className="tab-badge">{dashboardData.statistics.totalPayments}</span>
          )}
        </button>
        <button
          className={`tab-button ${getActiveTab() === 'messages' ? 'active' : ''}`}
          onClick={() => navigateToTab('messages')}
        >
          Messages
        </button>
      </div>

      <div className="admin-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <EmergencyAdminOverview 
                data={dashboardData} 
                onUpdate={handleDataUpdate} 
              />
            } 
          />
          <Route 
            path="/staff" 
            element={
              <StaffManagement 
                staffMembers={dashboardData?.staffMembers || []}
                onUpdate={handleDataUpdate} 
              />
            } 
          />
          <Route 
            path="/documents" 
            element={
              <DocumentManagement 
                documentsByStaff={dashboardData?.documentsByStaff || []}
                onUpdate={handleDataUpdate} 
              />
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <TaskManagement 
                tasksByStaff={dashboardData?.tasksByStaff || []}
                onUpdate={handleDataUpdate} 
              />
            } 
          />
          <Route 
            path="/payments" 
            element={
              <PaymentManagement 
                staffMembers={dashboardData?.staffMembers || []}
                onUpdate={handleDataUpdate} 
              />
            } 
          />
          <Route 
            path="/messages" 
            element={
              <MessageManagement 
                staffMembers={dashboardData?.staffMembers || []}
                onUpdate={handleDataUpdate} 
              />
            } 
          />
        </Routes>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
