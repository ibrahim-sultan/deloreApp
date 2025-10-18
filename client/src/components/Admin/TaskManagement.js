
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AssignTaskForm from './AssignTaskForm';
import LoadingSpinner from '../Common/LoadingSpinner';

const TaskManagement = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAssignForm, setShowAssignForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [tasksRes, staffRes, clientsRes] = await Promise.all([
            axios.get('/api/admin/assigned-tasks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            axios.get('/api/users/staff', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            axios.get('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);

        // AGGRESSIVE DATA SANITIZATION
        // 1. Filter out any tasks that are not valid objects with a string _id.
        const validTasks = (tasksRes.data || []).filter(task => 
            task && typeof task === 'object' && typeof task._id === 'string'
        );

        // 2. Normalize each task to ensure nested data is safe to render.
        const normalizedTasks = validTasks.map(task => ({
            ...task,
            assignedTo: (task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo.name) 
                ? task.assignedTo 
                : null, // Set to null if it's not a valid object with a name
            client: (task.client && typeof task.client === 'object' && task.client.name)
                ? task.client
                : null, // Set to null if it's not a valid object with a name
        }));

        const sanitizedStaff = (staffRes.data || []).filter(s => s && s._id && s.name);
        const sanitizedClients = (clientsRes.data || []).filter(c => c && c._id && c.name);

        setAllTasks(normalizedTasks);
        setStaff(sanitizedStaff);
        setClients(sanitizedClients);
        setError('');
    } catch (err) {
        console.error('Failed to fetch or sanitize data:', err);
        setError('Failed to load data. An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTaskAssigned = () => {
    setShowAssignForm(false);
    fetchData(); // Refresh all data
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedStaff === 'all') {
      return allTasks;
    }
    // The data in allTasks is now sanitized, so ?. is for safety but less critical.
    return allTasks.filter(task => task?.assignedTo?._id === selectedStaff);
  }, [allTasks, selectedStaff]);
  
  const tasksByStaff = useMemo(() => {
      const counts = {};
      if (!staff || !allTasks) return {};
      staff.forEach(s => {
          counts[s._id] = allTasks.filter(task => task?.assignedTo?._id === s._id).length;
      });
      return counts;
  }, [allTasks, staff]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert"><strong>Error:</strong> {error}</div>;
  }
  
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-inner min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Task Management</h2>
        <button 
          onClick={() => setShowAssignForm(true)} 
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
          Assign New Task
        </button>
      </div>

      {showAssignForm && 
        <AssignTaskForm 
          staff={staff} 
          clients={clients} 
          onTaskAssigned={handleTaskAssigned} 
          onCancel={() => setShowAssignForm(false)} 
        />
      }

      <div className="mb-4">
        <label htmlFor="staffFilter" className="sr-only">Filter by Staff</label>
        <select
          id="staffFilter"
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Staff ({allTasks.length} tasks)</option>
          {staff.map(s => (
            <option key={s._id} value={s._id}>
              {s.name} ({tasksByStaff[s._id] || 0} tasks)
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        {filteredTasks.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700">No Tasks Found</h3>
            <p className="text-gray-500">
              {selectedStaff === 'all' 
                ? 'No tasks have been assigned yet. Try assigning one!'
                : 'This staff member has no assigned tasks.'
              }
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Dates</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <tr key={task._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">{task.title || 'Untitled task'}</div>
                    <div className="text-sm text-gray-500">{task.location || 'No location'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{task.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{task.client?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {(task.status || 'pending').replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>Start: {formatDate(task.scheduledStartTime)}</div>
                    <div>End: {formatDate(task.scheduledEndTime)}</div>
                  </td>
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
