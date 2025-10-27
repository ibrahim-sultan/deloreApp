import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import './LeaveRequestManagement.css';

const LeaveRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewComments, setReviewComments] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leave-requests/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(response.data.requests || []);
      setError('');
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status) => {
    try {
      await axios.put(
        `/api/leave-requests/${requestId}/status`,
        { 
          status, 
          comments: reviewComments || undefined 
        },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setSuccess(`Leave request ${status} successfully`);
      setSelectedRequest(null);
      setReviewComments('');
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${status} leave request`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading leave requests..." />;
  }

  return (
    <div className="leave-request-management">
      <div className="page-header">
        <h1 className="page-title">Leave Request Management</h1>
        <p className="page-subtitle">Review and manage staff leave requests</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="leave-requests-list">
        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-state-title">No Leave Requests</h3>
            <p className="empty-state-text">No leave requests have been submitted yet</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request._id} className="leave-request-card">
              <div className="leave-request-header">
                <div className="leave-request-staff">
                  <h3>{request.staffMember?.name || 'Unknown'}</h3>
                  <p>{request.staffMember?.email}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="leave-request-details">
                <div className="detail-item">
                  <strong>Start Date:</strong> {formatDate(request.startDate)}
                </div>
                <div className="detail-item">
                  <strong>End Date:</strong> {formatDate(request.endDate)}
                </div>
                <div className="detail-item">
                  <strong>Days:</strong> {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>

              <div className="leave-request-reason">
                <strong>Reason:</strong>
                <p>{request.reason}</p>
              </div>

              {request.reviewedBy && (
                <div className="leave-request-review">
                  <strong>Reviewed by:</strong> {request.reviewedBy?.name || 'Unknown'}
                  <br />
                  <strong>Date:</strong> {formatDate(request.reviewedAt)}
                  {request.reviewComments && (
                    <>
                      <br />
                      <strong>Comments:</strong> {request.reviewComments}
                    </>
                  )}
                </div>
              )}

              {request.status === 'pending' && (
                <div className="leave-request-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setSelectedRequest(request);
                      setReviewComments('');
                    }}
                  >
                    Review Request
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Leave Request</h2>
              <button className="close-button" onClick={() => setSelectedRequest(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="review-info">
                <p><strong>Staff:</strong> {selectedRequest.staffMember?.name}</p>
                <p><strong>Period:</strong> {formatDate(selectedRequest.startDate)} to {formatDate(selectedRequest.endDate)}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>

              <div className="form-group">
                <label htmlFor="reviewComments">Comments (optional)</label>
                <textarea
                  id="reviewComments"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="form-input"
                  placeholder="Add any comments about your decision..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleReview(selectedRequest._id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReview(selectedRequest._id, 'rejected')}
                >
                  Reject
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;

