const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Document = require('../models/Document');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get total documents uploaded by staff
    const totalDocuments = await Document.countDocuments();
    
    // Get documents by staff member
    const documentsByStaff = await Document.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $group: {
          _id: '$staff._id',
          staffName: { $first: '$staff.name' },
          staffEmail: { $first: '$staff.email' },
          documentCount: { $sum: 1 },
          documents: {
            $push: {
              id: '$_id',
              title: '$title',
              originalName: '$originalName',
              expiryDate: '$expiryDate',
              uploadedAt: '$createdAt'
            }
          }
        }
      },
      {
        $sort: { documentCount: -1 }
      }
    ]);

    // Get tasks by staff member with hours
    const tasksByStaff = await Task.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $addFields: {
          totalHours: {
            $divide: [
              { $subtract: ['$departureDateTime', '$arrivalDateTime'] },
              3600000 // Convert milliseconds to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: '$staff._id',
          staffName: { $first: '$staff.name' },
          staffEmail: { $first: '$staff.email' },
          taskCount: { $sum: 1 },
          totalHoursWorked: { $sum: '$totalHours' },
          tasks: {
            $push: {
              id: '$_id',
              title: '$title',
              description: '$description',
              location: '$location',
              arrivalDateTime: '$arrivalDateTime',
              departureDateTime: '$departureDateTime',
              status: '$status',
              totalHours: '$totalHours',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $sort: { totalHoursWorked: -1 }
      }
    ]);

    // Get all staff members
    const staffMembers = await User.find({ role: 'staff' })
      .select('name email isActive createdAt')
      .sort({ name: 1 });

    // Get recent activities
    const recentDocuments = await Document.find()
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title originalName uploadedBy createdAt');

    const recentTasks = await Task.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title location createdBy createdAt');

    res.json({
      statistics: {
        totalDocuments,
        totalStaff: staffMembers.length,
        totalTasks: await Task.countDocuments(),
        totalPayments: await Payment.countDocuments()
      },
      documentsByStaff,
      tasksByStaff,
      staffMembers,
      recentActivities: {
        documents: recentDocuments,
        tasks: recentTasks
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new staff member with temporary password (Admin only)
router.post('/staff', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('temporaryPassword').isLength({ min: 6 }).withMessage('Temporary password must be at least 6 characters')
], adminAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, temporaryPassword } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new staff user with temporary password
    const user = new User({
      name,
      email,
      password: temporaryPassword,
      role: 'staff',
      isTemporaryPassword: true,
      temporaryPasswordExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    });

    await user.save();

    res.status(201).json({
      message: 'Staff member created successfully with temporary password',
      staff: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isTemporaryPassword: user.isTemporaryPassword
      },
      temporaryCredentials: {
        email: user.email,
        temporaryPassword: temporaryPassword
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    // Handle specific error types
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      return res.status(500).json({ message: 'Database error during staff creation' });
    } else if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }
    
    res.status(500).json({ message: 'Server error during staff creation: ' + error.message });
  }
});

// Get all staff members
router.get('/staff', adminAuth, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('name email isActive isTemporaryPassword temporaryPasswordExpiry createdAt')
      .sort({ name: 1 });

    res.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get staff member details with their documents and tasks
router.get('/staff/:id', adminAuth, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');
    
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const documents = await Document.find({ uploadedBy: req.params.id })
      .sort({ createdAt: -1 })
      .select('-filePath');

    const tasks = await Task.find({ createdBy: req.params.id })
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ staffMember: req.params.id })
      .populate('uploadedBy', 'name')
      .sort({ paymentDate: -1 })
      .select('-receiptPath');

    // Calculate total hours worked
    const totalHours = tasks.reduce((sum, task) => {
      const hours = (task.departureDateTime - task.arrivalDateTime) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    res.json({
      staff: {
        ...staff.toObject(),
        totalDocuments: documents.length,
        totalTasks: tasks.length,
        totalHours: Math.round(totalHours * 100) / 100,
        totalPayments: payments.length
      },
      documents,
      tasks: tasks.map(task => ({
        ...task.toObject(),
        totalHours: Math.round(((task.departureDateTime - task.arrivalDateTime) / (1000 * 60 * 60)) * 100) / 100
      })),
      payments
    });
  } catch (error) {
    console.error('Get staff details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle staff active status
router.put('/staff/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({
      message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    console.error('Toggle staff status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete staff member (Admin only)
router.delete('/staff/:id', adminAuth, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if staff member has associated data
    const documentCount = await Document.countDocuments({ uploadedBy: req.params.id });
    const taskCount = await Task.countDocuments({ createdBy: req.params.id });
    const paymentCount = await Payment.countDocuments({ staffMember: req.params.id });
    
    // Optional: You can choose to prevent deletion if staff has associated data
    // or allow deletion and handle orphaned data
    if (documentCount > 0 || taskCount > 0 || paymentCount > 0) {
      // For safety, we'll prevent deletion if there's associated data
      return res.status(400).json({ 
        message: `Cannot delete staff member. They have ${documentCount} documents, ${taskCount} tasks, and ${paymentCount} payments associated with their account. Please transfer or remove this data first.`,
        hasAssociatedData: true,
        associatedData: {
          documents: documentCount,
          tasks: taskCount,
          payments: paymentCount
        }
      });
    }

    // Delete the staff member
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Staff member deleted successfully',
      deletedStaff: {
        id: staff._id,
        name: staff.name,
        email: staff.email
      }
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all documents with staff info
router.get('/documents', adminAuth, async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .select('-filePath');

    res.json({ documents });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks with staff info
router.get('/tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const tasksWithHours = tasks.map(task => ({
      ...task.toObject(),
      totalHours: Math.round(((task.departureDateTime - task.arrivalDateTime) / (1000 * 60 * 60)) * 100) / 100
    }));

    res.json({ tasks: tasksWithHours });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
