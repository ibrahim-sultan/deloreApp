import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import './StaffLogs.css';
import { formatDateTime } from '../../utils/datetime';

const StaffLogs = () => {
  const [logs, setLogs] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    staffId: '',
    activityType: '',
    startDate: '',
    endDate: '',
    limit: 100
  });

  const activityTypes = [
    { value: '', label: 'All Activities' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'task_created', label: 'Task Created' },
    { value: 'task_updated', label: 'Task Updated' },
    { value: 'task_completed', label: 'Task Completed' },
    { value: 'clock_in', label: 'Clock In' },
    { value: 'clock_out', label: 'Clock Out' },
    { value: 'profile_updated', label: 'Profile Updated' },
    { value: 'password_changed', label: 'Password Changed' },
    { value: 'message_sent', label: 'Message Sent' },
    { value: 'message_read', label: 'Message Read' }
  ];

  useEffect(() => {
    fetchStaffMembers();
    fetchLogs();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffMembers(response.data);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      
      if (filters.staffId) params.staffId = filters.staffId;
      if (filters.activityType) params.activityType = filters.activityType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.limit = filters.limit;

      const response = await axios.get('/api/admin/staff-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setLogs(response.data.logs);
      setError('');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      staffId: '',
      activityType: '',
      startDate: '',
      endDate: '',
      limit: 100
    });
    setTimeout(() => fetchLogs(), 100);
  };

  const formatDate = (dateString) => formatDateTime(dateString);

  const getActivityIcon = (type) => {
    const icons = {
      login: '🔓',
      logout: '🔒',
      task_created: '📝',
      task_updated: '✏️',
      task_completed: '✅',
      clock_in: '⏰',
      clock_out: '🏁',
      profile_updated: '👤',
      password_changed: '🔑',
      message_sent: '📤',
      message_read: '📬'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      login: '#4CAF50',
      logout: '#9E9E9E',
      task_created: '#2196F3',
      task_updated: '#FF9800',
      task_completed: '#4CAF50',
      clock_in: '#00BCD4',
      clock_out: '#607D8B',
      profile_updated: '#9C27B0',
      password_changed: '#F44336',
      message_sent: '#3F51B5',
      message_read: '#00BCD4'
    };
    return colors[type] || '#757575';
  };

  if (loading && logs.length === 0) {
    return <LoadingSpinner message="Loading staff logs..." />;
  }

  return (
    <div className="staff-logs-container">
      <div className="page-header">
        <h2>Staff Activity Logs</h2>
        <p className="page-description">
          Track and monitor all staff activities and actions
        </p>
      </div>

      <div className="filters-card">
        <form onSubmit={handleApplyFilters} className="filters-form">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="staffId">Staff Member</label>
              <select
                id="staffId"
                name="staffId"
                value={filters.staffId}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Staff</option>
                {staffMembers.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="activityType">Activity Type</label>
              <select
                id="activityType"
                name="activityType"
                value={filters.activityType}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="limit">Limit</label>
              <select
                id="limit"
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="logs-card">
        <div className="logs-header">
          <h3>Activity Log ({logs.length})</h3>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <p>No activity logs found</p>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log._id} className="log-item">
                <div className="log-icon" style={{ backgroundColor: getActivityColor(log.activityType) }}>
                  {getActivityIcon(log.activityType)}
                </div>
                <div className="log-content">
                  <div className="log-header-row">
                    <h4 className="log-user">{log.user?.name || 'Unknown User'}</h4>
                    <span className="log-date">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="log-description">{log.description}</p>
                  <div className="log-meta">
                    <span className="log-type">
                      {activityTypes.find(t => t.value === log.activityType)?.label || log.activityType}
                    </span>
                    {log.ipAddress && (
                      <span className="log-ip">IP: {log.ipAddress}</span>
                    )}
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

export default StaffLogs;
