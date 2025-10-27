import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import './StaffReports.css';

const StaffReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaffReports();
  }, []);

  const fetchStaffReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/staff-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching staff reports:', error);
      setError('Failed to load staff reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffDetails = async (staffId) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/staff-report/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffDetails(response.data);
      setSelectedStaff(staffId);
    } catch (error) {
      console.error('Error fetching staff details:', error);
      alert('Failed to load staff details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': { label: 'Completed', color: '#4CAF50' },
      'in-progress': { label: 'In Progress', color: '#FF9800' },
      'assigned': { label: 'Assigned', color: '#2196F3' },
      'cancelled': { label: 'Cancelled', color: '#f44336' }
    };
    const badge = badges[status] || { label: status, color: '#757575' };
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const closeDetails = () => {
    setSelectedStaff(null);
    setStaffDetails(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading staff reports..." />;
  }

  return (
    <div className="staff-reports-container">
      <div className="page-header">
        <h2>Staff Reports</h2>
        <p className="page-description">
          View detailed performance reports for all staff members
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="empty-state-card">
          <p>No staff reports available</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div
              key={report.staffId}
              className="report-card"
              onClick={() => fetchStaffDetails(report.staffId)}
            >
              <div className="report-header">
                <div className="staff-avatar">
                  {report.staffName.charAt(0).toUpperCase()}
                </div>
                <div className="staff-info">
                  <h3>{report.staffName}</h3>
                  <p className="staff-email">{report.email}</p>
                </div>
              </div>

              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Tasks</span>
                  <span className="stat-value">{report.totalTasks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hours Worked</span>
                  <span className="stat-value">{report.totalHoursSpent.toFixed(1)}h</span>
                </div>
              </div>

              <button className="view-details-btn">
                View Details →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Report Details</h2>
              <button className="close-btn" onClick={closeDetails}>
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="modal-loading">
                <LoadingSpinner message="Loading details..." />
              </div>
            ) : staffDetails ? (
              <div className="modal-body">
                <div className="staff-summary">
                  <div className="staff-avatar-large">
                    {staffDetails.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{staffDetails.name}</h3>
                    <p className="staff-email">{staffDetails.email}</p>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                      <span className="stat-number">{staffDetails.statistics.totalTasks}</span>
                      <span className="stat-title">Total Tasks</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <span className="stat-number">{staffDetails.statistics.completedTasks}</span>
                      <span className="stat-title">Completed</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                      <span className="stat-number">{staffDetails.statistics.inProgressTasks}</span>
                      <span className="stat-title">In Progress</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                      <span className="stat-number">{staffDetails.statistics.totalHoursSpent.toFixed(1)}h</span>
                      <span className="stat-title">Hours Worked</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <span className="stat-number">{staffDetails.statistics.onTimePerformance}%</span>
                      <span className="stat-title">On-Time Rate</span>
                    </div>
                  </div>
                </div>

                <div className="tasks-section">
                  <h3>Task History</h3>
                  {staffDetails.tasks.length === 0 ? (
                    <p className="no-tasks">No tasks assigned yet</p>
                  ) : (
                    <div className="tasks-list">
                      {staffDetails.tasks.map((task) => (
                        <div key={task.id} className="task-item">
                          <div className="task-header-row">
                            <h4>{task.title}</h4>
                            {getStatusBadge(task.status)}
                          </div>

                          <div className="task-details">
                            <div className="task-detail">
                              <span className="detail-label">Location:</span>
                              <span>{task.location}</span>
                            </div>
                            <div className="task-detail">
                              <span className="detail-label">Scheduled:</span>
                              <span>
                                {formatDateTime(task.scheduledStartTime)} - {formatDateTime(task.scheduledEndTime)}
                              </span>
                            </div>
                            {task.clockInTime && (
                              <div className="task-detail">
                                <span className="detail-label">Clock In:</span>
                                <span>{formatDateTime(task.clockInTime)}</span>
                              </div>
                            )}
                            {task.clockOutTime && (
                              <div className="task-detail">
                                <span className="detail-label">Clock Out:</span>
                                <span>{formatDateTime(task.clockOutTime)}</span>
                              </div>
                            )}
                            {task.hoursSpent > 0 && (
                              <div className="task-detail">
                                <span className="detail-label">Hours Spent:</span>
                                <span>{task.hoursSpent}h</span>
                              </div>
                            )}
                            {task.workSummary && (
                              <div className="task-detail full-width">
                                <span className="detail-label">Summary:</span>
                                <p className="work-summary">{task.workSummary}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReports;
