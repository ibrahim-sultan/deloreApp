
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignTaskForm.css';
import MapPreview from './MapPreview';

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

    // Debug useEffect to log staff and clients data
    useEffect(() => {
        console.log('📊 AssignTaskForm Data Debug:');
        console.log('👥 Staff array:', staff);
        console.log('🏢 Clients array:', clients);
        console.log('📋 Staff count:', staff?.length || 0);
        console.log('🏪 Clients count:', clients?.length || 0);
        
        if (staff && staff.length > 0) {
            console.log('✅ Staff data available:', staff.map(s => ({ id: s._id, name: s.name })));
        } else {
            console.log('❌ No staff data available');
        }
        
        if (clients && clients.length > 0) {
            console.log('✅ Clients data available:', clients.map(c => ({ id: c._id, name: c.name })));
        } else {
            console.log('❌ No clients data available');
        }
    }, [staff, clients]);

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
            
            {/* Available Staff and Clients Overview */}
            <div className="data-overview-section">
                <div className="overview-grid">
                    <div className="overview-card staff-overview">
                        <div className="overview-header">
                            <h4 className="overview-title">
                                <span className="overview-icon">👥</span>
                                Available Staff ({staff?.length || 0})
                            </h4>
                        </div>
                        <div className="overview-content">
                            {staff && staff.length > 0 ? (
                                <div className="staff-list">
                                    {staff.slice(0, 5).map(s => (
                                        <div key={s._id} className="staff-item">
                                            <span className="staff-avatar">👤</span>
                                            <span className="staff-name">{s.name}</span>
                                            <span className="staff-email">{s.email}</span>
                                        </div>
                                    ))}
                                    {staff.length > 5 && (
                                        <div className="more-items">+{staff.length - 5} more...</div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-data">
                                    <span className="no-data-icon">📭</span>
                                    <span className="no-data-text">No staff members available</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="overview-card clients-overview">
                        <div className="overview-header">
                            <h4 className="overview-title">
                                <span className="overview-icon">🏢</span>
                                Available Clients ({clients?.length || 0})
                            </h4>
                        </div>
                        <div className="overview-content">
                            {clients && clients.length > 0 ? (
                                <div className="clients-list">
                                    {clients.slice(0, 5).map(c => (
                                        <div key={c._id} className="client-item">
                                            <span className="client-avatar">🏢</span>
                                            <span className="client-name">{c.name}</span>
                                            <span className="client-email">{c.email}</span>
                                        </div>
                                    ))}
                                    {clients.length > 5 && (
                                        <div className="more-items">+{clients.length - 5} more...</div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-data">
                                    <span className="no-data-icon">📭</span>
                                    <span className="no-data-text">No clients available</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
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
                        {location && (
                          <div style={{ marginTop: '8px' }}>
                            <MapPreview address={location} />
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="modern-btn"
                              style={{ marginTop: '8px' }}
                            >
                              Open in Google Maps
                            </a>
                          </div>
                        )}
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
                <div className="form-section assignment-section">
                    <h4 className="section-title">
                        <span className="section-icon">🎯</span>
                        Assignment Details
                        <span className="assignment-counts">
                            ({staff?.length || 0} Staff, {clients?.length || 0} Clients)
                        </span>
                    </h4>
                    
                    {/* Debug Information */}
                    {(!staff || staff.length === 0) && (
                        <div className="data-warning">
                            <span className="warning-icon">⚠️</span>
                            No staff members available. Please add staff first.
                        </div>
                    )}
                    {(!clients || clients.length === 0) && (
                        <div className="data-warning">
                            <span className="warning-icon">⚠️</span>
                            No clients available. Please add clients first.
                        </div>
                    )}
                    
                    <div className="form-grid">
                        <div className="enhanced-select-wrapper">
                            <Select 
                                icon="👨‍💼" 
                                label="Assign to Staff Member" 
                                name="staffId" 
                                value={staffId} 
                                onChange={onChange} 
                                options={staff || []} 
                                placeholder={staff && staff.length > 0 ? "Choose staff member to assign task" : "No staff available"} 
                            />
                            <div className="selection-help">
                                <span className="help-icon">📝</span>
                                Select which staff member will handle this task
                            </div>
                        </div>
                        
                        <div className="enhanced-select-wrapper">
                            <Select 
                                icon="🏢" 
                                label="Client to Visit" 
                                name="clientId" 
                                value={clientId} 
                                onChange={onChange} 
                                options={clients || []} 
                                placeholder={clients && clients.length > 0 ? "Choose client for this task" : "No clients available"} 
                            />
                            <div className="selection-help">
                                <span className="help-icon">📝</span>
                                Select which client the staff will meet/work with
                            </div>
                        </div>
                    </div>
                    
                    {/* Show selected information */}
                    {(staffId || clientId) && (
                        <div className="selection-summary">
                            <h5 className="summary-title">
                                <span className="summary-icon">✅</span>
                                Assignment Summary
                            </h5>
                            <div className="summary-grid">
                                {staffId && (
                                    <div className="summary-item">
                                        <span className="summary-label">Staff:</span>
                                        <span className="summary-value">
                                            {staff?.find(s => s._id === staffId)?.name || 'Unknown Staff'}
                                        </span>
                                    </div>
                                )}
                                {clientId && (
                                    <div className="summary-item">
                                        <span className="summary-label">Client:</span>
                                        <span className="summary-value">
                                            {clients?.find(c => c._id === clientId)?.name || 'Unknown Client'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                        GPS Coordinates (Required)
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
                            required={true}
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
                            required={true}
                        />
                        <div>
                          <button type="button" className="modern-btn" onClick={async () => {
                            try {
                              if (!location) { alert('Enter location address first'); return; }
                              const res = await axios.get('/api/admin/geocode', {
                                params: { address: location },
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                              });
                              setFormData(prev => ({ ...prev, latitude: res.data.latitude, longitude: res.data.longitude }));
                            } catch (e) {
                              alert(e.response?.data?.message || 'Failed to geocode address');
                            }
                          }}>
                            Auto-fill from address
                          </button>
                        </div>
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
