import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffPages.css';

const SchedulePage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
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
      
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No upcoming schedule.</p>
        </div>
      ) : (
        <div className="staff-schedules-list">
          {tasks.map((task) => (
            <div key={task._id || task.id} className="staff-schedule-card">
              <div className="staff-schedule-client">{task.clientName || task.title}</div>
              <div className="staff-schedule-date">
                {task.startDate ? formatDate(task.startDate) : 'Scheduled'}
              </div>
              
              <div className="staff-schedule-details">
                {task.startTime && task.endTime && (
                  <div className="staff-schedule-item">
                    <span className="staff-schedule-icon">🕐</span>
                    <span>{task.startTime} - {task.endTime}</span>
                  </div>
                )}
                
                {task.location && (
                  <div className="staff-schedule-item">
                    <span className="staff-schedule-icon">📍</span>
                    <span>{task.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;

