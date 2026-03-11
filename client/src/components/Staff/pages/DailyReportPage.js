import React, { useState } from 'react';
import axios from 'axios';
import './StaffPages.css';

const DailyReportPage = () => {
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post('/api/reports/submit', { content: reportText });
      setSuccess('Daily report submitted successfully!');
      setReportText('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Daily Report</h1>
      
      <h2 className="staff-section-title">Submit Daily Report</h2>
      
      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} className="staff-report-form">
        <label className="staff-report-label">Report Details (Compulsory)</label>
        <textarea
          className="staff-report-textarea"
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Enter your daily report details..."
          required
        />
        
        <button type="submit" className="staff-submit-btn" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default DailyReportPage;

