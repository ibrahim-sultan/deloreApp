import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffPages.css';

const SchedulePage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [busyTaskId, setBusyTaskId] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get('/api/tasks/my-tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (task) => {
    setActionError('');
    setActionSuccess('');
    setBusyTaskId(task.id || task._id);

    if (!navigator.geolocation) {
      setActionError('Geolocation not supported by this browser');
      setBusyTaskId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const id = task.id || task._id;
        const res = await axios.post(`/api/tasks/${id}/clock-in`, { latitude, longitude });
        setActionSuccess(res.data?.message || 'Clock-in successful');
        await fetchSchedule();
      } catch (e) {
        const msg = e.response?.data?.message || 'Clock-in failed';
        setActionError(msg);
      } finally {
        setBusyTaskId(null);
      }
    }, (err) => {
      setActionError(err.message || 'Failed to get current location');
      setBusyTaskId(null);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="staff-page">
        <h1 className="staff-page-title">Schedule</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Schedule</h1>
      
      <h2 className="staff-section-title">Upcoming Schedule</h2>
      
      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {actionError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{actionError}</div>}
      {actionSuccess && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{actionSuccess}</div>}
      
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No upcoming schedule.</p>
        </div>
      ) : (
        <div className="staff-schedules-list">
          {tasks.map((task) => (
            <div key={task._id || task.id} className="staff-schedule-card">
              <div className="staff-schedule-client">{task.title}</div>
              <div className="staff-schedule-date">
                Scheduled: {formatDateTime(task.scheduledStartTime)}
              </div>
              
              <div className="staff-schedule-details">
                {task.location && (
                  <div className="staff-schedule-item">
                    <span className="staff-schedule-icon">📍</span>
                    <span>{task.location}</span>
                  </div>
                )}
                <div className="staff-schedule-item">
                  <span className="staff-schedule-icon">🧭</span>
                  <span>Geofence: 500m</span>
                </div>
                <div className="staff-schedule-item">
                  <span className="staff-schedule-icon">⏱️</span>
                  <span>Clock-in window: ±30 minutes</span>
                </div>
              </div>

              {!task.clockInTime && (
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    disabled={busyTaskId === (task.id || task._id)}
                    onClick={() => handleClockIn(task)}
                  >
                    {busyTaskId === (task.id || task._id) ? 'Clocking in…' : 'Clock in (use current location)'}
                  </button>
                </div>
              )}
              {task.clockInTime && (
                <div className="staff-schedule-item" style={{ marginTop: 8 }}>
                  <span className="staff-schedule-icon">✅</span>
                  <span>Clocked in at {formatDateTime(task.clockInTime)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;

