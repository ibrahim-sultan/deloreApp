import React, { useState } from 'react';
import axios from 'axios';

const TaskCreation = ({ tasks, onUpdate }) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    totalHours: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    // Validate total hours
    const hours = parseFloat(formData.totalHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Total hours must be a positive number');
      setCreating(false);
      return;
    }

    if (hours < 0.1) {
      setError('Total hours must be at least 0.1');
      setCreating(false);
      return;
    }

    // Validate that title contains numbers (hours)
    const hoursMatch = formData.title.match(/\d+(\.\d+)?/);
    if (!hoursMatch) {
      setError('Title must include total hours as numbers (e.g., "Task Name 8" or "Project Work 4.5")');
      setCreating(false);
      return;
    }

    try {
      await axios.post('/api/tasks/create', formData);
      setSuccess('Task created successfully!');
      setFormData({
        title: '',
        description: '',
        location: '',
        totalHours: ''
      });
      setShowTaskForm(false);
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     'Failed to create task';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      setSuccess('Task status updated successfully!');
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task status';
      setError(message);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setSuccess('Task deleted successfully!');
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task';
      setError(message);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <div className="task-section">
      <div className="section-header">
        <h2 className="section-title">Task Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowTaskForm(!showTaskForm)}
        >
          {showTaskForm ? 'Cancel' : 'Create Task'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showTaskForm && (
        <form onSubmit={handleSubmit} className="task-form">
          <h3>Create New Task</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title" className="form-label">Task Title (must include hours)</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="e.g., 'Website Development 8' or 'Client Meeting 2.5'"
              />
              <small className="form-help">Title must include total hours as numbers</small>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="Enter task location"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input form-textarea"
              required
              placeholder="Enter task description"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalHours" className="form-label">Total Hours</label>
            <input
              type="number"
              id="totalHours"
              name="totalHours"
              value={formData.totalHours}
              onChange={handleInputChange}
              className="form-input"
              required
              min="0.1"
              step="0.1"
              placeholder="e.g., 8 or 4.5"
            />
            <small className="form-help">Enter the total hours for this task (minimum 0.1)</small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      )}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Tasks Yet</h3>
            <p className="empty-state-text">Create your first task to get started</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-item">
              <div className="task-header">
                <h3 className="task-title">{task.title}</h3>
                <div className="action-buttons">
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    className="form-input"
                    style={{ width: 'auto', marginRight: '8px' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="task-description">
                {task.description}
              </div>

              <div className="task-details">
                <div className="task-detail">
                  <div className="task-detail-label">Location</div>
                  <div className="task-detail-value">{task.location}</div>
                </div>

                <div className="task-detail">
                  <div className="task-detail-label">Total Hours</div>
                  <div className="task-detail-value">{task.totalHours} hours</div>
                </div>

                <div className="task-detail">
                  <div className="task-detail-label">Hours Spent</div>
                  <div className="task-detail-value">{task.hoursSpent || 0} hours</div>
                </div>
              </div>

              <div className="task-footer">
                <span className={`status-badge status-${task.status}`}>
                  {task.status.replace('-', ' ')}
                </span>
                <span className="task-created">
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskCreation;
