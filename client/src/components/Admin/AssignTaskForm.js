
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignTaskForm = ({ onTaskAssigned }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        contactPerson: '',
        scheduledStartTime: '',
        scheduledEndTime: '',
        totalHours: '',
        staffId: '',
        clientId: '',
        mapAttachment: null
    });
    const [staff, setStaff] = useState([]);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Fetch staff and clients
        const fetchData = async () => {
            try {
                const [staffRes, clientsRes] = await Promise.all([
                    axios.get('/api/admin/staff', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                    axios.get('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                ]);
                setStaff(staffRes.data);
                setClients(clientsRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch staff or clients.');
            }
        };
        fetchData();
    }, []);

    const { title, description, location, latitude, longitude, contactPerson, scheduledStartTime, scheduledEndTime, totalHours, staffId, clientId } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onFileChange = e => setFormData({ ...formData, mapAttachment: e.target.files[0] });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const taskData = new FormData();
        for (const key in formData) {
            taskData.append(key, formData[key]);
        }

        try {
            const res = await axios.post('/api/admin/assign-task', taskData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Task assigned successfully!');
            setFormData({
                title: '',
                description: '',
                location: '',
                latitude: '',
                longitude: '',
                contactPerson: '',
                scheduledStartTime: '',
                scheduledEndTime: '',
                totalHours: '',
                staffId: '',
                clientId: '',
                mapAttachment: null
            });
            if (onTaskAssigned) {
                onTaskAssigned();
            }
        } catch (err) {
            console.error('Error assigning task:', err);
            setError(err.response?.data?.message || 'Failed to assign task.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-xl font-bold mb-4">Assign New Task</h3>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
            <form onSubmit={onSubmit}>
                {/* Form fields for task details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="title" value={title} onChange={onChange} placeholder="Task Title" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="text" name="location" value={location} onChange={onChange} placeholder="Location" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="number" name="latitude" value={latitude} onChange={onChange} placeholder="Latitude" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="number" name="longitude" value={longitude} onChange={onChange} placeholder="Longitude" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="text" name="contactPerson" value={contactPerson} onChange={onChange} placeholder="Contact Person" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="datetime-local" name="scheduledStartTime" value={scheduledStartTime} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="datetime-local" name="scheduledEndTime" value={scheduledEndTime} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <input type="number" name="totalHours" value={totalHours} onChange={onChange} placeholder="Total Hours" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <select name="staffId" value={staffId} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="">Select Staff</option>
                        {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <select name="clientId" value={clientId} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <textarea name="description" value={description} onChange={onChange} placeholder="Description" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline md:col-span-2"></textarea>
                    <input type="file" name="mapAttachment" onChange={onFileChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline md:col-span-2" />
                </div>
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">Assign Task</button>
            </form>
        </div>
    );
};

export default AssignTaskForm;
