import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffPages.css';

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/my-tasks');
      console.log('Fetched tasks:', response.data.tasks);
      const allTasks = response.data.tasks || [];
      // Show only pending/upcoming/assigned tasks on dashboard
      const upcomingTasks = allTasks.filter(task => 
        task.status === 'pending' || task.status === 'assigned' || task.status === 'in-progress'
      );
      console.log('Upcoming tasks:', upcomingTasks);
      setTasks(upcomingTasks.slice(0, 3)); // Show first 3
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (taskId) => {
    try {
      setProcessing(taskId);
      await axios.post(`/api/tasks/${taskId}/clock-in`);
      alert('Clocked in successfully!');
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error('Clock in error:', error);
      alert(error.response?.data?.message || 'Failed to clock in');
    } finally {
      setProcessing(null);
    }
  };

  const handleClockOut = async (taskId) => {
    try {
      setProcessing(taskId);
      const workSummary = prompt('Please provide a brief summary of the work completed:');
      if (workSummary === null) {
        setProcessing(null);
        return; // User cancelled
      }
      await axios.post(`/api/tasks/${taskId}/clock-out`, { workSummary });
      alert('Clocked out successfully!');
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error('Clock out error:', error);
      alert(error.response?.data?.message || 'Failed to clock out');
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
                {(task.scheduledStartTime || task.startTime) && (task.scheduledEndTime || task.endTime) && (
                  <div className="staff-detail-item">
                    <span className="staff-detail-icon">🕐</span>
                    <span>
                      {new Date(task.scheduledStartTime || task.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.scheduledEndTime || task.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                
                {task.location && (
                  <div className="staff-detail-item location-item">
                    <span className="staff-detail-icon">📍</span>
                    <span>{task.location}</span>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location)}${task.coordinates?.latitude && task.coordinates?.longitude ? `&destination=${task.coordinates.latitude},${task.coordinates.longitude}` : ''}`}
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
                    onClick={() => handleClockIn(task.id || task._id)}
                    disabled={processing === (task.id || task._id)}
                  >
                    <span>✓</span> {processing === (task.id || task._id) ? 'Checking in...' : 'Check In'}
                  </button>
                ) : task.clockInTime && !task.clockOutTime ? (
                  <button 
                    className="staff-action-btn primary pink"
                    onClick={() => handleClockOut(task.id || task._id)}
                    disabled={processing === (task.id || task._id)}
                  >
                    <span>📄</span> {processing === (task.id || task._id) ? 'Checking out...' : 'Report & Check Out'}
                  </button>
                ) : (
                  <div className="staff-completed-badge">✓ Completed</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

