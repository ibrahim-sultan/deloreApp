import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffPages.css';

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [checkoutTask, setCheckoutTask] = useState(null);
  const [workSummary, setWorkSummary] = useState('');

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/my-tasks');
      const allTasks = response.data.tasks || [];
      const upcomingTasks = allTasks.filter(task =>
        ['pending', 'assigned', 'in-progress'].includes(task.status)
      );
      setTasks(upcomingTasks.slice(0, 3)); // Show first 3 tasks
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Haversine formula to calculate distance in meters
  const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get current coordinates with accuracy check
  const getCurrentCoords = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));

      navigator.geolocation.getCurrentPosition(
        pos => {
          if (pos.coords.accuracy > 100) {
            return reject(new Error(`GPS accuracy too low (${pos.coords.accuracy}m). Move to a better location.`));
          }
          resolve({
            latitude: parseFloat(pos.coords.latitude),
            longitude: parseFloat(pos.coords.longitude),
          });
        },
        err => reject(new Error(err.message || 'Geolocation failed')),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  // Handle clock in
  const handleClockIn = async task => {
    const taskId = task.id || task._id;
    try {
      setProcessing(taskId);

      // Optional time window check
      if (task.scheduledStartTime) {
        const start = new Date(task.scheduledStartTime).getTime();
        const now = Date.now();
        const windowMs = 30 * 60 * 1000; // 30 minutes
        if (now < start - windowMs || now > start + windowMs) {
          alert('You can only check in within 30 minutes before or after the scheduled start time.');
          setProcessing(null);
          return;
        }
      }

      const coords = await getCurrentCoords();
      const taskLat = parseFloat(task.coordinates?.latitude);
      const taskLng = parseFloat(task.coordinates?.longitude);

      if (isNaN(taskLat) || isNaN(taskLng)) {
        alert('Assigned location not set. Cannot check in.');
        setProcessing(null);
        return;
      }

      const distance = haversine(coords.latitude, coords.longitude, taskLat, taskLng);
      if (distance > 500) {
        alert(`You are too far from the assigned location (${Math.round(distance)}m). Move within 500m to check in.`);
        setProcessing(null);
        return;
      }

      await axios.post(`/api/tasks/${taskId}/clock-in`, coords);
      alert('Clocked in successfully!');
      fetchTasks();
    } catch (error) {
      console.error('Clock in error:', error);
      alert(error.message || error.response?.data?.message || 'Failed to clock in');
    } finally {
      setProcessing(null);
    }
  };

  // Handle clock out modal
  const handleClockOut = taskId => {
    setCheckoutTask(taskId);
    setWorkSummary('');
  };

  // Submit clock out
  const submitClockOut = async () => {
    if (!checkoutTask) return;
    try {
      setProcessing(checkoutTask);
      const coords = await getCurrentCoords();
      await axios.post(`/api/tasks/${checkoutTask}/clock-out`, { ...coords, workSummary });
      alert('Clocked out successfully!');
      setCheckoutTask(null);
      setWorkSummary('');
      fetchTasks();
    } catch (error) {
      console.error('Clock out error:', error);
      alert(error.message || error.response?.data?.message || 'Failed to clock out');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="staff-page">
        <h1 className="staff-page-title">Dashboard</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Dashboard</h1>

      <div className="staff-welcome-banner">
        <h2 className="staff-welcome-title">Hello, Staff Member!</h2>
        <p className="staff-welcome-subtitle">Here's what's on your plate for today.</p>
      </div>

      <div className="staff-content-card">
        <h3 className="staff-card-title">Today's Assignment</h3>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No assignments for today.</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div key={task._id || task.id || index} className="staff-assignment">
              <div className="staff-assignment-header">
                <span className="staff-client-name">{task.client?.name || task.title}</span>
                <span className="staff-status-badge upcoming">{task.status || 'Pending'}</span>
              </div>

              <div className="staff-assignment-details">
                {(task.scheduledStartTime || task.startTime) &&
                  (task.scheduledEndTime || task.endTime) && (
                    <div className="staff-detail-item">
                      <span className="staff-detail-icon">🕐</span>
                      <span>
                        {new Date(task.scheduledStartTime || task.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(task.scheduledEndTime || task.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                {task.location && (
                  <div className="staff-detail-item location-item">
                    <span className="staff-detail-icon">📍</span>
                    <span>{task.location}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${
                        task.coordinates?.latitude && task.coordinates?.longitude
                          ? `${task.coordinates.latitude},${task.coordinates.longitude}`
                          : encodeURIComponent(task.location || '')
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="staff-directions-btn"
                    >
                      <span>✈️</span> Directions
                    </a>
                  </div>
                )}

                {task.contactPerson && (
                  <div className="staff-detail-item">
                    <span className="staff-detail-icon">👤</span>
                    <span>Contact: {task.contactPerson}</span>
                  </div>
                )}
              </div>

              <div className="staff-action-buttons">
                {!task.clockInTime ? (
                  <button
                    className="staff-action-btn primary green"
                    onClick={() => handleClockIn(task)}
                    disabled={processing === (task.id || task._id)}
                  >
                    <span>✓</span>{' '}
                    {processing === (task.id || task._id) ? 'Checking in...' : 'Check In'}
                  </button>
                ) : task.clockInTime && !task.clockOutTime ? (
                  <button
                    className="staff-action-btn primary pink"
                    onClick={() => handleClockOut(task.id || task._id)}
                    disabled={processing === (task.id || task._id)}
                  >
                    <span>📄</span>{' '}
                    {processing === (task.id || task._id) ? 'Checking out...' : 'Report & Check Out'}
                  </button>
                ) : (
                  <div className="staff-completed-badge">✓ Completed</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {checkoutTask && (
        <div className="modal-overlay" onClick={() => setCheckoutTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report & Check Out</h3>
              <button className="close-button" onClick={() => setCheckoutTask(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="form-label">Work Summary</label>
              <textarea
                className="form-input form-textarea"
                rows={8}
                placeholder="Describe what you accomplished, issues faced, and any notes."
                value={workSummary}
                onChange={e => setWorkSummary(e.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setCheckoutTask(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitClockOut}
                disabled={processing === checkoutTask}
              >
                {processing === checkoutTask ? 'Checking out...' : 'Submit & Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
