
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignTaskForm from './AssignTaskForm';

const TaskManagement = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/assigned-tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAllTasks(response.data || []);
    } catch (error) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAssigned = () => {
    setShowAssignForm(false);
    fetchAllTasks(); // Refresh the task list
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredTasks = () => {
    if (selectedStaff === 'all') {
      return allTasks;
    }
    return allTasks.filter(task => task?.assignedTo && task.assignedTo._id === selectedStaff);
  };

  const getUniqueStaff = () => {
    const staffMap = new Map();
    allTasks.forEach(task => {
      if (task.assignedTo) {
        staffMap.set(task.assignedTo._id, task.assignedTo);
      }
    });
    return Array.from(staffMap.values());
  };

  const filteredTasks = getFilteredTasks();
  const uniqueStaff = getUniqueStaff();

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Task Management</h2>
        <div className="management-actions">
          <button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {showAssignForm ? 'Cancel' : 'Assign New Task'}
          </button>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="form-input ml-4"
            style={{ width: 'auto' }}
          >
            <option value="all">All Staff ({allTasks.length} tasks)</option>
            {uniqueStaff.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name} ({allTasks.filter(task => task?.assignedTo && task.assignedTo._id === staff._id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAssignForm && <AssignTaskForm onTaskAssigned={handleTaskAssigned} />}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tasks-table-container mt-8">
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Tasks Found</h3>
            <p className="empty-state-text">
              {selectedStaff === 'all' 
                ? 'No tasks have been assigned yet'
                : 'This staff member has no assigned tasks'
              }
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Client</th>
                <th>Location</th>
                <th>Status</th>
                <th>Scheduled Start</th>
                <th>Scheduled End</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <div>
                      <strong>{task?.title || 'Untitled task'}</strong>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{task?.assignedTo?.name || 'Unknown'}</strong>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{task?.client?.name || 'N/A'}</strong>
                    </div>
                  </td>
                  <td>{task?.location || '-'}</td>
                  <td>
                    <span className={`status-badge status-${task?.status || 'pending'}`}>
                      {(task?.status || 'pending').replace('-', ' ')}
                    </span>
                  </td>
                  <td>{task?.scheduledStartTime ? formatDate(task.scheduledStartTime) : '-'}</td>
                  <td>{task?.scheduledEndTime ? formatDate(task.scheduledEndTime) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
