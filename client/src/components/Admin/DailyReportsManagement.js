import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import './DailyReportsManagement.css';

const DailyReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchStaffMembers();
  }, []);

  const fetchReports = async (customFilter = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Use custom filter if provided, otherwise use current state
      const currentStaffFilter = customFilter?.staffId !== undefined ? customFilter.staffId : staffFilter;
      const currentDateFilter = customFilter?.date !== undefined ? customFilter.date : dateFilter;
      
      if (currentStaffFilter) {
        params.append('staffId', currentStaffFilter);
      }
      if (currentDateFilter) {
        params.append('date', currentDateFilter);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/api/reports/all?${queryString}` : '/api/reports/all';
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setReports(response.data.reports || []);
      setError('');
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      setError('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await axios.get('/api/admin/staff', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setStaffMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Apply filters on the server-side now, so we just return all reports
  const getFilteredReports = () => reports;

  // Filter change handlers that trigger new API calls
  const handleStaffFilterChange = (value) => {
    setStaffFilter(value);
    fetchReports({ staffId: value, date: dateFilter });
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    fetchReports({ staffId: staffFilter, date: value });
  };

  const handleClearFilters = () => {
    setStaffFilter('');
    setDateFilter('');
    fetchReports({ staffId: '', date: '' });
  };

  if (loading) {
    return <LoadingSpinner message="Loading daily reports..." />;
  }

  const filteredReports = getFilteredReports();

  return (
    <div className="daily-reports-management">
      <div className="page-header">
        <h1 className="page-title">Daily Reports Management</h1>
        <p className="page-subtitle">View all staff daily reports</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="staffFilter">Filter by Staff:</label>
          <select
            id="staffFilter"
            value={staffFilter}
            onChange={(e) => handleStaffFilterChange(e.target.value)}
            className="form-input"
          >
            <option value="">All Staff</option>
            {staffMembers.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="dateFilter">Filter by Date:</label>
          <input
            id="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="form-input"
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className="reports-stats">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <p className="stat-number">{reports.length}</p>
        </div>
        <div className="stat-card">
          <h3>Showing</h3>
          <p className="stat-number">{filteredReports.length}</p>
        </div>
      </div>

      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3 className="empty-state-title">No Daily Reports</h3>
            <p className="empty-state-text">No daily reports found matching your filters</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report._id}
              className="report-card"
              onClick={() => setSelectedReport(report)}
            >
              <div className="report-header">
                <div className="report-staff">
                  <h3>{report.staffMember?.name || 'Unknown'}</h3>
                  <p>{report.staffMember?.email}</p>
                </div>
                <div className="report-date">
                  {formatDate(report.date)}
                </div>
              </div>

              <div className="report-content-preview">
                {report.content.substring(0, 150)}
                {report.content.length > 150 ? '...' : ''}
              </div>

              {report.taskTitle && (
                <div className="report-task">
                  <strong>Related Task:</strong> {report.taskTitle}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Daily Report Details</h2>
              <button className="close-button" onClick={() => setSelectedReport(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="report-details">
                <p><strong>Staff:</strong> {selectedReport.staffMember?.name}</p>
                <p><strong>Email:</strong> {selectedReport.staffMember?.email}</p>
                <p><strong>Date:</strong> {formatDate(selectedReport.date)}</p>
                {selectedReport.taskTitle && (
                  <p><strong>Related Task:</strong> {selectedReport.taskTitle}</p>
                )}
              </div>

              <div className="report-content-full">
                <h3>Report Content:</h3>
                <p>{selectedReport.content}</p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportsManagement;

