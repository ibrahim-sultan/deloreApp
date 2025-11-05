const express = require('express');
const { body, validationResult } = require('express-validator');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Create leave request (Staff)
router.post('/', auth, [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, reason } = req.body;

    // Check if end date is after start date
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leaveRequest = new LeaveRequest({
      staffMember: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await leaveRequest.save();
    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: await LeaveRequest.findById(leaveRequest._id).populate('staffMember', 'name email')
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my leave requests (Staff)
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ staffMember: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all leave requests (Admin)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .populate('staffMember', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leave request by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id)
      .populate('staffMember', 'name email')
      .populate('reviewedBy', 'name');
    
    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has access
    if (!req.user.isAdmin && request.staffMember._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update leave request status (Admin only)
router.put('/:id/status', adminAuth, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, comments } = req.body;
    const request = await LeaveRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (comments) {
      request.reviewComments = comments;
    }

    await request.save();

    res.json({
      message: `Leave request ${status} successfully`,
      request: await LeaveRequest.findById(request._id)
        .populate('staffMember', 'name email')
        .populate('reviewedBy', 'name')
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete leave request (only pending requests)
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has access
    if (!req.user.isAdmin && request.staffMember.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete reviewed leave requests' });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

