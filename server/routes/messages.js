const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Send message (Admin to Staff)
router.post('/send', adminAuth, [
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, subject, content } = req.body;

    // Verify recipient exists and is staff
    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      subject,
      content
    });

    await message.save();

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: {
        id: message._id,
        recipient: recipient.name,
        subject: message.subject,
        content: message.content,
        sentAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error during message sending' });
  }
});

// Get messages for current user
router.get('/inbox', auth, async (req, res) => {
  try {
    console.log('Fetching messages for user:', req.user._id, 'with role:', req.user.role);
    
    let messages;
    
    if (req.user.role === 'staff') {
      // Staff can only see messages sent to them
      messages = await Message.find({ recipient: req.user._id })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 });
      console.log('Found', messages.length, 'messages for staff user', req.user._id);
    } else {
      // Admin can see all messages they sent
      messages = await Message.find({ sender: req.user._id })
        .populate('recipient', 'name email')
        .sort({ createdAt: -1 });
      console.log('Found', messages.length, 'sent messages for admin user', req.user._id);
    }

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error while fetching messages' });
    }
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// Get message by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('recipient', 'name email');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender._id.toString() !== req.user._id.toString() && 
        message.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if user is recipient
    if (message.recipient._id.toString() === req.user._id.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({ message });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    console.log('Fetching unread message count for user:', req.user._id, 'with role:', req.user.role);
    
    if (req.user.role !== 'staff') {
      console.log('User is not staff, returning 0 unread messages');
      return res.json({ count: 0 });
    }

    const count = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false
    });
    
    console.log('Found', count, 'unread messages for user', req.user._id);

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error while fetching unread message count' });
    }
    res.status(500).json({ message: 'Server error while fetching unread message count' });
  }
});

module.exports = router;
