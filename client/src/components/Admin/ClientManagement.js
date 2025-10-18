
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientManagement.css';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({ name: '', address: '', contactNumber: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/clients', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setClients(res.data);
            setError('');
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Failed to fetch clients.');
        } finally {
            setLoading(false);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingClient) {
                await axios.put(`/api/clients/${editingClient._id}`, formData, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccess('Client updated successfully!');
                setEditingClient(null);
            } else {
                await axios.post('/api/clients', formData, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccess('Client added successfully!');
            }
            setFormData({ name: '', address: '', contactNumber: '' });
            setShowForm(false);
            fetchClients();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Error saving client:', err);
            setError(err.response?.data?.msg || 'Failed to save client.');
        }
    };

    const editClient = (client) => {
        setEditingClient(client);
        setFormData({ name: client.name, address: client.address, contactNumber: client.contactNumber });
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const cancelEdit = () => {
        setEditingClient(null);
        setFormData({ name: '', address: '', contactNumber: '' });
        setShowForm(false);
        setError('');
        setSuccess('');
    };

    const deleteClient = async (id) => {
        try {
            await axios.delete(`/api/clients/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess('Client deleted successfully!');
            fetchClients();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(err.response?.data?.msg || 'Failed to delete client.');
        }
    };

    return (
        <div className="client-management-container">
            {/* Header Section */}
            <div className="client-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1 className="page-title">
                            <span className="title-icon">🏢</span>
                            Client Management
                        </h1>
                        <p className="page-subtitle">
                            Manage your clients and their information efficiently
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="client-stats">
                            <div className="stat-item">
                                <span className="stat-number">{clients.length}</span>
                                <span className="stat-label">Total Clients</span>
                            </div>
                        </div>
                        <button 
                            className="add-client-btn"
                            onClick={() => {
                                setShowForm(true);
                                setEditingClient(null);
                                setFormData({ name: '', address: '', contactNumber: '' });
                                setError('');
                                setSuccess('');
                            }}
                        >
                            <span className="btn-icon">+</span>
                            Add New Client
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    {error}
                    <button className="alert-close" onClick={() => setError('')}>×</button>
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    <span className="alert-icon">✅</span>
                    {success}
                    <button className="alert-close" onClick={() => setSuccess('')}>×</button>
                </div>
            )}

            {/* Add/Edit Client Form Modal */}
            {showForm && (
                <div className="form-modal-overlay" onClick={() => !editingClient ? cancelEdit() : null}>
                    <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="form-modal-header">
                            <h2 className="modal-title">
                                <span className="modal-icon">
                                    {editingClient ? '✏️' : '🏢'}
                                </span>
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h2>
                            <button className="modal-close-btn" onClick={cancelEdit}>×</button>
                        </div>
                        
                        <form onSubmit={onSubmit} className="client-form">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🏷️</span>
                                    Client Name
                                </label>
                                <input 
                                    className="form-input"
                                    type="text" 
                                    name="name" 
                                    value={formData.name}
                                    onChange={onChange}
                                    placeholder="Enter client name (e.g., Acme Corporation)"
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📞</span>
                                    Contact Number
                                </label>
                                <input 
                                    className="form-input"
                                    type="tel" 
                                    name="contactNumber" 
                                    value={formData.contactNumber}
                                    onChange={onChange}
                                    placeholder="Enter contact number (e.g., +234 812 345 6789)"
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📍</span>
                                    Address
                                </label>
                                <textarea 
                                    className="form-textarea"
                                    name="address" 
                                    value={formData.address}
                                    onChange={onChange}
                                    placeholder="Enter client address (e.g., 123 Innovation Drive, Tech City)"
                                    rows="3"
                                    required 
                                />
                                <div className="form-help">
                                    <span className="help-icon">🗺️</span>
                                    Address will be verified via Google Maps
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                                    <span className="btn-icon">❌</span>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    <span className="btn-icon">
                                        {editingClient ? '✅' : '💾'}
                                    </span>
                                    {editingClient ? 'Update Client' : 'Save Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Clients Grid */}
            <div className="clients-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <span className="section-icon">📈</span>
                        Client Directory
                    </h2>
                    <div className="section-info">
                        {loading ? (
                            <span className="loading-text">🔄 Loading...</span>
                        ) : (
                            <span className="clients-count">{clients.length} clients found</span>
                        )}
                    </div>
                </div>
                
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading clients...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏢</div>
                        <h3 className="empty-title">No Clients Yet</h3>
                        <p className="empty-text">Start by adding your first client to get organized!</p>
                        <button 
                            className="empty-action-btn"
                            onClick={() => {
                                setShowForm(true);
                                setEditingClient(null);
                                setFormData({ name: '', address: '', contactNumber: '' });
                            }}
                        >
                            <span className="btn-icon">+</span>
                            Add First Client
                        </button>
                    </div>
                ) : (
                    <div className="clients-grid">
                        {clients.map(client => (
                            <div key={client._id} className="client-card">
                                <div className="card-header">
                                    <div className="client-avatar">
                                        <span className="avatar-text">
                                            {client.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="client-info">
                                        <h3 className="client-name">{client.name}</h3>
                                        <div className="client-status">
                                            <span className="status-dot active"></span>
                                            <span className="status-text">Active</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-details">
                                    <div className="detail-item">
                                        <span className="detail-icon">📞</span>
                                        <div className="detail-content">
                                            <span className="detail-label">Contact</span>
                                            <span className="detail-value">{client.contactNumber}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-item">
                                        <span className="detail-icon">📍</span>
                                        <div className="detail-content">
                                            <span className="detail-label">Address</span>
                                            <span className="detail-value">{client.address}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-actions">
                                    <button 
                                        className="action-btn view-btn"
                                        title="View on Map"
                                    >
                                        <span className="btn-icon">🗺️</span>
                                        Map
                                    </button>
                                    <button 
                                        className="action-btn edit-btn"
                                        onClick={() => editClient(client)}
                                        title="Edit Client"
                                    >
                                        <span className="btn-icon">✏️</span>
                                        Edit
                                    </button>
                                    <button 
                                        className="action-btn delete-btn"
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                                                deleteClient(client._id);
                                            }
                                        }}
                                        title="Delete Client"
                                    >
                                        <span className="btn-icon">🗑️</span>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientManagement;
