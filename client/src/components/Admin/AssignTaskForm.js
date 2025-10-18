
import React, { useState, useEffect } from 'react';
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { title, description, location, latitude, longitude, contactPerson, scheduledStartTime, scheduledEndTime, totalHours, staffId, clientId } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onFileChange = e => setFormData({ ...formData, mapAttachment: e.target.files[0] });

    const onSubmit = async e => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        setSuccess('');

        const taskData = new FormData();
        Object.keys(formData).forEach(key => {
            taskData.append(key, formData[key]);
        });

        try {
            await axios.post('/api/admin/assign-task', taskData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Task assigned successfully!');
            setTimeout(() => {
                if (onTaskAssigned) {
                    onTaskAssigned();
                }
            }, 1500);
        } catch (err) {
            console.error('Error assigning task:', err);
            setError(err.response?.data?.message || 'Failed to assign task. Please check all fields.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 px-4">
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full m-4" style={{maxHeight: '90vh', overflowY: 'auto'}}>
                <h3 className="text-3xl font-bold text-center text-gray-800 mb-6">Assign New Task</h3>
                
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">{error}</div>}
                {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6" role="alert">{success}</div>}
                
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input label="Task Title" name="title" value={title} onChange={onChange} placeholder="e.g., Conduct Site Survey" />
                        <Input label="Location" name="location" value={location} onChange={onChange} placeholder="e.g., 123 Innovation Drive, Tech City" />
                        <Input label="Contact Person" name="contactPerson" value={contactPerson} onChange={onChange} placeholder="e.g., Jane Doe" />
                        <Input type="number" label="Total Hours" name="totalHours" value={totalHours} onChange={onChange} placeholder="e.g., 8" />
                        <Input type="datetime-local" label="Scheduled Start Time" name="scheduledStartTime" value={scheduledStartTime} onChange={onChange} />
                        <Input type="datetime-local" label="Scheduled End Time" name="scheduledEndTime" value={scheduledEndTime} onChange={onChange} />
                        <Select label="Assign to Staff" name="staffId" value={staffId} onChange={onChange} options={staff} placeholder="Select a staff member" />
                        <Select label="Assign to Client" name="clientId" value={clientId} onChange={onChange} options={clients} placeholder="Select a client" />
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
                            placeholder="Provide a detailed description of the task requirements and objectives..."
                            required
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="mapAttachment" className="block text-sm font-medium text-gray-700 mb-1">Map or File Attachment</label>
                        <input
                            type="file"
                            name="mapAttachment"
                            id="mapAttachment"
                            onChange={onFileChange}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional: Attach a map, blueprint, or other relevant file.</p>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-8 py-3 border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className={`px-8 py-3 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                            isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                        }`}>
                            {isSubmitting ? 'Assigning...' : 'Assign Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignTaskForm;
