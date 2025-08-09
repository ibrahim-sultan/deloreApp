const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for payment receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed for payment receipts'));
    }
  }
});

// Upload payment receipt (Admin only)
router.post('/upload', adminAuth, upload.single('receipt'), [
  body('staffMemberId').isMongoId().withMessage('Valid staff member ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Payment receipt file is required' });
    }

    const { staffMemberId, amount, paymentDate, description } = req.body;

    // Verify staff member exists
    const staffMember = await User.findById(staffMemberId);
    if (!staffMember || staffMember.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const payment = new Payment({
      staffMember: staffMemberId,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      description: description || '',
      receiptFilename: req.file.filename,
      receiptPath: req.file.path,
      uploadedBy: req.user._id
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment receipt uploaded successfully',
      payment: {
        id: payment._id,
        staffMember: staffMember.name,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        description: payment.description,
        status: payment.status,
        uploadedAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Payment upload error:', error);
    res.status(500).json({ message: 'Server error during payment upload' });
  }
});

// Get payments for current user (Staff)
router.get('/my-payments', auth, async (req, res) => {
  try {
    console.log('Fetching payments for user:', req.user._id, 'with role:', req.user.role);
    
    if (req.user.role !== 'staff') {
      console.log('Access denied - User is not staff');
      return res.status(403).json({ message: 'Access denied. Staff only.' });
    }

    const payments = await Payment.find({ staffMember: req.user._id })
      .populate('uploadedBy', 'name')
      .sort({ paymentDate: -1 })
      .select('-receiptPath');
    
    console.log('Found', payments.length, 'payments for user', req.user._id);

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error while fetching payments' });
    }
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// Get all payments (Admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('staffMember', 'name email')
      .populate('uploadedBy', 'name')
      .sort({ paymentDate: -1 })
      .select('-receiptPath');

    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download payment receipt
router.get('/:id/download', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is the staff member or admin
    if (payment.staffMember.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(payment.receiptPath)) {
      return res.status(404).json({ message: 'Receipt file not found on server' });
    }

    res.download(payment.receiptPath, payment.receiptFilename);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status (Admin only)
router.put('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'processed', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = req.body.status;
    await payment.save();

    res.json({
      message: 'Payment status updated successfully',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
