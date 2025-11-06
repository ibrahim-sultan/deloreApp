const express = require('express');
const { body, validationResult } = require('express-validator');
const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Submit daily report (Staff)
router.post('/submit', auth, [
  body('content').trim().isLength({ min: 10 }).withMessage('Report content must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, taskId, taskTitle } = req.body;

    const report = new DailyReport({
      staffMember: req.user._id,
      content,
      date: new Date(),
      task: taskId || undefined,
      taskTitle: taskTitle || undefined
    });

    await report.save();
    res.status(201).json({
      message: 'Daily report submitted successfully',
      report: await DailyReport.findById(report._id).populate('staffMember', 'name email')
    });
  } catch (error) {
    console.error('Error submitting daily report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my daily reports (Staff)
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await DailyReport.find({ staffMember: req.user._id })
      .sort({ date: -1 })
      .lean();
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all daily reports (Admin)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { staffId, date } = req.query;
    const query = {};
    if (staffId) query.staffMember = staffId;
    if (date) {
      // match same calendar day
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setHours(23,59,59,999);
      query.date = { $gte: start, $lte: end };
    }

    const reports = await DailyReport.find(query)
      .populate('staffMember', 'name email')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching all daily reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reports by staff member (Admin)
router.get('/staff/:staffId', adminAuth, async (req, res) => {
  try {
    const reports = await DailyReport.find({ staffMember: req.params.staffId })
      .populate('task', 'title')
      .sort({ date: -1 })
      .lean();
    
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching staff reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily report by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate('staffMember', 'name email')
      .populate('task', 'title');
    
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    // Check if user has access
    if (!req.user.isAdmin && report.staffMember._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

