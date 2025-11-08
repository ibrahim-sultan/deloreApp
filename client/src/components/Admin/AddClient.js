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
    streetType: '',
    contactNumber: editingClient?.contactNumber || '',
    email: editingClient?.email || '',
    contactPerson: editingClient?.contactPerson || '',
    businessType: editingClient?.businessType || '',
    notes: editingClient?.notes || '',
    latitude: editingClient?.coordinates?.latitude || '',
    longitude: editingClient?.coordinates?.longitude || ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCoordinatesFromAddress = async () => {
    if (!formData.address) {
      setError('Please enter an address first');
      setSuccess('');
      return;
    }

    setGeocoding(true);
    setError('');
    setSuccess('');

    const fetchWithTimeout = async (url, opts = {}, timeoutMs = 10000) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    // Apply optional street type if address lacks a street-type word
    const selectedType = String(formData.streetType || '').trim();
    const knownType = /\b(street|st|road|rd|avenue|ave|close|crescent|drive|dr|lane|ln|court|ct|boulevard|blvd|way|place|pl|terrace|ter|parkway|pkwy)\b/i;
    let addressForGeocode = String(formData.address || '').trim();
    if (selectedType && !knownType.test(addressForGeocode)) {
      addressForGeocode = `${addressForGeocode} ${selectedType}`;
    }

    const buildUrls = (rawAddress) => {
      const addr = String(rawAddress || '').trim();
      const urls = [];

      // 1) Base free-text
      urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&dedupe=1&q=${encodeURIComponent(addr)}`);

      // 2) Country-biased free-text (Nigeria, Canada)
      const countries = [
        { code: 'ng', name: 'Nigeria' },
        { code: 'ca', name: 'Canada' },
      ];
      for (const { code, name } of countries) {
        const hasName = new RegExp(`\\b${name}\\b`, 'i').test(addr);
        const biasedAddr = hasName ? addr : `${addr}, ${name}`;
        urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&dedupe=1&countrycodes=${code}&q=${encodeURIComponent(biasedAddr)}`);
      }

      // 3) Nigeria-specific structured attempt (helps for addresses like "house 2 salam street ilorin kwara state nigeria")
      const lower = addr.toLowerCase();
      if (/(nigeria|ilorin|kwara)/i.test(addr)) {
        const cleaned = addr
          .replace(/\bstate\b/gi, '')
          .replace(/^\s*house\s+/i, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        const streetOnly = cleaned
          .replace(/\bnigeria\b/gi, '')
          .replace(/\bilorin\b/gi, '')
          .replace(/\bkwara\b/gi, '')
          .replace(/\bstate\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        const toTitle = s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        const streetTitle = toTitle(streetOnly);
        const city = /\bilorin\b/i.test(addr) ? 'Ilorin' : 'Ilorin';
        const state = /\bkwara\b/i.test(addr) ? 'Kwara' : 'Kwara';
        // Structured query
        urls.push(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&street=${encodeURIComponent(streetTitle)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&countrycodes=ng`
        );
        // Refined free-text, NG-biased
        const refined = `${streetTitle}, ${city}, ${state}, Nigeria`;
        urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=ng&q=${encodeURIComponent(refined)}`);
      }

      return urls;
    };

    const geocodeUrl = async (url) => {
      const res = await fetchWithTimeout(url, {}, 10000);
      if (!res.ok) {
        const err = new Error(`Geocoding failed with status ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    try {
      let data = [];
      const urls = buildUrls(addressForGeocode);

      for (const url of urls) {
        let attemptResult = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            attemptResult = await geocodeUrl(url);
            break; // success for this URL
          } catch (e) {
            const status = e?.status;
            const isRetryable = status === 429 || status === 503 || e.name === 'AbortError' || e.message?.includes('NetworkError');
            if (attempt === 0 && isRetryable) {
              await sleep(1200);
              continue;
            }
            throw e;
          }
        }
        if (Array.isArray(attemptResult) && attemptResult.length > 0) {
          data = attemptResult;
          break; // we have a result; stop trying further URLs
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        setFormData({
          ...formData,
          latitude: data[0].lat,
          longitude: data[0].lon
        });
        setError('');
        setSuccess('Coordinates found successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setSuccess('');
        setError('Could not find coordinates for this address. Please enter them manually.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      let msg = 'Failed to get coordinates. Please enter them manually.';
      if (err?.status === 429) msg = 'Too many requests to geocoding service. Please wait a minute and try again.';
      else if (err?.status === 503) msg = 'Geocoding service is temporarily unavailable. Try again shortly.';
      else if (err?.name === 'AbortError') msg = 'Request timed out. Check your internet connection and try again.';
      setSuccess('');
      setError(msg);
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data with coordinates
      const dataToSend = {
        ...formData,
        coordinates: formData.latitude && formData.longitude ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        } : undefined
      };
      
      // Remove individual lat/lng fields from top level
      delete dataToSend.latitude;
      delete dataToSend.longitude;
      delete dataToSend.streetType;
      
      if (isEditing) {
        await axios.put(`/api/clients/${editingClient._id}`, dataToSend, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Client updated successfully!');
      } else {
        await axios.post('/api/clients', dataToSend, {
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

                  <div className="inline-fields" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Street Type (optional)</label>
                      <select
                        className="form-select"
                        name="streetType"
                        value={formData.streetType}
                        onChange={onChange}
                      >
                        <option value="">-- Select --</option>
                        <option>Street</option>
                        <option>Road</option>
                        <option>Avenue</option>
                        <option>Close</option>
                        <option>Crescent</option>
                        <option>Drive</option>
                        <option>Lane</option>
                        <option>Court</option>
                        <option>Boulevard</option>
                        <option>Way</option>
                        <option>Place</option>
                        <option>Terrace</option>
                        <option>Parkway</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌍</span>
                    Latitude
                  </label>
                  <input 
                    className="form-input"
                    type="number" 
                    name="latitude" 
                    value={formData.latitude}
                    onChange={onChange}
                    placeholder="e.g., 6.5244"
                    step="any"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌍</span>
                    Longitude
                  </label>
                  <input 
                    className="form-input"
                    type="number" 
                    name="longitude" 
                    value={formData.longitude}
                    onChange={onChange}
                    placeholder="e.g., 3.3792"
                    step="any"
                  />
                </div>

                <div className="form-group full-width">
                  <button 
                    type="button" 
                    className="modern-btn geocode-btn"
                    onClick={getCoordinatesFromAddress}
                    disabled={geocoding || !formData.address}
                    style={{ marginTop: '10px', background: '#28a745', color: 'white' }}
                  >
                    <span className="btn-icon">{geocoding ? '🔄' : '🗺️'}</span>
                    {geocoding ? 'Getting Coordinates...' : 'Get Coordinates from Address'}
                  </button>
                  <div className="form-help" style={{ marginTop: '10px' }}>
                    <span className="help-icon">💡</span>
                    Click this button to automatically find coordinates, or enter them manually
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