
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

    const { name, address, contactNumber } = req.body;

    try {
        // Check if client already exists
        let client = await Client.findOne({ name });
        if (client) {
            return res.status(400).json({ msg: 'Client with that name already exists.' });
        }

        client = new Client({
            name,
            address,
            contactNumber,
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

module.exports = router;
