import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffPages.css';

const PayStubsPage = () => {
  const [paystubs, setPaystubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaystubs();
  }, []);

  const fetchPaystubs = async () => {
    try {
      const response = await axios.get('/api/payments/my-payments');
      setPaystubs(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching paystubs:', error);
      setError('Failed to load pay stubs');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paymentId, filename) => {
    try {
      const response = await axios.get(`/api/payments/${paymentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'paystub');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download pay stub');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[date.getMonth()];
  };

  if (loading) {
    return (
      <div className="staff-page">
        <h1 className="staff-page-title">Pay Stubs</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Pay Stubs</h1>
      
      <h2 className="staff-section-title">Your Pay Stubs</h2>
      
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      
      {paystubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No pay stubs available yet.</p>
        </div>
      ) : (
        <div className="staff-paystubs-list">
          {paystubs.map((paystub, index) => {
            const month = getMonthName(paystub.paymentDate || paystub.createdAt);
            const year = new Date(paystub.paymentDate || paystub.createdAt).getFullYear();
            return (
              <div key={paystub._id || index} className="staff-paystub-card">
                <div className="staff-paystub-info">
                  <div className="staff-paystub-icon">📄</div>
                  <div className="staff-paystub-details">
                    <div className="staff-paystub-title">Pay Stub - {month} {year}</div>
                    <div className="staff-paystub-date">Issued on {formatDate(paystub.paymentDate || paystub.createdAt)}</div>
                  </div>
                </div>
                <button 
                  className="staff-paystub-download"
                  onClick={() => handleDownload(paystub._id, paystub.receiptFilename)}
                  title="Download Pay Stub"
                >
                  ⬇️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PayStubsPage;

