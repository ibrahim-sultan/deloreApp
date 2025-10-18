
import React, { useState } from 'react';
import axios from 'axios';

const Input = ({ label, name, value, onChange, type = 'text', placeholder, required = true }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

const Select = ({ label, name, value, onChange, options, placeholder, required = true }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <select
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
            <option value="">{placeholder}</option>
            {options.map(option => (
                <option key={option._id} value={option._id}>{option.name}</option>
            ))}
        </select>
    </div>
);

const AssignTaskForm = ({ staff, clients, onTaskAssigned, onCancel }) => {
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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
            await axios.post('/api/admin/assign-task', taskData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Task assigned successfully! The form will close shortly.');
            setTimeout(() => {
                if (onTaskAssigned) {
                    onTaskAssigned();
                }
            }, 2000); // Wait 2 seconds before closing
        } catch (err) {
            console.error('Error assigning task:', err);
            setError(err.response?.data?.message || 'Failed to assign task. Please check all fields.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Assign New Task</h3>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{success}</div>}
                
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Task Title" name="title" value={title} onChange={onChange} placeholder="e.g., Site Survey 8" />
                        <Input label="Location" name="location" value={location} onChange={onChange} placeholder="e.g., 123 Main St, Anytown" />
                        <Input label="Contact Person" name="contactPerson" value={contactPerson} onChange={onChange} placeholder="e.g., John Doe" />
                        <Input type="number" label="Total Hours" name="totalHours" value={totalHours} onChange={onChange} placeholder="e.g., 8" />
                        <Input type="datetime-local" label="Scheduled Start Time" name="scheduledStartTime" value={scheduledStartTime} onChange={onChange} />
                        <Input type="datetime-local" label="Scheduled End Time" name="scheduledEndTime" value={scheduledEndTime} onChange={onChange} />
                        <Select label="Assign to Staff" name="staffId" value={staffId} onChange={onChange} options={staff} placeholder="Select a staff member" />
                        <Select label="Assign to Client" name="clientId" value={clientId} onChange={onChange} options={clients} placeholder="Select a client" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input type="number" step="any" label="Latitude" name="latitude" value={latitude} onChange={onChange} placeholder="e.g., 34.0522" />
                        <Input type="number" step="any" label="Longitude" name="longitude" value={longitude} onChange={onChange} placeholder="e.g., -118.2437" />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            value={description}
                            onChange={onChange}
                            placeholder="Detailed description of the task..."
                            required
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="mapAttachment" className="block text-sm font-medium text-gray-700 mb-1">Map/File Attachment</label>
                        <input
                            type="file"
                            name="mapAttachment"
                            id="mapAttachment"
                            onChange={onFileChange}
                            required
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Assign Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignTaskForm;
