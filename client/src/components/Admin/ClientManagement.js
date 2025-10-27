import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientManagement.css';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        contactPerson: '',
        businessType: '',
        notes: ''
    });

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

    const handleAddClient = () => {
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            address: '',
            contactNumber: '',
            contactPerson: '',
            businessType: '',
            notes: ''
        });
        setShowAddModal(true);
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            address: client.address || '',
            contactNumber: client.contactNumber || '',
            contactPerson: client.contactPerson || '',
            businessType: client.businessType || '',
            notes: client.notes || ''
        });
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            address: '',
            contactNumber: '',
            contactPerson: '',
            businessType: '',
            notes: ''
        });
        setError('');
    };

    const handleSubmitClient = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingClient) {
                await axios.put(`/api/clients/${editingClient._id}`, formData, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccess('Client updated successfully!');
            } else {
                await axios.post('/api/clients', formData, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccess('Client added successfully!');
            }

            setTimeout(() => {
                handleCloseModal();
                fetchClients();
                setSuccess('');
            }, 1500);
        } catch (err) {
            console.error('Error saving client:', err);
            setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to save client.');
        }
    };

    const deleteClient = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
            return;
        }
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

    const filteredClients = clients.filter(client => 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="manage-clients-container">
            <div className="clients-header">
                <h1 className="page-title">Manage Clients</h1>
                
                <div className="clients-header-actions">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="add-client-btn" onClick={handleAddClient}>
                        <span className="btn-icon">+</span>
                        Add Client
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')} className="alert-close">×</button>
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    <span>✅</span> {success}
                    <button onClick={() => setSuccess('')} className="alert-close">×</button>
                </div>
            )}

            {loading ? (
                <div className="loading-state">Loading clients...</div>
            ) : (
                <div className="clients-table-container">
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="empty-state-cell">
                                        <div className="empty-message">
                                            <span className="empty-icon">📭</span>
                                            <p>No clients found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map(client => (
                                    <tr key={client._id}>
                                        <td className="client-name-cell">{client.name}</td>
                                        <td>{client.email || '-'}</td>
                                        <td className="address-cell">{client.address || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEditClient(client)}
                                                    title="Edit"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => deleteClient(client._id, client.name)}
                                                    title="Delete"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Client Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content client-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                            <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ margin: '0 24px 16px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmitClient} className="client-form">
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Client name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="client@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactNumber">Contact</label>
                                <input
                                    type="tel"
                                    id="contactNumber"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="+1234567890"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows="3"
                                    placeholder="Start typing for suggestions..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactPerson">Contact Person</label>
                                <input
                                    type="text"
                                    id="contactPerson"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="Contact person name"
                                />
                            </div>

                            <div className="form-actions-modal">
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    {editingClient ? 'Update' : 'Save'} Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
