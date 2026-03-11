import React from 'react';
import { formatDateTime } from '../../utils/datetime';

const EmergencyAdminOverview = ({ data }) => {
  return (
    <div className="admin-overview">
      <div className="overview-header">
        <h2>Admin Dashboard - Emergency Mode</h2>
        <p>Basic dashboard functionality while we debug the main dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{data?.statistics?.totalStaff || 0}</h3>
            <p>Total Staff</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{data?.statistics?.totalDocuments || 0}</h3>
            <p>Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{data?.statistics?.totalTasks || 0}</h3>
            <p>Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{data?.statistics?.totalPayments || 0}</h3>
            <p>Payments</p>
          </div>
        </div>
      </div>

      <div className="emergency-info" style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0',
        color: '#856404'
      }}>
        <h3>⚠️ Emergency Mode Active</h3>
        <p>The main dashboard is currently using a simplified data source while we resolve technical issues.</p>
        <p><strong>Available Functions:</strong></p>
        <ul>
          <li>Basic statistics display</li>
          <li>Navigation to other admin sections</li>
          <li>Staff, Document, Task, and Payment management</li>
        </ul>
        <p><strong>User Info:</strong> {data?.user?.email} ({data?.user?.role})</p>
<p><strong>Last Updated:</strong> {data?.timestamp ? formatDateTime(data.timestamp) : 'Just now'}</p>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          <button 
            className="action-button"
            onClick={() => window.location.href = '/admin/staff'}
            style={{
              padding: '15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👥 Manage Staff
          </button>
          <button 
            className="action-button"
            onClick={() => window.location.href = '/admin/documents'}
            style={{
              padding: '15px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📄 View Documents
          </button>
          <button 
            className="action-button"
            onClick={() => window.location.href = '/admin/tasks'}
            style={{
              padding: '15px',
              background: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✅ Manage Tasks
          </button>
          <button 
            className="action-button"
            onClick={() => window.location.href = '/admin/payments'}
            style={{
              padding: '15px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💰 Handle Payments
          </button>
        </div>
      </div>

      {data?.message && (
        <div className="test-info" style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '15px',
          margin: '20px 0',
          color: '#155724'
        }}>
          <h4>✅ System Status</h4>
          <p>Message: {data.message}</p>
          <p>Authentication: Working</p>
          <p>Server Connection: Active</p>
        </div>
      )}
    </div>
  );
};

export default EmergencyAdminOverview;