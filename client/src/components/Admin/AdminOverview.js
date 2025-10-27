import React from 'react';
import './AdminOverview.css';

const AdminOverview = ({ data, onUpdate }) => {
  if (!data) {
    return <div className="loading">Loading overview...</div>;
  }

  const { statistics, documentsByStaff, tasksByStaff, recentActivities, tasks } = data;

  // Calculate task statistics
  const tasksAssigned = tasks?.filter(t => t.status === 'assigned')?.length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'pending')?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed')?.length || 0;

  // Get upcoming scheduled tasks
  const upcomingTasks = tasks?.filter(t => 
    t.scheduledStartTime && new Date(t.scheduledStartTime) > new Date()
  ).sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime)).slice(0, 3) || [];

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="admin-overview-new">
      {/* Statistics Cards - Matching the design */}
      <div className="stats-cards-grid">
        <div className="stat-card-new blue">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number-new">{statistics.totalStaff}</div>
            <div className="stat-label-new">Total Staff</div>
          </div>
        </div>
        <div className="stat-card-new purple">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number-new">{tasksAssigned}</div>
            <div className="stat-label-new">Tasks Assigned</div>
          </div>
        </div>
        <div className="stat-card-new orange">
          <div className="stat-icon">🕐</div>
          <div className="stat-content">
            <div className="stat-number-new">{pendingTasks}</div>
            <div className="stat-label-new">Pending Tasks</div>
          </div>
        </div>
        <div className="stat-card-new green">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-number-new">{completedTasks}</div>
            <div className="stat-label-new">Completed Tasks</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Upcoming Schedule and Recent Activity */}
      <div className="dashboard-content-grid">
        {/* Upcoming Schedule Section */}
        <div className="content-section">
          <div className="section-header-new">
            <h3 className="section-title-new">Upcoming Schedule</h3>
          </div>
          <div className="section-content-new">
            {upcomingTasks.length === 0 ? (
              <div className="empty-message">No upcoming scheduled tasks</div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task._id} className="schedule-item">
                  <div className="schedule-avatar"></div>
                  <div className="schedule-info">
                    <div className="schedule-title">{task.title}</div>
                    <div className="schedule-meta">
                      Assigned to: {task.assignedTo?.name || 'Staff Member'} - {formatDateTime(task.scheduledStartTime)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="content-section">
          <div className="section-header-new">
            <h3 className="section-title-new">Recent Activity</h3>
          </div>
          <div className="section-content-new">
            {(!recentActivities || (recentActivities.documents?.length === 0 && recentActivities.tasks?.length === 0)) ? (
              <div className="empty-message">No new activity to show.</div>
            ) : (
              <div className="activity-list">
                {recentActivities.tasks?.slice(0, 3).map(task => (
                  <div key={task._id} className="activity-item-new">
                    <div className="activity-avatar"></div>
                    <div className="activity-details">
                      <div className="activity-title">{task.title}</div>
                      <div className="activity-meta">
                        Created by {task.createdBy?.name} - {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivities.documents?.slice(0, 2).map(doc => (
                  <div key={doc._id} className="activity-item-new">
                    <div className="activity-avatar"></div>
                    <div className="activity-details">
                      <div className="activity-title">{doc.title}</div>
                      <div className="activity-meta">
                        Uploaded by {doc.uploadedBy?.name} - {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
