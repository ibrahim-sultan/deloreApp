import React, { useState } from 'react';
import axios from 'axios';

const AssignTaskSimpleForm = ({ staff = [], clients = [], onClose, onSaved }) => {
  const [staffId, setStaffId] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toDateTime = (d, t) => (d && t ? `${d}T${t}` : '');

  const calcTotalHours = (start, end) => {
    try {
      if (!start || !end) return '';
      const s = new Date(start);
      const e = new Date(end);
      const diff = (e - s) / (1000 * 60 * 60);
      return diff > 0 ? diff.toFixed(2) : '';
    } catch {
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');

    const scheduledStartTime = toDateTime(date, startTime);
    const scheduledEndTime = toDateTime(date, endTime);
    const totalHours = calcTotalHours(scheduledStartTime, scheduledEndTime);

    try {
      const form = new FormData();
      form.append('title', 'Task');
      form.append('description', '');
      form.append('location', '');
      form.append('contactPerson', '');
      form.append('latitude', '');
      form.append('longitude', '');
      form.append('scheduledStartTime', scheduledStartTime);
      form.append('scheduledEndTime', scheduledEndTime);
      form.append('totalHours', totalHours);
      form.append('staffId', staffId);
      form.append('clientId', clientId);
      form.append('recurring', String(recurring));

      await axios.post('/api/admin/assign-task', form, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="assign-task-form-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label className="field-label">
            <span className="field-icon">👤</span>
            Assign to Staff
          </label>
          <div className="select-wrapper">
            <select 
              value={staffId} 
              onChange={(e) => setStaffId(e.target.value)} 
              className="form-select"
              required
            >
              <option value="">Select Staff</option>
              {staff.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">
            <span className="field-icon">🏢</span>
            Select Client
          </label>
          <div className="select-wrapper">
            <select 
              value={clientId} 
              onChange={(e) => setClientId(e.target.value)} 
              className="form-select"
              required
            >
              <option value="">Select Client</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">
            <span className="field-icon">📅</span>
            Date
          </label>
          <div className="input-wrapper">
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="form-input"
              required 
            />
            <span className="input-icon">📅</span>
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">
            <span className="field-icon">🕐</span>
            Start Time
          </label>
          <div className="input-wrapper">
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              className="form-input"
              required 
            />
            <span className="input-icon">🕐</span>
          </div>
        </div>

        <div className="form-field full-width">
          <label className="field-label">
            <span className="field-icon">🕐</span>
            Check-out Time
          </label>
          <div className="input-wrapper">
            <input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              className="form-input"
              placeholder="--:--"
            />
            <span className="input-icon">🕐</span>
          </div>
        </div>
      </div>

      <div className="checkbox-field">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={recurring} 
            onChange={(e) => setRecurring(e.target.checked)}
            className="checkbox-input"
          />
          <span className="checkbox-text">Recurring assignment</span>
        </label>
      </div>

      <button type="submit" className="save-task-btn" disabled={saving}>
        {saving ? 'Saving...' : 'Save Task'}
      </button>
    </div>
  );
};

export default AssignTaskSimpleForm;

