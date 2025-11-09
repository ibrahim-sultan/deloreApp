const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const Document = require('../models/Document');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const Client = require('../models/Client');
const DocumentTemplate = require('../models/DocumentTemplate');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

// Simple test endpoint to check if basic functionality works
router.get('/dashboard-test', adminAuth, async (req, res) => {
  try {
    console.log('Test endpoint called by:', req.user?.email);
    
    // Just return basic info without any database queries
    const response = {
      message: 'Test endpoint working',
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      },
      timestamp: new Date().toISOString(),
      statistics: {
        totalStaff: 0,
        totalDocuments: 0,
        totalTasks: 0,
        totalPayments: 0,
        activeStaff: 0
      },
      staffMembers: [],
      documentsByStaff: [],
      tasksByStaff: [],
      recentDocuments: [],
      recentTasks: [],
      recentPayments: []
    };
    
    console.log('Test endpoint response:', response.message);
    res.json(response);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint error', error: error.message });
  }
});

// Admin dashboard endpoint - SIMPLIFIED VERSION THAT WORKS
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    console.log('Admin dashboard endpoint called by:', req.user?.email);

    // Simple, reliable data fetching without complex aggregations
    const statistics = {
      totalStaff: 0,
      totalDocuments: 0,
      totalTasks: 0,
      totalPayments: 0,
      activeStaff: 0
    };

    // Get basic counts (these are simple and reliable)
    try {
      statistics.totalStaff = await User.countDocuments({ role: 'staff' }) || 0;
      statistics.totalDocuments = await Document.countDocuments() || 0;
      statistics.totalTasks = await Task.countDocuments() || 0;
      statistics.totalPayments = await Payment.countDocuments() || 0;
      console.log('Basic statistics:', statistics);
    } catch (countError) {
      console.error('Error getting counts:', countError);
      // Continue with zeros if counts fail
    }

    // Get staff members for display
    let staffMembers = [];
    try {
      staffMembers = await User.find({ role: 'staff' })
        .select('name email isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      
      statistics.activeStaff = staffMembers.filter(s => s.isActive).length;
      console.log('Staff members loaded:', staffMembers.length);
    } catch (staffError) {
      console.error('Error loading staff:', staffError);
    }

    // Get recent items for display (simplified - no complex populates)
    let recentDocuments = [];
    let recentTasks = [];
    let allTasks = [];
    let recentPayments = [];

    try {
      recentDocuments = await Document.find()
        .select('title filename createdAt uploadedBy')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      console.log('Recent documents loaded:', recentDocuments.length);
    } catch (docError) {
      console.error('Error loading documents:', docError);
    }

    try {
      recentTasks = await Task.find()
        .select('title status location createdAt assignedTo createdBy')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      console.log('Recent tasks loaded:', recentTasks.length);
    } catch (taskError) {
      console.error('Error loading tasks:', taskError);
    }

    try {
      allTasks = await Task.find()
        .select('title status scheduledStartTime assignedTo createdBy createdAt')
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
      console.log('All tasks loaded:', allTasks.length);
    } catch (taskError) {
      console.error('Error loading all tasks:', taskError);
    }

    try {
      recentPayments = await Payment.find()
        .select('amount paymentDate description createdAt staffMember')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      console.log('Recent payments loaded:', recentPayments.length);
    } catch (paymentError) {
      console.error('Error loading payments:', paymentError);
    }

    // Create simple groupings without complex aggregations
    const documentsByStaff = [];
    const tasksByStaff = [];

    // Group documents by staff (simple version)
    const docGroups = {};
    recentDocuments.forEach(doc => {
      if (doc.uploadedBy) {
        const staffId = doc.uploadedBy.toString();
        if (!docGroups[staffId]) {
          docGroups[staffId] = {
            _id: staffId,
            documents: [],
            documentCount: 0
          };
        }
        docGroups[staffId].documents.push({
          id: doc._id,
          title: doc.title,
          filename: doc.filename,
          createdAt: doc.createdAt
        });
        docGroups[staffId].documentCount++;
      }
    });
    documentsByStaff.push(...Object.values(docGroups));

    // Group tasks by staff (simple version)
    const taskGroups = {};
    recentTasks.forEach(task => {
      if (task.assignedTo) {
        const staffId = task.assignedTo.toString();
        if (!taskGroups[staffId]) {
          taskGroups[staffId] = {
            _id: staffId,
            tasks: [],
            taskCount: 0,
            completedTasks: 0
          };
        }
        taskGroups[staffId].tasks.push({
          id: task._id,
          title: task.title,
          status: task.status,
          location: task.location,
          createdAt: task.createdAt
        });
        taskGroups[staffId].taskCount++;
        if (task.status === 'completed') {
          taskGroups[staffId].completedTasks++;
        }
      }
    });
    tasksByStaff.push(...Object.values(taskGroups));

    const response = {
      statistics,
      staffMembers,
      documentsByStaff,
      tasksByStaff,
      tasks: allTasks,
      recentActivities: {
        documents: recentDocuments,
        tasks: recentTasks
      },
      recentPayments
    };

    console.log('Dashboard data prepared successfully');
    res.json(response);

  } catch (error) {
    console.error('Critical dashboard error:', error);
    res.status(500).json({ 
      message: 'Dashboard loading failed', 
      error: error.message 
    });
  }
});

