
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import EmergencyAdminOverview from './EmergencyAdminOverview';
import StaffManagement from './StaffManagement';
import DocumentManagement from './DocumentManagement';
import TaskManagement from './TaskManagement';
import AssignTask from './AssignTask';
import PaymentManagement from './PaymentManagement';
import MessageManagement from './MessageManagement';
import ClientManagement from './ClientManagement'; // Import ClientManagement
import AddClient from './AddClient';
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
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'admin') {
      setError('Admin access required');
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [authLoading, isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await axios.get('/api/admin/dashboard', { headers });
      setDashboardData(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      setError('Failed to load dashboard data.');
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
    if (path.includes('/clients')) return 'clients'; // Add this line
    return 'overview';
  };

  const navigateToTab = (tab) => {
    navigate(tab === 'overview' ? '/admin' : `/admin/${tab}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <h3>Dashboard Load Error</h3>
          <pre>{error}</pre>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
        </div>

        <div className="admin-tabs">
          <button className={`tab-button ${getActiveTab() === 'overview' ? 'active' : ''}`} onClick={() => navigateToTab('overview')}>Overview</button>
          <button className={`tab-button ${getActiveTab() === 'staff' ? 'active' : ''}`} onClick={() => navigateToTab('staff')}>Staff Management</button>
          <button className={`tab-button ${getActiveTab() === 'documents' ? 'active' : ''}`} onClick={() => navigateToTab('documents')}>Documents</button>
          <button className={`tab-button ${getActiveTab() === 'tasks' ? 'active' : ''}`} onClick={() => navigateToTab('tasks')}>Tasks</button>
          <button className={`tab-button ${getActiveTab() === 'payments' ? 'active' : ''}`} onClick={() => navigateToTab('payments')}>Payments</button>
          <button className={`tab-button ${getActiveTab() === 'messages' ? 'active' : ''}`} onClick={() => navigateToTab('messages')}>Messages</button>
          <button className={`tab-button ${getActiveTab() === 'clients' ? 'active' : ''}`} onClick={() => navigateToTab('clients')}>Clients</button> {/* Add this button */}
        </div>

        <div className="admin-content">
          <Routes>
            <Route path="/" element={<AdminOverview data={dashboardData} onUpdate={handleDataUpdate} />} />
            <Route path="/staff" element={<StaffManagement staffMembers={dashboardData?.staffMembers || []} onUpdate={handleDataUpdate} />} />
            <Route path="/documents" element={<DocumentManagement documentsByStaff={dashboardData?.documentsByStaff || []} onUpdate={handleDataUpdate} />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/assign-task" element={<AssignTask />} />
            <Route path="/payments" element={<PaymentManagement staffMembers={dashboardData?.staffMembers || []} onUpdate={handleDataUpdate} />} />
            <Route path="/messages" element={<MessageManagement staffMembers={dashboardData?.staffMembers || []} onUpdate={handleDataUpdate} />} />
            <Route path="/clients" element={<ClientManagement />} /> {/* Add this route */}
            <Route path="/add-client" element={<AddClient />} />
          </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
