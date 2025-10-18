import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AssignTaskForm from './AssignTaskForm';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AssignTask.css';

const AssignTask = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, clientsRes] = await Promise.all([
        axios.get('/api/admin/staff', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      // Helper to safely extract array from API response
      const extractArray = (response, primaryKey) => {
        if (!response || !response.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (typeof response.data === 'object' && response.data !== null) {
          return response.data[primaryKey] || response.data.users || response.data.data || [];
        }
        return [];
      };

      const staffArray = extractArray(staffRes, 'staff');
      const clientsArray = extractArray(clientsRes, 'clients');

      const sanitizedStaff = staffArray.filter(s => s && s._id && s.name);
      const sanitizedClients = clientsArray.filter(c => c && c._id && c.name);

      setStaff(sanitizedStaff);
      setClients(sanitizedClients);
      setError('');
    } catch (err) {
      console.error('Failed to fetch data:', err);
      const serverMessage = err.response?.data?.message || '';
      const errorMessage = `An unexpected error occurred. ${serverMessage ? `Server says: ${serverMessage}` : 'Please check the console for details.'}`;
      setError(`Failed to load data. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTaskAssigned = () => {
    // Navigate back to task management page after successful assignment
    navigate('/admin/tasks');
  };

  const handleCancel = () => {
    // Navigate back to task management page
    navigate('/admin/tasks');
  };

  if (loading) {
    return (
      <div className="assign-task-page">
        <div className="page-loading">
          <LoadingSpinner />
          <p>Loading assignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assign-task-page">
        <div className="page-error">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button 
            className="error-retry-btn"
            onClick={fetchData}
          >
            <span className="btn-icon">🔄</span>
            Retry
          </button>
          <button 
            className="error-back-btn"
            onClick={handleCancel}
          >
            <span className="btn-icon">⬅️</span>
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assign-task-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={handleCancel}
              title="Back to Task Management"
            >
              <span className="back-icon">⬅️</span>
            </button>
            <div className="header-text">
              <h1 className="page-title">
                <span className="title-icon">⚙️</span>
                Assign New Task
              </h1>
              <p className="page-subtitle">
                Create and assign a task to your team members
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-icon">👥</span>
              <div className="stat-content">
                <span className="stat-number">{staff.length}</span>
                <span className="stat-label">Available Staff</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏢</span>
              <div className="stat-content">
                <span className="stat-number">{clients.length}</span>
                <span className="stat-label">Active Clients</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="assign-form-wrapper">
          <AssignTaskForm 
            staff={staff} 
            clients={clients} 
            onTaskAssigned={handleTaskAssigned} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </div>
  );
};

export default AssignTask;