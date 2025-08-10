import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffManagement = ({ staffMembers, onUpdate }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    temporaryPassword: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchStaffDetails = async (staffId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/staff/${staffId}`);
      setStaffDetails(response.data);
      setSelectedStaff(staffId);
    } catch (error) {
      setError('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      await axios.put(`/api/admin/staff/${staffId}/toggle-status`);
      setSuccess(`Staff member ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      onUpdate();
      if (selectedStaff === staffId) {
        fetchStaffDetails(staffId); // Refresh details
      }
    } catch (error) {
      setError('Failed to update staff status');
    }
  };

  const closeDetails = () => {
    setSelectedStaff(null);
    setStaffDetails(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCreateFormChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value
    });
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateFormData({ ...createFormData, temporaryPassword: result });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/staff', createFormData);
      setSuccess(`Staff member created successfully! Temporary password: ${response.data.temporaryCredentials.temporaryPassword}`);
      setCreateFormData({ name: '', email: '', temporaryPassword: '' });
      setShowCreateModal(false);
      onUpdate(); // Refresh staff list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create staff member');
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({ name: '', email: '', temporaryPassword: '' });
    setError('');
  };

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Staff Management</h2>
        <div className="management-actions">
          <span className="staff-count">{staffMembers.length} Staff Members</span>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Staff
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="staff-grid">
        {staffMembers.map(staff => (
          <div key={staff._id} className={`staff-card ${!staff.isActive ? 'inactive' : ''}`}>
            <div className="staff-card-header">
              <div className="staff-info">
                <h3>{staff.name}</h3>
                <p>{staff.email}</p>
              </div>
              <span className={`staff-status ${staff.isActive ? 'active' : 'inactive'}`}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="staff-stats">
              <div className="staff-stat">
                <span className="staff-stat-number">0</span>
                <span className="staff-stat-label">Documents</span>
              </div>
              <div className="staff-stat">
                <span className="staff-stat-number">0</span>
                <span className="staff-stat-label">Tasks</span>
              </div>
            </div>

            <div className="staff-actions">
              <button
                className="btn btn-small btn-primary"
                onClick={() => fetchStaffDetails(staff._id)}
              >
                View Details
              </button>
              <button
                className={`btn btn-small ${staff.isActive ? 'btn-danger' : 'btn-success'}`}
                onClick={() => toggleStaffStatus(staff._id, staff.isActive)}
              >
                {staff.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <div className="staff-joined">
              Joined: {formatDate(staff.createdAt)}
            </div>
          </div>
        ))}
      </div>

      {staffMembers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No Staff Members</h3>
          <p className="empty-state-text">Staff members will appear here once they register</p>
        </div>
      )}

      {/* Staff Details Modal */}
      {selectedStaff && staffDetails && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{staffDetails.staff.name} - Details</h2>
              <button className="close-button" onClick={closeDetails}>
                ×
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading staff details...</div>
            ) : (
              <div className="staff-details">
                <div className="staff-overview">
                  <div className="detail-section">
                    <h4>Contact Information</h4>
                    <p><strong>Email:</strong> {staffDetails.staff.email}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${staffDetails.staff.isActive ? 'status-completed' : 'status-cancelled'}`}>
                        {staffDetails.staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p><strong>Joined:</strong> {formatDate(staffDetails.staff.createdAt)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Activity Summary</h4>
                    <div className="activity-stats">
                      <div className="activity-stat">
                        <span className="stat-number">{staffDetails.staff.totalDocuments}</span>
                        <span className="stat-label">Documents</span>
                      </div>
                      <div className="activity-stat">
                        <span className="stat-number">{staffDetails.staff.totalTasks}</span>
                        <span className="stat-label">Tasks</span>
                      </div>
                      <div className="activity-stat">
                        <span className="stat-number">{staffDetails.staff.totalHours}</span>
                        <span className="stat-label">Hours</span>
                      </div>
                      <div className="activity-stat">
                        <span className="stat-number">{staffDetails.staff.totalPayments}</span>
                        <span className="stat-label">Payments</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-tabs">
                  <div className="detail-section">
                    <h4>Recent Documents ({staffDetails.documents.length})</h4>
                    {staffDetails.documents.length > 0 ? (
                      <div className="detail-list">
                        {staffDetails.documents.slice(0, 5).map(doc => (
                          <div key={doc._id} className="detail-item">
                            <div className="item-info">
                              <h5>{doc.title}</h5>
                              <p>Expires: {formatDate(doc.expiryDate)}</p>
                            </div>
                            <div className="item-date">
                              {formatDate(doc.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No documents uploaded</p>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>Recent Tasks ({staffDetails.tasks.length})</h4>
                    {staffDetails.tasks.length > 0 ? (
                      <div className="detail-list">
                        {staffDetails.tasks.slice(0, 5).map(task => (
                          <div key={task._id} className="detail-item">
                            <div className="item-info">
                              <h5>{task.title}</h5>
                              <p>{task.location} - {task.totalHours} hours</p>
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
                      <p>No tasks created</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Staff Member</h2>
              <button className="close-button" onClick={closeCreateModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="create-staff-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={createFormData.name}
                  onChange={handleCreateFormChange}
                  className="form-input"
                  required
                  placeholder="Enter staff member's full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={createFormData.email}
                  onChange={handleCreateFormChange}
                  className="form-input"
                  required
                  placeholder="Enter staff member's email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="temporaryPassword" className="form-label">
                  Temporary Password
                </label>
                <div className="password-input-group">
                  <input
                    type="text"
                    id="temporaryPassword"
                    name="temporaryPassword"
                    value={createFormData.temporaryPassword}
                    onChange={handleCreateFormChange}
                    className="form-input"
                    required
                    placeholder="Enter temporary password (min 6 characters)"
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={generateTemporaryPassword}
                  >
                    Generate
                  </button>
                </div>
                <small className="form-help">
                  Staff member must change this password on first login
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