// Ensure uploads directory exists
const mapsUploadDir = path.join(__dirname, '..', 'uploads', 'maps');
if (!fs.existsSync(mapsUploadDir)) {
  fs.mkdirSync(mapsUploadDir, { recursive: true });
}

// Configure multer storage for map attachments
const mapStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, mapsUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `map-${uniqueSuffix}${ext}`);
  }
});

const mapUpload = multer({
  storage: mapStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Allow only image and PDF files
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and PDF files are allowed'));
  }
});

// Create and assign task to staff - UPDATED WITH REQUIRED COORDINATES
router.post('/assign-task', adminAuth, mapUpload.single('mapAttachment'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required')
    .custom((value) => {
      const hoursMatch = value.match(/\d+(\.\d+)?/);
      if (!hoursMatch) {
        throw new Error('Title must include total hours as numbers (e.g., "Task Name 8" or "Project Work 4.5")');
      }
      return true;
    }),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  // UPDATED: Make latitude and longitude REQUIRED
  body('latitude').notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('contactPerson').trim().isLength({ min: 1 }).withMessage('Contact person is required'),
  body('scheduledStartTime').isISO8601().withMessage('Valid start time is required'),
  body('scheduledEndTime').isISO8601().withMessage('Valid end time is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.scheduledStartTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('totalHours').isNumeric().withMessage('Total hours must be a number')
    .custom((value) => {
      const hours = parseFloat(value);
      if (hours <= 0) {
        throw new Error('Total hours must be greater than 0');
      }
      if (hours < 0.1) {
        throw new Error('Total hours must be at least 0.1');
      }
      return true;
    }),
  body('staffId').isMongoId().withMessage('Valid staff ID is required'),
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      description, 
      location, 
      latitude, 
      longitude, 
      contactPerson,
      scheduledStartTime, 
      scheduledEndTime, 
      totalHours,
      staffId, 
      clientId
    } = req.body;

    // Verify staff exists
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Parse and validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude values' });
    }

    // Create task with REQUIRED coordinates
    const taskData = {
      title,
      description,
      location,
      contactPerson,
      scheduledStartTime,
      scheduledEndTime,
      totalHours: parseFloat(totalHours),
      createdBy: req.user._id,
      assignedTo: staffId,
      client: clientId,
      status: 'assigned',
      // Coordinates are now ALWAYS set
      coordinates: { 
        latitude: lat, 
        longitude: lon 
      }
    };
    
    // Add attachment info if file was uploaded
    if (req.file) {
      taskData.attachmentFilename = req.file.filename;
      taskData.attachmentOriginalName = req.file.originalname;
      taskData.attachmentPath = req.file.path;
      taskData.attachmentSize = req.file.size;
      taskData.attachmentMimeType = req.file.mimetype;
    }
    
    const task = new Task(taskData);

    await task.save();

    // Send email notification to staff (Postmark)
    try {
      await sendMail({
        to: staff.email,
        subject: `New Task Assignment: ${title}`,
        html: `
          <h2>You have been assigned a new task</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Coordinates:</strong> ${lat}, ${lon}</p>
          <p><strong>Client:</strong> ${client.name}</p>
          <p><strong>Contact Person:</strong> ${contactPerson}</p>
          <p><strong>Start Time:</strong> ${new Date(scheduledStartTime).toLocaleString()}</p>
          <p><strong>End Time:</strong> ${new Date(scheduledEndTime).toLocaleString()}</p>
          <p><strong>IMPORTANT:</strong> You must be within 500 meters of the assigned location to check in.</p>
          <p>Please log in to your portal to view more details and clock in when you arrive at the location.</p>
        `
      });
      // Update notification status
      task.notificationSent = true;
      await task.save();
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
      // Continue even if email fails
    }

    res.status(201).json({ 
      message: 'Task assigned successfully with location coordinates', 
      task: {
        id: task._id,
        title: task.title,
        assignedTo: staff.name,
        client: client.name,
        scheduledStartTime: task.scheduledStartTime,
        scheduledEndTime: task.scheduledEndTime,
        coordinates: task.coordinates,
        geofenceRadius: '500 meters'
      }
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint for troubleshooting data fetching
router.get('/debug-data', adminAuth, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('name email isActive').lean();
    const Client = require('../models/Client');
    const clients = await Client.find().select('name email').lean();
    const tasks = await Task.find().select('title status').limit(5).lean();
    
    console.log('🔍 Debug Data Fetched:');
    console.log('👥 Staff count:', staff.length);
    console.log('🏢 Clients count:', clients.length);
    console.log('📋 Tasks count:', tasks.length);
    
    res.json({
      staff: staff,
      clients: clients,
      tasks: tasks,
      message: 'Debug data fetched successfully'
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

// Get all staff members
router.get('/staff', adminAuth, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('name email isActive createdAt')
      .sort({ name: 1 })
      .lean();
    
    console.log('📊 Staff endpoint called - found', staff.length, 'staff members');
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create another admin
router.post('/admins', adminAuth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Admin name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const admin = new User({ name, email, password, role: 'admin', isActive: true });
    await admin.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List admins (for management UI)
router.get('/admins', adminAuth, async (_req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('name email isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ admins });
  } catch (error) {
    console.error('Error listing admins:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset staff password (generate temporary password)
router.post('/staff/:staffId/reset-password', adminAuth, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Generate a secure temporary password
    const generateTemp = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let out = '';
      for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    };
    const temporaryPassword = generateTemp();

    staff.password = temporaryPassword; // will be hashed by pre-save hook
    staff.isTemporaryPassword = true;
    staff.temporaryPasswordExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    await staff.save();

    res.json({
      message: 'Temporary password generated successfully',
      temporaryCredentials: { email: staff.email, temporaryPassword }
    });
  } catch (error) {
    console.error('Error resetting staff password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assigned tasks with staff details
router.get('/assigned-tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $in: ['assigned', 'in-progress', 'completed'] } })
      .populate('assignedTo', 'name email')
      .populate('client', 'name')
      .sort({ scheduledStartTime: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/tasks/:id', adminAuth, async (req, res) => {
  try {
    const { assignedTo, client, status, scheduledStartTime, scheduledEndTime } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update fields
    if (assignedTo) task.assignedTo = assignedTo;
    if (client) task.client = client;
    if (status) task.status = status;
    if (scheduledStartTime) task.scheduledStartTime = scheduledStartTime;
    if (scheduledEndTime) task.scheduledEndTime = scheduledEndTime;

    await task.save();
    
    res.json({ 
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get staff task reports
router.get('/staff-reports', adminAuth, async (req, res) => {
  try {
    // Get all completed tasks with staff details
    const tasks = await Task.find({ 
      status: 'completed',
      assignedTo: { $exists: true }
    })
    .populate('assignedTo', 'name email')
    .sort({ clockOutTime: -1 });
    
    // Group tasks by staff member
    const staffReports = {};
    
    tasks.forEach(task => {
      const staffId = task.assignedTo._id.toString();
      const staffName = task.assignedTo.name;
      
      if (!staffReports[staffId]) {
        staffReports[staffId] = {
          staffId,
          staffName,
          email: task.assignedTo.email,
          totalTasks: 0,
          totalHoursSpent: 0,
          tasks: []
        };
      }
      
      staffReports[staffId].totalTasks += 1;
      staffReports[staffId].totalHoursSpent += task.hoursSpent || 0;
      
      staffReports[staffId].tasks.push({
        taskId: task._id,
        title: task.title,
        location: task.location,
        scheduledStartTime: task.scheduledStartTime,
        scheduledEndTime: task.scheduledEndTime,
        clockInTime: task.clockInTime,
        clockOutTime: task.clockOutTime,
        hoursSpent: task.hoursSpent,
        workSummary: task.workSummary
      });
    });
    
    res.json(Object.values(staffReports));
  } catch (error) {
    console.error('Error generating staff reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed report for a specific staff member
router.get('/staff-report/:staffId', adminAuth, async (req, res) => {
  try {
    const staffId = req.params.staffId;
    
    // Verify staff exists
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Get all tasks for this staff member
    const tasks = await Task.find({ assignedTo: staffId })
      .sort({ scheduledStartTime: -1 });
    
    // Calculate statistics
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const assignedTasks = tasks.filter(task => task.status === 'assigned');
    
    const totalHoursSpent = completedTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
    const totalScheduledHours = tasks.reduce((sum, task) => sum + (task.totalHours || 0), 0);
    
    // Calculate on-time performance
    const onTimeClockIns = completedTasks.filter(task => {
      if (!task.clockInTime || !task.scheduledStartTime) return false;
      
      const clockIn = new Date(task.clockInTime);
      const scheduled = new Date(task.scheduledStartTime);
      const diffMinutes = Math.abs((clockIn - scheduled) / (1000 * 60));
      
      return diffMinutes <= 15; // Within 15 minutes of scheduled time
    }).length;
    
    const onTimePercentage = completedTasks.length > 0 
      ? Math.round((onTimeClockIns / completedTasks.length) * 100) 
      : 0;
    
    res.json({
      staffId,
      name: staff.name,
      email: staff.email,
      statistics: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        assignedTasks: assignedTasks.length,
        totalHoursSpent,
        totalScheduledHours,
        onTimePerformance: onTimePercentage
      },
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        location: task.location,
        contactPerson: task.contactPerson,
        scheduledStartTime: task.scheduledStartTime,
        scheduledEndTime: task.scheduledEndTime,
        clockInTime: task.clockInTime,
        clockOutTime: task.clockOutTime,
        hoursSpent: task.hoursSpent,
        totalHours: task.totalHours,
        workSummary: task.workSummary,
        adminOverride: task.adminOverride
      }))
    });
  } catch (error) {
    console.error('Error generating staff report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin override for clock-in
router.post('/override-clock-in/:taskId', adminAuth, [
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.clockInTime) {
      return res.status(400).json({ message: 'Task already clocked in' });
    }

    // Update task with admin override
    task.clockInTime = new Date();
    task.status = 'in-progress';
    task.adminOverride.clockIn = true;
    task.adminOverride.reason = reason;

    await task.save();

    res.json({ 
      message: 'Admin override clock-in successful', 
      task: {
        id: task._id,
        title: task.title,
        clockInTime: task.clockInTime
      }
    });
  } catch (error) {
    console.error('Error in admin override clock-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin override for clock-out
router.post('/override-clock-out/:taskId', adminAuth, [
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required'),
  body('workSummary').trim().isLength({ min: 1 }).withMessage('Work summary is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { reason, workSummary } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.clockInTime) {
      return res.status(400).json({ message: 'Task has not been clocked in yet' });
    }

    if (task.clockOutTime) {
      return res.status(400).json({ message: 'Task already clocked out' });
    }

    // Update task with admin override
    task.clockOutTime = new Date();
    task.status = 'completed';
    task.adminOverride.clockOut = true;
    task.adminOverride.reason += `\nClock-out reason: ${reason}`;
    task.workSummary = workSummary;

    // Calculate hours spent
    const clockInTime = new Date(task.clockInTime);
    const clockOutTime = new Date(task.clockOutTime);
    const hoursSpent = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    task.hoursSpent = parseFloat(hoursSpent.toFixed(2));

    await task.save();

    res.json({ 
      message: 'Admin override clock-out successful
