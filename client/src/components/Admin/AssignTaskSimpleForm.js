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
      // backend ignores unknown fields; include recurring flag if needed later
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
    <form className="simple-assign-form" onSubmit={handleSubmit}>
      <h2 className="simple-assign-title">Assign New Task</h2>

      {error && <div className="simple-alert error">{error}</div>}

      <div className="simple-grid">
        <div className="simple-field">
          <label>Assign to Staff</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
            <option value="">Select Staff</option>
            {staff.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="simple-field">
          <label>Select Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Select Client</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="simple-field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="simple-field">
          <label>Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="simple-field full">
          <label>Check-out Time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <label className="simple-checkbox">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        Recurring assignment
      </label>

      <button type="submit" className="save-task-btn" disabled={saving}>
        {saving ? 'Saving...' : 'Save Task'}
      </button>
    </form>
  );
};

export default AssignTaskSimpleForm;
