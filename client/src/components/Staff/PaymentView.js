import React, { useState } from 'react';
import axios from 'axios';

const PaymentView = ({ payments }) => {
  const [error, setError] = useState('');

  const handleDownloadReceipt = async (paymentId, filename) => {
    try {
      const response = await axios.get(`/api/payments/${paymentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'payment-receipt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download payment receipt');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
    <div className="payments-section">
      <div className="section-header">
        <h2 className="section-title">Payment Records</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="payments-list">
        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3 className="empty-state-title">No Payment Records</h3>
            <p className="empty-state-text">Your payment records will appear here once uploaded by admin</p>
          </div>
        ) : (
          payments.map(payment => (
            <div key={payment._id} className="payment-item">
              <div className="payment-info">
                <h4>Payment Record</h4>
                <p>{payment.description || 'Payment from admin'}</p>
                <p>Uploaded by: {payment.uploadedBy?.name}</p>
                <div className="payment-date">
                  Payment Date: {new Date(payment.paymentDate).toLocaleDateString()}
                </div>
                <div className="payment-date">
                  Uploaded: {new Date(payment.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="payment-details">
                <div className="payment-amount">
                  {formatCurrency(payment.amount)}
                </div>
                <div className={`status-badge ${getStatusColor(payment.status)}`}>
                  {payment.status}
                </div>
                <button
                  className="btn btn-small btn-primary mt-2"
                  onClick={() => handleDownloadReceipt(payment._id, payment.receiptFilename)}
                >
                  Download Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {payments.length > 0 && (
        <div className="payment-summary">
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

export default PaymentView;
