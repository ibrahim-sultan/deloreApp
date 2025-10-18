
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignTaskForm.css';

const Input = ({ label, name, value, onChange, type = 'text', placeholder, required = true, icon }) => (
    <div className="modern-form-group">
        <label htmlFor={name} className="modern-form-label">
            {icon && <span className="label-icon">{icon}</span>}
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
            className="modern-form-input"
        />
    </div>
);

const Select = ({ label, name, value, onChange, options, placeholder, required = true, icon }) => (
    <div className="modern-form-group">
        <label htmlFor={name} className="modern-form-label">
            {icon && <span className="label-icon">{icon}</span>}
            {label}
        </label>
        <select
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            className="modern-form-select"
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
        <div className="modern-assign-form">
            {/* Alerts */}
            {error && (
                <div className="form-alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    {error}
                </div>
            )}
            {success && (
                <div className="form-alert alert-success">
                    <span className="alert-icon">✅</span>
                    {success}
                </div>
            )}
            
            <form onSubmit={onSubmit} className="modern-task-form">
                {/* Basic Information */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">📝</span>
                        Basic Information
                    </h4>
                    <div className="form-grid">
                        <Input 
                            icon="🏷️" 
                            label="Task Title" 
                            name="title" 
                            value={title} 
                            onChange={onChange} 
                            placeholder="e.g., Conduct Site Survey" 
                        />
                        <Input 
                            icon="📍" 
                            label="Location" 
                            name="location" 
                            value={location} 
                            onChange={onChange} 
                            placeholder="e.g., 123 Innovation Drive, Tech City" 
                        />
                        <Input 
                            icon="👤" 
                            label="Contact Person" 
                            name="contactPerson" 
                            value={contactPerson} 
                            onChange={onChange} 
                            placeholder="e.g., Jane Doe" 
                        />
                        <Input 
                            icon="⏱️" 
                            type="number" 
                            label="Total Hours" 
                            name="totalHours" 
                            value={totalHours} 
                            onChange={onChange} 
                            placeholder="e.g., 8" 
                        />
                    </div>
                </div>

                {/* Assignment Details */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">🎯</span>
                        Assignment Details
                    </h4>
                    <div className="form-grid">
                        <Select 
                            icon="👨‍💼" 
                            label="Assign to Staff" 
                            name="staffId" 
                            value={staffId} 
                            onChange={onChange} 
                            options={staff} 
                            placeholder="Select a staff member" 
                        />
                        <Select 
                            icon="🏢" 
                            label="Assign to Client" 
                            name="clientId" 
                            value={clientId} 
                            onChange={onChange} 
                            options={clients} 
                            placeholder="Select a client" 
                        />
                    </div>
                </div>

                {/* Schedule */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">🗺️</span>
                        Schedule
                    </h4>
                    <div className="form-grid">
                        <Input 
                            icon="🚀" 
                            type="datetime-local" 
                            label="Scheduled Start Time" 
                            name="scheduledStartTime" 
                            value={scheduledStartTime} 
                            onChange={onChange} 
                        />
                        <Input 
                            icon="🏁" 
                            type="datetime-local" 
                            label="Scheduled End Time" 
                            name="scheduledEndTime" 
                            value={scheduledEndTime} 
                            onChange={onChange} 
                        />
                    </div>
                </div>

                {/* Location Coordinates */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">🌍</span>
                        GPS Coordinates (Optional)
                    </h4>
                    <div className="form-grid">
                        <Input 
                            icon="🗺️" 
                            type="number" 
                            step="any" 
                            label="Latitude" 
                            name="latitude" 
                            value={latitude} 
                            onChange={onChange} 
                            placeholder="e.g., 34.0522" 
                            required={false}
                        />
                        <Input 
                            icon="🗺️" 
                            type="number" 
                            step="any" 
                            label="Longitude" 
                            name="longitude" 
                            value={longitude} 
                            onChange={onChange} 
                            placeholder="e.g., -118.2437" 
                            required={false}
                        />
                    </div>
                </div>
                
                {/* Description */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">📝</span>
                        Task Description
                    </h4>
                    <div className="modern-form-group">
                        <label htmlFor="description" className="modern-form-label">
                            <span className="label-icon">📜</span>
                            Description
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            value={description}
                            onChange={onChange}
                            placeholder="Provide a detailed description of the task requirements and objectives..."
                            required
                            rows="4"
                            className="modern-form-textarea"
                        ></textarea>
                    </div>
                </div>

                {/* File Attachment */}
                <div className="form-section">
                    <h4 className="section-title">
                        <span className="section-icon">📎</span>
                        Attachments
                    </h4>
                    <div className="modern-form-group">
                        <label htmlFor="mapAttachment" className="modern-form-label">
                            <span className="label-icon">🗺️</span>
                            Map or File Attachment
                        </label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                name="mapAttachment"
                                id="mapAttachment"
                                onChange={onFileChange}
                                className="modern-file-input"
                            />
                            <div className="file-upload-help">
                                <span className="help-icon">📎</span>
                                Optional: Attach a map, blueprint, or other relevant file
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="modern-btn cancel-btn"
                        disabled={isSubmitting}
                    >
                        <span className="btn-icon">❌</span>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`modern-btn submit-btn ${isSubmitting ? 'loading' : ''}`}
                    >
                        <span className="btn-icon">
                            {isSubmitting ? '🔄' : '⚙️'}
                        </span>
                        {isSubmitting ? 'Assigning Task...' : 'Assign Task'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssignTaskForm;
