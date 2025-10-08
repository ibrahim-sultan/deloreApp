const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Document = require('../models/Document');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const { adminAuth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

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
      return sum + (task.totalHours || 0);
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
        ...task.toObject()
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

// Get expired documents count (test endpoint)
router.get('/documents/expired/count', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const expiredCount = await Document.countDocuments({
      expiryDate: { $lt: now }
    });
    
    const expiredDocuments = await Document.find({
      expiryDate: { $lt: now }
    }).populate('uploadedBy', 'name email').select('title expiryDate');
    
    console.log(`Found ${expiredCount} expired documents`);
    expiredDocuments.forEach(doc => {
      console.log(`- ${doc.title} (expired: ${doc.expiryDate})`);
    });
    
    res.json({ 
      expiredCount, 
      currentTime: now,
      expiredDocuments: expiredDocuments.map(doc => ({
        id: doc._id,
        title: doc.title,
        expiryDate: doc.expiryDate,
        uploadedBy: doc.uploadedBy?.name || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Get expired documents count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all documents with staff info
router.get('/documents', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all documents for admin...');
    
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .select('-filePath');

    console.log(`Found ${documents.length} documents`);
    
    // Filter out documents without valid uploadedBy reference and log them
    const validDocuments = documents.filter(doc => {
      if (!doc.uploadedBy) {
        console.warn(`Document ${doc._id} has no uploadedBy reference`);
        return false;
      }
      return true;
    });
    
    console.log(`${validDocuments.length} documents have valid uploadedBy references`);

    res.json({ documents: validDocuments });
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

    res.json({ tasks });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin download document
router.get('/documents/:id/download', adminAuth, async (req, res) => {
  const fs = require('fs');
  
  try {
    console.log(`Admin ${req.user.email} downloading document ${req.params.id}`);
    
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found');
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('Document found:', {
      id: document._id,
      title: document.title,
      filePath: document.filePath,
      originalName: document.originalName
    });

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      console.log('File not found on filesystem:', document.filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    console.log('Sending file for download');
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Admin download document error:', error);
    res.status(500).json({ message: 'Server error during download: ' + error.message });
  }
});

// Bulk delete expired documents (must come before :id route)
router.delete('/documents/expired/bulk', adminAuth, async (req, res) => {
  const fs = require('fs');
  
  try {
    console.log(`Admin ${req.user.email} deleting all expired documents`);
    
    const now = new Date();
    
    // Find all expired documents
    const expiredDocuments = await Document.find({
      expiryDate: { $lt: now }
    });
    
    console.log(`Found ${expiredDocuments.length} expired documents`);
    
    if (expiredDocuments.length === 0) {
      return res.json({ message: 'No expired documents found', deletedCount: 0 });
    }
    
    let filesDeleted = 0;
    let documentsDeleted = 0;
    const errors = [];
    
    // Delete each expired document
    for (const document of expiredDocuments) {
      try {
        // Delete file from filesystem
        if (document.filePath && fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
          filesDeleted++;
          console.log(`Deleted file: ${document.filePath}`);
        }
        
        // Delete from database
        await Document.findByIdAndDelete(document._id);
        documentsDeleted++;
        console.log(`Deleted document: ${document.title}`);
        
      } catch (error) {
        console.error(`Error deleting document ${document._id}:`, error);
        errors.push({ documentId: document._id, error: error.message });
      }
    }
    
    console.log(`Bulk deletion complete: ${documentsDeleted} documents deleted, ${filesDeleted} files deleted`);
    
    res.json({
      message: `Successfully deleted ${documentsDeleted} expired documents`,
      deletedCount: documentsDeleted,
      filesDeleted: filesDeleted,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Bulk delete expired documents error:', error);
    res.status(500).json({ message: 'Server error during bulk deletion: ' + error.message });
  }
});

// Admin delete document
router.delete('/documents/:id', adminAuth, async (req, res) => {
  const fs = require('fs');
  
  try {
    console.log(`Admin ${req.user.email} deleting document ${req.params.id}`);
    
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found');
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if document is expired
    const now = new Date();
    const isExpired = now > document.expiryDate;
    
    console.log('Document found for deletion:', {
      id: document._id,
      title: document.title,
      filePath: document.filePath,
      expiryDate: document.expiryDate,
      isExpired: isExpired,
      currentDate: now
    });

    // Admin can delete any document, including expired ones
    console.log('Admin has full deletion privileges');

    // Delete file from filesystem
    let fileDeleted = false;
    try {
      if (document.filePath && fs.existsSync(document.filePath)) {
        console.log('Deleting file from filesystem:', document.filePath);
        fs.unlinkSync(document.filePath);
        fileDeleted = true;
        console.log('File deleted from filesystem successfully');
      } else {
        console.log('File not found on filesystem, continuing with database deletion');
      }
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      console.log('Continuing with database deletion despite file error');
      // Continue with document deletion even if file deletion fails
    }

    // Delete document from database
    console.log('Attempting to delete document from database...');
    const deletedDoc = await Document.findByIdAndDelete(req.params.id);
    
    if (!deletedDoc) {
      console.error('Document was not found in database during deletion');
      return res.status(404).json({ message: 'Document not found during deletion' });
    }
    
    console.log('Document deleted successfully from database');

    res.json({ 
      message: 'Document deleted successfully',
      details: {
        documentId: req.params.id,
        title: document.title,
        wasExpired: isExpired,
        fileDeleted: fileDeleted
      }
    });
  } catch (error) {
    console.error('Admin delete document error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Server error during deletion';
    if (error.name === 'CastError') {
      errorMessage = 'Invalid document ID format';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ message: errorMessage });
  }
});


module.exports = router;
 
// Admin: View task attachment inline
router.get('/tasks/:id/attachment', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!task.attachmentPath || !fs.existsSync(task.attachmentPath)) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    res.setHeader('Content-Type', task.attachmentMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${task.attachmentOriginalName || path.basename(task.attachmentPath)}"`);
    res.sendFile(path.resolve(task.attachmentPath));
  } catch (error) {
    console.error('Admin view task attachment error:', error);
    res.status(500).json({ message: 'Server error during attachment view' });
  }
});

// Admin: Download task attachment
router.get('/tasks/:id/attachment/download', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!task.attachmentPath || !fs.existsSync(task.attachmentPath)) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    res.download(path.resolve(task.attachmentPath), task.attachmentOriginalName || path.basename(task.attachmentPath));
  } catch (error) {
    console.error('Admin download task attachment error:', error);
    res.status(500).json({ message: 'Server error during attachment download' });
  }
});
