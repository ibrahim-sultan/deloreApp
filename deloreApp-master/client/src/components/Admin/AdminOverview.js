import React from 'react';

const AdminOverview = ({ data, onUpdate }) => {
  if (!data) {
    return <div className="loading">Loading overview...</div>;
  }

  const { statistics, documentsByStaff, tasksByStaff, recentActivities } = data;

  return (
    <div className="admin-overview">
      {/* Statistics Cards */}
      <div className="overview-stats">
        <div className="overview-stat-card">
          <span className="overview-stat-number">{statistics.totalStaff}</span>
          <span className="overview-stat-label">Total Staff</span>
        </div>
        <div className="overview-stat-card">
          <span className="overview-stat-number">{statistics.totalDocuments}</span>
          <span className="overview-stat-label">Documents Uploaded</span>
        </div>
        <div className="overview-stat-card">
          <span className="overview-stat-number">{statistics.totalTasks}</span>
          <span className="overview-stat-label">Tasks Created</span>
        </div>
        <div className="overview-stat-card">
          <span className="overview-stat-number">{statistics.totalPayments}</span>
          <span className="overview-stat-label">Payment Records</span>
        </div>
      </div>

      {/* Overview Sections */}
      <div className="overview-sections">
        {/* Staff Performance */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3 className="overview-section-title">Staff Performance</h3>
          </div>
          <div className="overview-section-content">
            {documentsByStaff.length === 0 ? (
              <p>No staff activity yet</p>
            ) : (
              documentsByStaff.slice(0, 5).map(staff => (
                <div key={staff._id} className="staff-summary-item">
                  <div className="staff-summary-info">
                    <h4>{staff.staffName}</h4>
                    <p>{staff.staffEmail}</p>
                  </div>
                  <div className="staff-summary-stats">
                    <div><span className="stat-number">{staff.documentCount}</span> documents</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Overview */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3 className="overview-section-title">Task Hours Summary</h3>
          </div>
          <div className="overview-section-content">
            {tasksByStaff.length === 0 ? (
              <p>No tasks created yet</p>
            ) : (
              tasksByStaff.slice(0, 5).map(staff => (
                <div key={staff._id} className="staff-summary-item">
                  <div className="staff-summary-info">
                    <h4>{staff.staffName}</h4>
                    <p>{staff.taskCount} tasks</p>
                  </div>
                  <div className="staff-summary-stats">
                    <div><span className="stat-number">{Math.round(staff.totalHoursWorked * 100) / 100}</span> hours</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3 className="overview-section-title">Recent Activities</h3>
          </div>
          <div className="overview-section-content">
            <div className="recent-activities">
              {recentActivities.documents.map(doc => (
                <div key={doc._id} className="recent-activity-item">
                  <div className="activity-icon document">📄</div>
                  <div className="activity-info">
                    <h5>{doc.title}</h5>
                    <p>Uploaded by {doc.uploadedBy?.name}</p>
                  </div>
                  <div className="activity-time">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {recentActivities.tasks.map(task => (
                <div key={task._id} className="recent-activity-item">
                  <div className="activity-icon task">📋</div>
                  <div className="activity-info">
                    <h5>{task.title}</h5>
                    <p>Created by {task.createdBy?.name}</p>
                  </div>
                  <div className="activity-time">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {recentActivities.documents.length === 0 && recentActivities.tasks.length === 0 && (
                <p>No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
