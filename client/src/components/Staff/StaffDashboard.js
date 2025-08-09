import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DocumentUpload from './DocumentUpload';
import TaskCreation from './TaskCreation';
import PaymentView from './PaymentView';
import MessageView from './MessageView';
import LoadingSpinner from '../Common/LoadingSpinner';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    documents: [],
    tasks: [],
    payments: [],
    messages: [],
    stats: {
      totalDocuments: 0,
      totalTasks: 0,
      totalPayments: 0,
      unreadMessages: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch each endpoint separately to better handle errors
      const documentsPromise = axios.get('/api/documents/my-documents').catch(error => {
        console.error('Error fetching documents:', error);
        return { data: { documents: [] } };
      });
      
      const tasksPromise = axios.get('/api/tasks/my-tasks').catch(error => {
        console.error('Error fetching tasks:', error);
        return { data: { tasks: [] } };
      });
      
      const paymentsPromise = axios.get('/api/payments/my-payments').catch(error => {
        console.error('Error fetching payments:', error);
        return { data: { payments: [] } };
      });
      
      const messagesPromise = axios.get('/api/messages/inbox').catch(error => {
        console.error('Error fetching messages:', error);
        return { data: { messages: [] } };
      });
      
      const unreadCountPromise = axios.get('/api/messages/unread/count').catch(error => {
        console.error('Error fetching unread count:', error);
        return { data: { count: 0 } };
      });

      const [documentsRes, tasksRes, paymentsRes, messagesRes, unreadCountRes] = await Promise.all([
        documentsPromise,
        tasksPromise,
        paymentsPromise,
        messagesPromise,
        unreadCountPromise
      ]);

      setDashboardData({
        documents: documentsRes.data.documents || [],
        tasks: tasksRes.data.tasks || [],
        payments: paymentsRes.data.payments || [],
        messages: messagesRes.data.messages || [],
        stats: {
          totalDocuments: documentsRes.data.documents?.length || 0,
          totalTasks: tasksRes.data.tasks?.length || 0,
          totalPayments: paymentsRes.data.payments?.length || 0,
          unreadMessages: unreadCountRes.data.count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response) {
        // Server responded with error status
        setError(`Failed to load dashboard data: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        // Request was made but no response received
        setError('Failed to load dashboard data: No response from server. Please check your connection and try again.');
      } else {
        // Something else happened
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    fetchDashboardData();
  };

  // Show loading spinner while loading or waiting for user data
  if (loading || !user) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
        <div className="alert alert-info">
          <p>This might happen if:</p>
          <ul>
            <li>The server is not running</li>
            <li>You're not properly authenticated</li>
            <li>There's a network connectivity issue</li>
          </ul>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentUpload documents={dashboardData.documents} onUpdate={handleDataUpdate} />;
      case 'tasks':
        return <TaskCreation tasks={dashboardData.tasks} onUpdate={handleDataUpdate} />;
      case 'payments':
        return <PaymentView payments={dashboardData.payments} />;
      case 'messages':
        return <MessageView messages={dashboardData.messages} onUpdate={handleDataUpdate} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.totalDocuments}</div>
          <div className="stat-label">Documents Uploaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.totalTasks}</div>
          <div className="stat-label">Tasks Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.totalPayments}</div>
          <div className="stat-label">Payment Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.unreadMessages}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Documents</h3>
          </div>
          {dashboardData.documents.length > 0 ? (
            <div className="recent-items">
              {dashboardData.documents.slice(0, 3).map(doc => (
                <div key={doc.id} className="recent-item">
                  <div className="item-info">
                    <h4>{doc.title}</h4>
                    <p>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <div className="item-date">
                    {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No documents uploaded yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
          </div>
          {dashboardData.tasks.length > 0 ? (
            <div className="recent-items">
              {dashboardData.tasks.slice(0, 3).map(task => (
                <div key={task.id} className="recent-item">
                  <div className="item-info">
                    <h4>{task.title}</h4>
                    <p>{task.location}</p>
                  </div>
                  <div className="item-status">
                    <span className={`status-badge status-${task.status}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No tasks created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}!</h1>
        <p className="page-subtitle">Manage your documents, tasks, and view your payments</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
          {dashboardData.stats.totalDocuments > 0 && (
            <span className="tab-badge">{dashboardData.stats.totalDocuments}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
          {dashboardData.stats.totalTasks > 0 && (
            <span className="tab-badge">{dashboardData.stats.totalTasks}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
          {dashboardData.stats.totalPayments > 0 && (
            <span className="tab-badge">{dashboardData.stats.totalPayments}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
          {dashboardData.stats.unreadMessages > 0 && (
            <span className="tab-badge unread">{dashboardData.stats.unreadMessages}</span>
          )}
        </button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default StaffDashboard;
