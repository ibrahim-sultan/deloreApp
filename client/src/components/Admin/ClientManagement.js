
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapPreview from './MapPreview'; // Import the new MapPreview component

// A reusable Input component for the form
const Input = ({ label, name, value, onChange, type = 'text', placeholder, required = true }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

// A modal for confirming deletion
const ConfirmationModal = ({ isOpen, onClose, onConfirm, clientName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Are you sure you want to delete the client "<strong>{clientName}</strong>"? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete Client
                    </button>
                </div>
            </div>
        </div>
    );
};


const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({ name: '', address: '', contactNumber: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [visibleMap, setVisibleMap] = useState(null); // To track which client's map is visible
    
    // State for delete confirmation
    const [clientToDelete, setClientToDelete] = useState(null);

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
            setShowForm(false);
            fetchClients(); // Refresh list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error adding client:', err);
            setError(err.response?.data?.msg || 'Failed to add client.');
        }
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;
        try {
            await axios.delete(`/api/clients/${clientToDelete._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess(`Client "${clientToDelete.name}" deleted successfully.`);
            setClientToDelete(null);
            fetchClients();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(err.response?.data?.msg || 'Failed to delete client.');
            setClientToDelete(null);
        }
    };
    
    const toggleMap = (clientId) => {
        if (visibleMap === clientId) {
            setVisibleMap(null); // Hide map if it's already visible
        } else {
            setVisibleMap(clientId); // Show map for the selected client
        }
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
            <ConfirmationModal
                isOpen={!!clientToDelete}
                onClose={() => setClientToDelete(null)}
                onConfirm={confirmDelete}
                clientName={clientToDelete?.name}
            />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Client Management</h2>
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
                >
                  {showForm ? 'Cancel' : 'Add New Client'}
                </button>
            </div>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg my-4" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg my-4" role="alert">{success}</div>}

            {showForm && (
                <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Add a New Client</h3>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Client Name" name="name" value={formData.name} onChange={onChange} placeholder="e.g., Acme Corporation" />
                            <Input label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={onChange} placeholder="e.g., (555) 123-4567" />
                        </div>
                        <div>
                            <Input label="Address" name="address" value={formData.address} onChange={onChange} placeholder="e.g., 123 Innovation Drive, Tech City" />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Save Client
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <h3 className="text-xl font-semibold text-gray-800 p-6">Existing Clients</h3>
                {loading ? (
                    <p className="p-6">Loading clients...</p>
                ) : clients.length === 0 ? (
                    <p className="p-6 text-gray-500">No clients found. Add one to get started!</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {clients.map(client => (
                            <li key={client._id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg text-gray-900">{client.name}</p>
                                        <p className="text-gray-600">{client.address}</p>
                                        <p className="text-sm text-gray-500 mt-1">{client.contactNumber}</p>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 space-x-4">
                                        <button onClick={() => toggleMap(client._id)} className="text-blue-600 hover:text-blue-800 font-medium">
                                            {visibleMap === client._id ? 'Hide Map' : 'Show Map'}
                                        </button>
                                        <button onClick={() => handleDeleteClick(client)} className="text-red-600 hover:text-red-800 font-medium">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                {visibleMap === client._id && (
                                    <MapPreview address={client.address} />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ClientManagement;
