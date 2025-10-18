
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactNumber: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await axios.get('/api/clients', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setClients(res.data);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Failed to fetch clients.');
        }
    };

    const { name, address, contactNumber } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await axios.post('/api/clients', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setSuccess('Client added successfully!');
            setFormData({
                name: '',
                address: '',
                contactNumber: ''
            });
            fetchClients(); // Refresh the client list
        } catch (err) {
            console.error('Error adding client:', err);
            setError(err.response?.data?.msg || 'Failed to add client.');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Client Management</h2>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">Add New Client</h3>
                    <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Client Name</label>
                            <input type="text" name="name" value={name} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="address" className="block text-gray-700 font-bold mb-2">Address</label>
                            <input type="text" name="address" value={address} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="contactNumber" className="block text-gray-700 font-bold mb-2">Contact Number</label>
                            <input type="text" name="contactNumber" value={contactNumber} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Client</button>
                    </form>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4">Existing Clients</h3>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {clients.length > 0 ? (
                            <ul>
                                {clients.map(client => (
                                    <li key={client._id} className="border-b py-2">
                                        <p className="font-bold">{client.name}</p>
                                        <p className="text-gray-600">{client.address}</p>
                                        <p className="text-gray-600">{client.contactNumber}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No clients found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientManagement;
