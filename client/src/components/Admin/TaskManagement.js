
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
              <th>Date & Time</th>
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
                <td><span className={`status-chip ${task.status || 'pending'}`}>{statusLabel(task.status)}</span></td>
                <td>
                  <button className="icon-btn" title="Edit">✏️</button>
                  <button className="icon-btn danger" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">No tasks found</td>
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
    </div>
  );
};

export default TaskManagement;
