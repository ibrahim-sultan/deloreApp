
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AssignTaskForm from './AssignTaskForm';
import LoadingSpinner from '../Common/LoadingSpinner';
import './TaskManagement.css';

const TaskManagement = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAssignForm, setShowAssignForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [tasksRes, staffRes, clientsRes] = await Promise.all([
            axios.get('/api/admin/assigned-tasks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            axios.get('/api/users/staff', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            axios.get('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);

        // Helper to safely extract array from API response, which might be nested in an object.
        const extractArray = (response, primaryKey) => {
            if (!response || !response.data) return [];
            if (Array.isArray(response.data)) return response.data;
            if (typeof response.data === 'object' && response.data !== null) {
                // Common keys for nested arrays are 'tasks', 'staff', 'users', 'clients', or just 'data'.
                return response.data[primaryKey] || response.data.users || response.data.data || [];
            }
            return [];
        };

        const tasksArray = extractArray(tasksRes, 'tasks');
        const staffArray = extractArray(staffRes, 'staff');
        const clientsArray = extractArray(clientsRes, 'clients');

        // AGGRESSIVE DATA SANITIZATION
        const validTasks = tasksArray.filter(task => 
            task && typeof task === 'object' && typeof task._id === 'string'
        );

        const normalizedTasks = validTasks.map(task => ({
            ...task,
            assignedTo: (task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo.name) ? task.assignedTo : null,
            client: (task.client && typeof task.client === 'object' && task.client.name) ? task.client : null,
        }));

        const sanitizedStaff = staffArray.filter(s => s && s._id && s.name);
        const sanitizedClients = clientsArray.filter(c => c && c._id && c.name);

        setAllTasks(normalizedTasks);
        setStaff(sanitizedStaff);
        setClients(sanitizedClients);
        setError('');
    } catch (err) {
        console.error('Failed to fetch or process data:', err);
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
    setShowAssignForm(false);
    fetchData(); // Refresh all data
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedStaff === 'all') {
      return allTasks;
    }
    return allTasks.filter(task => task?.assignedTo?._id === selectedStaff);
  }, [allTasks, selectedStaff]);
  
  const tasksByStaff = useMemo(() => {
      const counts = {};
      if (!staff || !allTasks) return {};
      staff.forEach(s => {
          counts[s._id] = allTasks.filter(task => task?.assignedTo?._id === s._id).length;
      });
      return counts;
  }, [allTasks, staff]);

  const taskStats = useMemo(() => {
    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(task => task.status === 'completed').length,
      inProgress: allTasks.filter(task => task.status === 'in-progress').length,
      pending: allTasks.filter(task => task.status === 'pending').length,
      cancelled: allTasks.filter(task => task.status === 'cancelled').length
    };
    return stats;
  }, [allTasks]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert"><strong>Error:</strong> {error}</div>;
  }
  
  return (
    <div className="task-management-container">
      {/* Header Section */}
      <div className="task-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">
              <span className="title-icon">📋</span>
              Task Management
            </h1>
            <p className="page-subtitle">
              Assign, track, and manage all team tasks efficiently
            </p>
          </div>
          <div className="header-actions">
            <div className="task-counter">
              <span className="counter-number">{taskStats.total}</span>
              <span className="counter-label">Total Tasks</span>
            </div>
            <button 
              className="assign-task-btn"
              onClick={() => setShowAssignForm(true)}
            >
              <span className="btn-icon">+</span>
              Assign New Task
            </button>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="task-stats-section">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-number">{taskStats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{taskStats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{taskStats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏸️</div>
            <div className="stat-content">
              <div className="stat-number">{taskStats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card cancelled">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-number">{taskStats.cancelled}</div>
              <div className="stat-label">Cancelled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Task Form Modal */}
      {showAssignForm && (
        <div className="form-modal-overlay" onClick={() => setShowAssignForm(false)}>
          <div className="form-modal assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">⚙️</span>
                Assign New Task
              </h2>
              <button className="modal-close-btn" onClick={() => setShowAssignForm(false)}>×</button>
            </div>
            
            <div className="assign-form-container">
              <AssignTaskForm 
                staff={staff} 
                clients={clients} 
                onTaskAssigned={handleTaskAssigned} 
                onCancel={() => setShowAssignForm(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-header">
          <h3 className="filter-title">
            <span className="filter-icon">🔍</span>
            Filter Tasks
          </h3>
        </div>
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="staff-filter"
        >
          <option value="all">👥 All Staff ({allTasks.length} tasks)</option>
          {staff.map(s => (
            <option key={s._id} value={s._id}>
              👤 {s.name} ({tasksByStaff[s._id] || 0} tasks)
            </option>
          ))}
        </select>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">📈</span>
            Task Overview
          </h2>
          <div className="section-info">
            <span className="tasks-count">{filteredTasks.length} tasks found</span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No Tasks Found</h3>
            <p className="empty-text">
              {selectedStaff === 'all' 
                ? 'No tasks have been assigned yet. Start by assigning your first task!'
                : 'This staff member has no assigned tasks currently.'
              }
            </p>
            <button 
              className="empty-action-btn"
              onClick={() => setShowAssignForm(true)}
            >
              <span className="btn-icon">+</span>
              Assign First Task
            </button>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <div key={task._id} className="task-card">
                <div className="task-card-header">
                  <div className="task-info">
                    <h3 className="task-title">{task.title || 'Untitled Task'}</h3>
                    <div className="task-location">
                      <span className="location-icon">📍</span>
                      {task.location || 'No location specified'}
                    </div>
                  </div>
                  <div className="task-status">
                    <span className={`status-badge status-${task.status || 'pending'}`}>
                      {(task.status || 'pending').replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="task-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">👤</span>
                      <div className="detail-content">
                        <span className="detail-label">Assigned To</span>
                        <span className="detail-value">{task.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🏢</span>
                      <div className="detail-content">
                        <span className="detail-label">Client</span>
                        <span className="detail-value">{task.client?.name || 'No client'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">🗺️</span>
                      <div className="detail-content">
                        <span className="detail-label">Start Date</span>
                        <span className="detail-value">{formatDate(task.scheduledStartTime)}</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🏁</span>
                      <div className="detail-content">
                        <span className="detail-label">End Date</span>
                        <span className="detail-value">{formatDate(task.scheduledEndTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="task-card-footer">
                  <div className="task-meta">
                    <span className="task-id">🏷️ ID: {task._id.slice(-6)}</span>
                  </div>
                  
                  <div className="task-actions">
                    <button 
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      <span className="btn-icon">👁️</span>
                      View
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      title="Edit Task"
                    >
                      <span className="btn-icon">✏️</span>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
