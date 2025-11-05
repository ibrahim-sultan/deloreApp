const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

const router = express.Router();

// Note: Public registration has been removed. Only admins can create staff accounts.

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Role:', user.role, 'Active:', user.isActive);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password match successful for user:', email);

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is deactivated:', email);
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error types
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      // Database connection or operation error
      return res.status(500).json({ message: 'Database error during login. Please check if MongoDB is running.' });
    } else if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      // MongoDB connection timeout error
      return res.status(500).json({ message: 'Database connection timeout. Please try again in a few moments.' });
    }
    
    // Generic server error
    res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isTemporaryPassword: req.user.isTemporaryPassword
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    // Handle specific error types
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      // Database connection or operation error
      return res.status(500).json({ message: 'Database error while fetching user. Please check if MongoDB is running.' });
    } else if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      // MongoDB connection timeout error
      return res.status(500).json({ message: 'Database connection timeout. Please try again in a few moments.' });
    }
    
    // Generic server error
    res.status(500).json({ message: 'Server error while fetching user: ' + error.message });
  }
});

// Change password (for staff with temporary passwords)
router.post('/change-password', [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Fetch the user with password field (auth middleware excludes password)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password and remove temporary password flags
    user.password = newPassword;
    user.isTemporaryPassword = false;
    user.temporaryPasswordExpiry = null;
    
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password: ' + error.message });
  }
});

// Forgot password - request reset link
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const baseUrl = process.env.CLIENT_BASE_URL || process.env.APP_BASE_URL || '';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    try {
      const transporter = getTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '[Delore] Password Reset Request',
          html: `<p>Hello ${user.name || ''},</p>
                 <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
                 <p><a href="${resetUrl}">Reset your password</a></p>
                 <p>If you did not request this, please ignore this email.</p>`
        });
      }
    } catch (mailErr) {
      console.warn('Password reset email failed:', mailErr.message);
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error while requesting password reset' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').isString().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.isTemporaryPassword = false;
    user.temporaryPasswordExpiry = null;

    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

// Debug route to check users in database
router.get('/debug-users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role isActive');
    res.json({
      message: 'Users in database',
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Create initial admin user (for first-time setup only)
router.post('/create-admin', async (req, res) => {
  try {
    // Check if any admin users already exist
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    // Create the admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@delore.com',
      password: 'delore@123',
      role: 'admin',
      isActive: true
    });
    
    await adminUser.save();
    console.log('Admin user created:', adminUser.email);
    
    res.json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@delore.com',
        password: 'delore@123'
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Failed to create admin user', error: error.message });
  }
});

module.exports = router;
