import React, { useState } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/datetime';

const PaymentManagement = ({ staffMembers, onUpdate }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    staffMemberId: '',
    amount: '',
    paymentDate: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payments/all');
      setPayments(response.data.payments || []);
    } catch (error) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Please select a payment receipt file');
      setUploading(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append('receipt', selectedFile);
    uploadData.append('staffMemberId', formData.staffMemberId);
    uploadData.append('amount', formData.amount);
    uploadData.append('paymentDate', formData.paymentDate);
    uploadData.append('description', formData.description);

    try {
      await axios.post('/api/payments/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Payment receipt uploaded successfully!');
      setFormData({
        staffMemberId: '',
        amount: '',
        paymentDate: '',
        description: ''
      });
      setSelectedFile(null);
      setShowUploadForm(false);
      fetchPayments();
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload payment receipt';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await axios.put(`/api/payments/${paymentId}/status`, { status: newStatus });
      setSuccess('Payment status updated successfully');
      fetchPayments();
    } catch (error) {
      setError('Failed to update payment status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // use shared formatDate from utils/datetime

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'processed':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Payment Management</h2>
        <div className="management-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? 'Cancel' : 'Upload Payment Receipt'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showUploadForm && (
        <div className="form-modal-content" style={{ position: 'relative', marginBottom: '32px' }}>
          <div className="form-modal-header">
            <h3 className="form-modal-title">Upload Payment Receipt</h3>
            <button className="close-button" onClick={() => setShowUploadForm(false)}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="staffMemberId" className="form-label">Staff Member</label>
                <select
                  id="staffMemberId"
                  name="staffMemberId"
                  value={formData.staffMemberId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Staff Member</option>
                  {staffMembers.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentDate" className="form-label">Payment Date</label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Payment description"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="receipt" className="form-label">Payment Receipt</label>
              <input
                type="file"
                id="receipt"
                onChange={handleFileChange}
                className="form-input"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                required
              />
              {selectedFile && (
                <div className="file-info">
                  <span>{selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Payment Receipt'}
            </button>
          </form>
        </div>
      )}

      <div className="payments-table-container">
        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3 className="empty-state-title">No Payment Records</h3>
            <p className="empty-state-text">Upload payment receipts for staff members</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id}>
                  <td>
                    <div>
                      <strong>{payment.staffMember?.name}</strong>
                      <br />
                      <small>{payment.staffMember?.email}</small>
                    </div>
                  </td>
                  <td>
                    <strong>{formatCurrency(payment.amount)}</strong>
                  </td>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>{payment.description || '-'}</td>
                  <td>
                    <select
                      value={payment.status}
                      onChange={(e) => updatePaymentStatus(payment._id, e.target.value)}
                      className={`status-badge ${getStatusColor(payment.status)}`}
                      style={{ border: 'none', background: 'transparent', color: 'inherit' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => {
                          // Download receipt functionality would go here
                          window.open(`/api/payments/${payment._id}/download`, '_blank');
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payments.length > 0 && (
        <div className="payment-summary mt-4">
          <div className="card">
            <h3>Payment Summary</h3>
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-label">Total Payments:</span>
                <span className="summary-value">{payments.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value">
                  {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Completed:</span>
                <span className="summary-value">
                  {payments.filter(p => p.status === 'completed').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pending:</span>
                <span className="summary-value">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
