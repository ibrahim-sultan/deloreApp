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
        notes: '',
        latitude: '',
        longitude: ''
    });
    const [geocoding, setGeocoding] = useState(false);

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
            notes: '',
            latitude: '',
            longitude: ''
        });
        setError('');
        setSuccess('');
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
            notes: client.notes || '',
            latitude: client.coordinates?.latitude || '',
            longitude: client.coordinates?.longitude || ''
        });
        setError('');
        setSuccess('');
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
            notes: '',
            latitude: '',
            longitude: ''
        });
        setError('');
    };

    const getCoordinatesFromAddress = async () => {
        if (!formData.address) {
            setError('Please enter an address first');
            setSuccess('');
            return;
        }
        
        setGeocoding(true);
        setError('');
        setSuccess('');
        
        const fetchWithTimeout = async (url, opts = {}, timeoutMs = 10000) => {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            try {
                return await fetch(url, { ...opts, signal: ctrl.signal });
            } finally {
                clearTimeout(timer);
            }
        };

        const buildUrls = (rawAddress) => {
            const addr = String(rawAddress || '').trim();
            const base = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&dedupe=1&q=${encodeURIComponent(addr)}`;
            const countries = [
                { code: 'ng', name: 'Nigeria' },
                { code: 'ca', name: 'Canada' },
            ];
            const urls = [base];
            for (const { code, name } of countries) {
                const hasName = new RegExp(`\\b${name}\\b`, 'i').test(addr);
                const biasedAddr = hasName ? addr : `${addr}, ${name}`;
                urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&dedupe=1&countrycodes=${code}&q=${encodeURIComponent(biasedAddr)}`);
            }
            return urls;
        };

        const geocodeUrl = async (url) => {
            const res = await fetchWithTimeout(url, {}, 10000);
            if (!res.ok) {
                const err = new Error(`Geocoding failed with status ${res.status}`);
                err.status = res.status;
                throw err;
            }
            return res.json();
        };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        try {
            let data = [];
            const urls = buildUrls(formData.address);
            for (const url of urls) {
                let attemptResult = null;
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        attemptResult = await geocodeUrl(url);
                        break;
                    } catch (e) {
                        const status = e?.status;
                        const isRetryable = status === 429 || status === 503 || e.name === 'AbortError' || e.message?.includes('NetworkError');
                        if (attempt === 0 && isRetryable) {
                            await sleep(1200);
                            continue;
                        }
                        throw e;
                    }
                }
                if (Array.isArray(attemptResult) && attemptResult.length > 0) {
                    data = attemptResult;
                    break;
                }
            }
            
            if (Array.isArray(data) && data.length > 0) {
                setFormData({
                    ...formData,
                    latitude: data[0].lat,
                    longitude: data[0].lon
                });
                setError('');
                setSuccess('Coordinates found successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setSuccess('');
                setError('Could not find coordinates for this address. Please enter them manually.');
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            let msg = 'Failed to get coordinates. Please enter them manually.';
            if (err?.status === 429) msg = 'Too many requests to geocoding service. Please wait a minute and try again.';
            else if (err?.status === 503) msg = 'Geocoding service is temporarily unavailable. Try again shortly.';
            else if (err?.name === 'AbortError') msg = 'Request timed out. Check your internet connection and try again.';
            setSuccess('');
            setError(msg);
        } finally {
            setGeocoding(false);
        }
    };

    const handleSubmitClient = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const dataToSend = {
                ...formData,
                coordinates: formData.latitude && formData.longitude ? {
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude)
                } : undefined
            };
            
            delete dataToSend.latitude;
            delete dataToSend.longitude;
            
            if (editingClient) {
                await axios.put(`/api/clients/${editingClient._id}`, dataToSend, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccess('Client updated successfully!');
            } else {
                await axios.post('/api/clients', dataToSend, {
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

            {!showAddModal && error && (
                <div className="alert alert-error">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')} className="alert-close">×</button>
                </div>
            )}
            {!showAddModal && success && (
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
                                <label htmlFor="latitude">Latitude</label>
                                <input
                                    type="number"
                                    id="latitude"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    placeholder="e.g., 6.5244"
                                    step="any"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="longitude">Longitude</label>
                                <input
                                    type="number"
                                    id="longitude"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    placeholder="e.g., 3.3792"
                                    step="any"
                                />
                            </div>

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <button 
                                    type="button" 
                                    className="btn-geocode"
                                    onClick={getCoordinatesFromAddress}
                                    disabled={geocoding || !formData.address}
                                    style={{ 
                                        width: '100%',
                                        padding: '12px',
                                        background: geocoding ? '#6c757d' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: geocoding || !formData.address ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {geocoding ? '🔄 Getting Coordinates...' : '🗺️ Get Coordinates from Address'}
                                </button>
                                <small style={{ display: 'block', marginTop: '8px', color: '#6c757d', fontSize: '12px' }}>
                                    💡 Click this button to automatically find coordinates, or enter them manually
                                </small>
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
