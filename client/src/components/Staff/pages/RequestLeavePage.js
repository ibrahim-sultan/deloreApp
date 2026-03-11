import React, { useState, useEffect } from 'react';
import './StaffPages.css';
import axios from 'axios';

const RequestLeavePage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get('/api/leave-requests/my-requests');
      setLeaveRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      // If endpoint doesn't exist yet, just set empty array
      setLeaveRequests([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/leave-requests', {
        startDate,
        endDate,
        reason
      });
      setSuccess('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaveRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDates = (start, end) => {
    return `${start} to ${end}`;
  };

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Request Leave</h1>
      
      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      
      <div className="staff-leave-container">
        <div className="staff-leave-form-section">
          <h2 className="staff-leave-section-title">New Leave Request</h2>
          
          <form onSubmit={handleSubmit} className="staff-leave-form">
            <div className="staff-form-group">
              <label>Start Date</label>
              <div className="staff-date-input-group">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="staff-date-input"
                  required
                />
                <span className="staff-date-icon">📅</span>
              </div>
            </div>
            
            <div className="staff-form-group">
              <label>End Date</label>
              <div className="staff-date-input-group">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="staff-date-input"
                  required
                />
                <span className="staff-date-icon">📅</span>
              </div>
            </div>
            
            <div className="staff-form-group">
              <label>Reason for Leave</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="staff-reason-textarea"
                required
              />
            </div>
            
            <button type="submit" className="staff-submit-request-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
        
        <div className="staff-leave-requests-section">
          <h2 className="staff-leave-section-title">My Requests</h2>
          
          {leaveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No leave requests yet.</p>
            </div>
          ) : (
            <div className="staff-leave-requests-list">
              {leaveRequests.map((request) => (
                <div key={request._id || request.id} className="staff-leave-request-card">
                  <div className="staff-leave-request-dates">
                    {formatDates(request.startDate, request.endDate)}
                  </div>
                  <span className={`staff-leave-status ${(request.status || 'pending').toLowerCase()}`}>
                    {request.status || 'Pending'}
                  </span>
                  <div className="staff-leave-request-reason">{request.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestLeavePage;

