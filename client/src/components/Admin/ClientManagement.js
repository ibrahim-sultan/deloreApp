
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({ name: '', address: '', contactNumber: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

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
            await axios.post('/api/clients', formData, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess('Client added successfully!');
            setFormData({ name: '', address: '', contactNumber: '' });
            fetchClients();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error adding client:', err);
            setError(err.response?.data?.msg || 'Failed to add client.');
        }
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
        <div className="container mx-auto p-4" style={{ maxWidth: '400px' }}>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
            
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#4a00e0' }}>Add a New Client</h2>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Client Name</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="e.g. Acme Corporation" name="name" value={formData.name} onChange={onChange} required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactNumber">Contact Number</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="contactNumber" type="text" placeholder="e.g. +234 812 345 6789" name="contactNumber" value={formData.contactNumber} onChange={onChange} required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">Address</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="address" type="text" placeholder="e.g. 123 Innovation Drive" name="address" value={formData.address} onChange={onChange} required />
                        <p className="text-xs text-gray-500 mt-1">Address will be verified via Google Maps</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <button className="text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline" style={{ backgroundColor: '#6a11cb' }} type="submit">
                            Save Client
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Existing Clients</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : clients.length === 0 ? (
                    <p>No clients found.</p>
                ) : (
                    clients.map(client => (
                        <div key={client._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-lg">{client.name}</h3>
                            <p className="text-gray-600">{client.address}</p>
                            <p className="text-gray-600">{client.contactNumber}</p>
                            <div className="flex justify-between mt-4">
                                <button className="text-white font-bold py-2 px-4 rounded" style={{ backgroundColor: '#6a11cb' }}>
                                    Show Map
                                </button>
                                <button onClick={() => deleteClient(client._id)} className="text-white font-bold py-2 px-4 rounded" style={{ backgroundColor: '#d9534f' }}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClientManagement;
