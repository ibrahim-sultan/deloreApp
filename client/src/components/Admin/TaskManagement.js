import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskManagement = ({ tasksByStaff, onUpdate }) => {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/tasks');
      setAllTasks(response.data.tasks || []);
    } catch (error) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFilteredTasks = () => {
    if (selectedStaff === 'all') {
      return allTasks;
    }
    return allTasks.filter(task => task.createdBy._id === selectedStaff);
  };

  const getUniqueStaff = () => {
    const staffMap = new Map();
    allTasks.forEach(task => {
      if (task.createdBy) {
        staffMap.set(task.createdBy._id, task.createdBy);
      }
    });
    return Array.from(staffMap.values());
  };

  const getTaskStats = () => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;
    const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
    const totalHours = allTasks.reduce((sum, task) => sum + (task.totalHours || 0), 0);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalHours: Math.round(totalHours * 100) / 100
    };
  };

  const filteredTasks = getFilteredTasks();
  const uniqueStaff = getUniqueStaff();
  const stats = getTaskStats();

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Task Management</h2>
        <div className="management-actions">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="all">All Staff ({allTasks.length} tasks)</option>
            {uniqueStaff.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name} ({allTasks.filter(task => task.createdBy._id === staff._id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Task Statistics */}
      <div className="task-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.inProgressTasks}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pendingTasks}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalHours}</div>
            <div className="stat-label">Total Hours</div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="tasks-table-container">
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Tasks Found</h3>
            <p className="empty-state-text">
              {selectedStaff === 'all' 
                ? 'No tasks have been created yet'
                : 'This staff member has not created any tasks'
              }
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Staff Member</th>
                <th>Location</th>
                <th>Total Hours</th>
                <th>Hours Spent</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <div>
                      <strong>{task.title}</strong>
                      <br />
                      <small>{task.description.substring(0, 50)}...</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{task.createdBy?.name}</strong>
                      <br />
                      <small>{task.createdBy?.email}</small>
                    </div>
                  </td>
                  <td>{task.location}</td>
                  <td>
                    <strong>{task.totalHours}</strong> hrs
                  </td>
                  <td>
                    <strong>{task.hoursSpent || 0}</strong> hrs
                  </td>
                  <td>
                    <span className={`status-badge status-${task.status}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(task.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Staff Task Summary */}
      {tasksByStaff.length > 0 && (
        <div className="staff-task-summary mt-4">
          <h3>Tasks by Staff Member</h3>
          <div className="staff-summary-grid">
            {tasksByStaff.map(staff => (
              <div key={staff._id} className="staff-summary-card">
                <div className="staff-summary-header">
                  <h4>{staff.staffName}</h4>
                  <div className="staff-task-stats">
                    <span className="task-count">{staff.taskCount} tasks</span>
                    <span className="hours-count">{Math.round(staff.totalHoursWorked * 100) / 100} hours</span>
                  </div>
                </div>
                <div className="task-status-breakdown">
                  <div className="status-item">
                    <span className="status-badge status-completed">
                      {staff.tasks.filter(t => t.status === 'completed').length} Completed
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-badge status-in-progress">
                      {staff.tasks.filter(t => t.status === 'in-progress').length} In Progress
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-badge status-pending">
                      {staff.tasks.filter(t => t.status === 'pending').length} Pending
                    </span>
                  </div>
                </div>
                <div className="recent-tasks">
                  {staff.tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="recent-task-item">
                      <span className="task-title">{task.title}</span>
                      <span className="task-hours">{task.totalHours}h</span>
                    </div>
                  ))}
                  {staff.tasks.length > 3 && (
                    <div className="more-tasks">
                      +{staff.tasks.length - 3} more tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
