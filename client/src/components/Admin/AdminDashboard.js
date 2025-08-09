import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import StaffManagement from './StaffManagement';
import DocumentManagement from './DocumentManagement';
import TaskManagement from './TaskManagement';
import PaymentManagement from './PaymentManagement';
import MessageManagement from './MessageManagement';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      setError('Failed to load dashboard data');
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
          {error}
        </div>
      </div>
    );
  }

  return (
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
              <AdminOverview 
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
  );
};

export default AdminDashboard;
