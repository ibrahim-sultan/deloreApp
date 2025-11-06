
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import LoadingSpinner from '../Common/LoadingSpinner';
import AssignTaskSimpleForm from './AssignTaskSimpleForm';
import './TaskManagement.css';

const TaskManagement = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAssign, setShowAssign] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleEdit = (task) => {
    setEditingTask(task);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`/api/admin/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Task deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await axios.put(`/api/admin/tasks/${taskId}`, updates, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Task updated successfully');
      setEditingTask(null);
      fetchData();
    } catch (error) {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Failed to update task');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, staffRes, clientsRes] = await Promise.all([
        axios.get('/api/admin/assigned-tasks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/admin/staff', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      const extractArray = (response, primaryKey) => {
        if (!response || !response.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (typeof response.data === 'object' && response.data !== null) {
          return response.data[primaryKey] || response.data.users || response.data.data || [];
        }
        return [];
      };

      const tasksArray = extractArray(tasksRes, 'tasks');
      const staffArray = extractArray(staffRes, 'staff');
      const clientsArray = extractArray(clientsRes, 'clients');

      const validTasks = tasksArray.filter(task => task && typeof task === 'object' && typeof task._id === 'string');

      const normalizedTasks = validTasks.map(task => ({
        ...task,
        assignedTo: (task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo.name) ? task.assignedTo : null,
        client: (task.client && typeof task.client === 'object' && task.client.name) ? task.client : null,
      }));

      const sanitizedStaff = staffArray.filter(s => s && s._id && s.name);
      const sanitizedClients = clientsArray.filter(c => c && c._id && c.name);

      setAllTasks(normalizedTasks);
      setStaff(sanitizedStaff);
      setClients(sanitizedClients);
      setError('');
    } catch (err) {
      console.error('Failed to fetch or process data:', err);
      const serverMessage = err.response?.data?.message || '';
      const errorMessage = `An unexpected error occurred. ${serverMessage ? `Server says: ${serverMessage}` : 'Please check the console for details.'}`;
      setError(`Failed to load data. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const ds = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const ts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${ds} @ ${ts}`;
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedStaff === 'all') return allTasks;
    return allTasks.filter(task => task?.assignedTo?._id === selectedStaff);
  }, [allTasks, selectedStaff]);

  if (loading) return <div className="center-loading"><LoadingSpinner /></div>;
  if (error) return <div className="simple-alert error" role="alert">{error}</div>;

  const statusLabel = (status) => {
    if (status === 'pending') return 'Upcoming';
    if (status === 'in-progress') return 'In Progress';
    return (status || 'pending').replace('-', ' ');
  };

  return (
    <div className="simple-task-page">
      <div className="simple-header">
        <h2>All Assigned Tasks</h2>
        <button className="primary-btn" onClick={() => setShowAssign(true)}>Assign New Task</button>
      </div>

      <div className="simple-filter">
        <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
          <option value="all">All Staff ({allTasks.length} tasks)</option>
          {staff.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Client</th>
              <th>Scheduled</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task._id}>
                <td>{task.assignedTo?.name || 'Unassigned'}</td>
                <td>{task.client?.name || '-'}</td>
                <td>{formatDateTime(task.scheduledStartTime)}</td>
                <td>{task.clockInTime ? formatDateTime(task.clockInTime) : '-'}</td>
                <td>{task.clockOutTime ? formatDateTime(task.clockOutTime) : '-'}</td>
                <td>{task.hoursSpent ? `${task.hoursSpent.toFixed(2)}h` : '-'}</td>
                <td><span className={`status-chip ${task.status || 'pending'}`}>{statusLabel(task.status)}</span></td>
                <td>
                  {/* Admin overrides for clock in/out */}
                  {!task.clockInTime && (
                    <button 
                      className="icon-btn" 
                      title="Clock-in for staff"
                      onClick={async () => {
                        const reason = window.prompt('Reason for admin clock-in override?');
                        if (!reason) return;
                        try {
                          await axios.post(`/api/admin/override-clock-in/${task._id}`, { reason }, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                          });
                          alert('Clock-in override successful');
                          fetchData();
                        } catch (e) {
                          alert(e.response?.data?.message || 'Clock-in override failed');
                        }
                      }}
                    >⏱️ In</button>
                  )}
                  {task.clockInTime && !task.clockOutTime && (
                    <button 
                      className="icon-btn" 
                      title="Clock-out for staff"
                      onClick={async () => {
                        const workSummary = window.prompt('Enter work summary for clock-out');
                        if (!workSummary) return;
                        const reason = window.prompt('Reason for admin clock-out override?');
                        if (!reason) return;
                        try {
                          await axios.post(`/api/admin/override-clock-out/${task._id}`, { reason, workSummary }, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                          });
                          alert('Clock-out override successful');
                          fetchData();
                        } catch (e) {
                          alert(e.response?.data?.message || 'Clock-out override failed');
                        }
                      }}
                    >🏁 Out</button>
                  )}
                  <button className="icon-btn" title="Edit" onClick={() => handleEdit(task)}>✏️</button>
                  <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(task._id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-row">No tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAssign && (
        <div className="form-modal-overlay" role="dialog" aria-modal="true">
          <div className="form-modal assign-modal">
            <div className="form-modal-header">
              <h3 className="modal-title"><span className="modal-icon">📝</span> Assign New Task</h3>
              <button className="modal-close-btn" onClick={() => setShowAssign(false)} aria-label="Close">×</button>
            </div>
            <div className="assign-form-container">
              <AssignTaskSimpleForm 
                staff={staff} 
                clients={clients} 
                onClose={() => setShowAssign(false)} 
                onSaved={fetchData} 
              />
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="form-modal-overlay" role="dialog" aria-modal="true">
          <div className="form-modal assign-modal">
            <div className="form-modal-header">
              <h3 className="modal-title"><span className="modal-icon">✏️</span> Edit Task</h3>
              <button className="modal-close-btn" onClick={() => setEditingTask(null)} aria-label="Close">×</button>
            </div>
            <div className="assign-form-container">
              <EditTaskForm 
                task={editingTask}
                staff={staff} 
                clients={clients} 
                onClose={() => setEditingTask(null)} 
                onUpdate={handleUpdateTask}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Task Form Component
const EditTaskForm = ({ task, staff, clients, onClose, onUpdate }) => {
  const [staffId, setStaffId] = useState(task.assignedTo?._id || '');
  const [clientId, setClientId] = useState(task.client?._id || '');
  const [status, setStatus] = useState(task.status || 'assigned');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize date/time from task
  React.useEffect(() => {
    if (task.scheduledStartTime) {
      const start = new Date(task.scheduledStartTime);
      setDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
    }
    if (task.scheduledEndTime) {
      const end = new Date(task.scheduledEndTime);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updates = {
      assignedTo: staffId,
      client: clientId,
      status,
      scheduledStartTime: date && startTime ? `${date}T${startTime}` : task.scheduledStartTime,
      scheduledEndTime: date && endTime ? `${date}T${endTime}` : task.scheduledEndTime
    };

    await onUpdate(task._id, updates);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label>Assign to Staff</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
            <option value="">Select Staff</option>
            {staff.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Select Client</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="form-field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        <div className="form-field">
          <label>End Time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Updating...' : 'Update Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskManagement;
