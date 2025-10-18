
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientManagement.css';

const ClientManagement = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    // Refresh data when component becomes visible (for when returning from add/edit client page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchClients();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
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

    const handleAddClient = () => {
        navigate('/admin/add-client');
    };

    const handleEditClient = (client) => {
        navigate('/admin/add-client', { state: { client } });
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
                            onClick={handleAddClient}
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
                            onClick={handleAddClient}
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
                                        onClick={() => handleEditClient(client)}
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
