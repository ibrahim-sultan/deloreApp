import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AddClient.css';

const AddClient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're editing a client (passed via state)
  const editingClient = location.state?.client || null;
  const isEditing = !!editingClient;

  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    address: editingClient?.address || '',
    contactNumber: editingClient?.contactNumber || '',
    email: editingClient?.email || '',
    contactPerson: editingClient?.contactPerson || '',
    businessType: editingClient?.businessType || '',
    notes: editingClient?.notes || ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        await axios.put(`/api/clients/${editingClient._id}`, formData, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Client updated successfully!');
      } else {
        await axios.post('/api/clients', formData, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Client added successfully!');
      }

      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/clients');
      }, 2000);

    } catch (err) {
      console.error('Error saving client:', err);
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to save client.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/clients');
  };

  return (
    <div className="add-client-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={handleCancel}
              title="Back to Client Management"
            >
              <span className="back-icon">⬅️</span>
            </button>
            <div className="header-text">
              <h1 className="page-title">
                <span className="title-icon">{isEditing ? '✏️' : '🏢'}</span>
                {isEditing ? 'Edit Client' : 'Add New Client'}
              </h1>
              <p className="page-subtitle">
                {isEditing ? 'Update client information and details' : 'Enter client information and contact details'}
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <div className="stat-content">
                <span className="stat-number">{isEditing ? 'Edit Mode' : 'New Entry'}</span>
                <span className="stat-label">Client Form</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="client-form-wrapper">
          {/* Alerts */}
          {error && (
            <div className="form-alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="form-alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="modern-client-form">
            {/* Basic Information Section */}
            <div className="form-section">
              <h4 className="section-title">
                <span className="section-icon">🏷️</span>
                Basic Information
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🏢</span>
                    Client Name
                  </label>
                  <input 
                    className="form-input"
                    type="text" 
                    name="name" 
                    value={formData.name}
                    onChange={onChange}
                    placeholder="e.g., Acme Corporation"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    Email Address
                  </label>
                  <input 
                    className="form-input"
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={onChange}
                    placeholder="e.g., contact@acmecorp.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Contact Person
                  </label>
                  <input 
                    className="form-input"
                    type="text" 
                    name="contactPerson" 
                    value={formData.contactPerson}
                    onChange={onChange}
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🏭</span>
                    Business Type
                  </label>
                  <select 
                    className="form-select"
                    name="businessType" 
                    value={formData.businessType}
                    onChange={onChange}
                  >
                    <option value="">Select business type</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="form-section">
              <h4 className="section-title">
                <span className="section-icon">📞</span>
                Contact Information
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📱</span>
                    Contact Number
                  </label>
                  <input 
                    className="form-input"
                    type="tel" 
                    name="contactNumber" 
                    value={formData.contactNumber}
                    onChange={onChange}
                    placeholder="e.g., +234 812 345 6789"
                    required 
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="label-icon">📍</span>
                    Address
                  </label>
                  <textarea 
                    className="form-textarea"
                    name="address" 
                    value={formData.address}
                    onChange={onChange}
                    placeholder="Enter complete client address (e.g., 123 Innovation Drive, Tech City, Lagos State)"
                    rows="3"
                    required 
                  />
                  <div className="form-help">
                    <span className="help-icon">🗺️</span>
                    Please provide complete address for accurate location mapping
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="form-section">
              <h4 className="section-title">
                <span className="section-icon">📝</span>
                Additional Information
              </h4>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  Notes (Optional)
                </label>
                <textarea 
                  className="form-textarea"
                  name="notes" 
                  value={formData.notes}
                  onChange={onChange}
                  placeholder="Any additional notes about the client, special requirements, or important details..."
                  rows="4"
                />
                <div className="form-help">
                  <span className="help-icon">💡</span>
                  Add any special instructions, preferences, or important details about this client
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="modern-btn cancel-btn"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <span className="btn-icon">❌</span>
                Cancel
              </button>
              <button 
                type="submit" 
                className={`modern-btn submit-btn ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                <span className="btn-icon">
                  {isSubmitting ? '🔄' : (isEditing ? '✅' : '💾')}
                </span>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Client' : 'Save Client')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClient;