
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Client = require('../models/Client');

// @route   POST api/clients
// @desc    Add a new client
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    const { name, address, contactNumber, email, contactPerson, businessType, notes, coordinates } = req.body;

    try {
        let client = await Client.findOne({ name });
        if (client) {
            return res.status(400).json({ msg: 'Client with that name already exists.' });
        }

        client = new Client({
            name,
            email,
            address,
            contactNumber,
            contactPerson,
            businessType,
            notes,
            coordinates,
            addedBy: req.user.id
        });

        await client.save();
        res.status(201).json(client);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/clients
// @desc    Get all clients
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        const clients = await Client.find().sort({ name: 1 });
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/clients/:id
// @desc    Update a client
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        const { name, address, contactNumber, email, contactPerson, businessType, notes, coordinates } = req.body;

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found.' });
        }

        if (typeof name !== 'undefined') client.name = name;
        if (typeof email !== 'undefined') client.email = email;
        if (typeof address !== 'undefined') client.address = address;
        if (typeof contactNumber !== 'undefined') client.contactNumber = contactNumber;
        if (typeof contactPerson !== 'undefined') client.contactPerson = contactPerson;
        if (typeof businessType !== 'undefined') client.businessType = businessType;
        if (typeof notes !== 'undefined') client.notes = notes;

        if (coordinates && typeof coordinates === 'object') {
            if (!client.coordinates) client.coordinates = {};
            if (typeof coordinates.latitude !== 'undefined') client.coordinates.latitude = coordinates.latitude;
            if (typeof coordinates.longitude !== 'undefined') client.coordinates.longitude = coordinates.longitude;
        }

        const updated = await client.save();
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/clients/:id
// @desc    Delete a client
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found.' });
        }

        await Client.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Client removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
