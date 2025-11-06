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
const nodemailer = require('nodemailer');

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

// Create and assign task to staff
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
  body('latitude').isNumeric().withMessage('Latitude must be a number'),
  body('longitude').isNumeric().withMessage('Longitude must be a number'),
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

    // Create task with optional attachment
    const taskData = {
      title,
      description,
      location,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      contactPerson,
      scheduledStartTime,
      scheduledEndTime,
      totalHours: parseFloat(totalHours),
      createdBy: req.user._id,
      assignedTo: staffId,
      client: clientId,
      status: 'assigned'
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

    // Send email notification to staff
    try {
      // Create a transporter
      const transporter = nodemailer.createTransport({
        // Use environment variables in production
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-password'
        }
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: staff.email,
        subject: `New Task Assignment: ${title}`,
        html: `
          <h2>You have been assigned a new task</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Client:</strong> ${client.name}</p>
          <p><strong>Contact Person:</strong> ${contactPerson}</p>
          <p><strong>Start Time:</strong> ${new Date(scheduledStartTime).toLocaleString()}</p>
          <p><strong>End Time:</strong> ${new Date(scheduledEndTime).toLocaleString()}</p>
          <p>Please log in to your portal to view more details and clock in when you arrive at the location.</p>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);
      
      // Update notification status
      task.notificationSent = true;
      await task.save();
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({ 
      message: 'Task assigned successfully', 
      task: {
        id: task._id,
        title: task.title,
        assignedTo: staff.name,
        client: client.name,
        scheduledStartTime: task.scheduledStartTime,
        scheduledEndTime: task.scheduledEndTime
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
      message: 'Admin override clock-out successful', 
      task: {
        id: task._id,
        title: task.title,
        clockOutTime: task.clockOutTime,
        hoursSpent: task.hoursSpent
      }
    });
  } catch (error) {
    console.error('Error in admin override clock-out:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all staff activity logs
router.get('/staff-logs', adminAuth, async (req, res) => {
  try {
    const { staffId, activityType, startDate, endDate, limit = 100 } = req.query;
    
    const query = {};
    
    if (staffId) {
      query.user = staffId;
    }
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching staff logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get activity logs for a specific staff member
router.get('/staff-logs/:staffId', adminAuth, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { limit = 50 } = req.query;
    
    // Verify staff exists
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    const logs = await ActivityLog.find({ user: staffId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Get activity statistics
    const stats = await ActivityLog.aggregate([
      { $match: { user: mongoose.Types.ObjectId(staffId) } },
      { $group: { _id: '$activityType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email
      },
      logs,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching staff member logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin documents - list all
router.get('/documents', adminAuth, async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin documents - download
router.get('/documents/:id/download', adminAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    res.download(doc.filePath, doc.originalName);
  } catch (error) {
    console.error('Admin download document error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin documents - delete
router.delete('/documents/:id', adminAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    try {
      if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
    } catch (e) {
      console.warn('Failed to delete file from disk:', e.message);
    }
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Admin delete document error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin documents - bulk delete expired
router.delete('/documents/expired/bulk', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const expired = await Document.find({ expiryDate: { $lt: now } });
    let deleted = 0;
    for (const doc of expired) {
      try {
        if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
      } catch (_) { /* ignore */ }
      await Document.findByIdAndDelete(doc._id);
      deleted++;
    }
    res.json({ message: 'Expired documents deleted', deleted });
  } catch (error) {
    console.error('Admin bulk delete expired error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all clients
router.get('/clients', adminAuth, async (req, res) => {
  try {
    const clients = await Client.find()
      .populate('addedBy', 'name email')
      .sort({ name: 1 });
    
    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new client
router.post('/clients', adminAuth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Client name is required'),
  body('address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('contactNumber').trim().isLength({ min: 1 }).withMessage('Contact number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, contactNumber } = req.body;

    // Check if client already exists
    const existingClient = await Client.findOne({ name });
    if (existingClient) {
      return res.status(400).json({ message: 'Client with this name already exists' });
    }

    const client = new Client({
      name,
      address,
      contactNumber,
      addedBy: req.user._id
    });

    await client.save();

    res.status(201).json({
      message: 'Client added successfully',
      client
    });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update client
router.put('/clients/:id', adminAuth, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Client name cannot be empty'),
  body('address').optional().trim().isLength({ min: 1 }).withMessage('Address cannot be empty'),
  body('contactNumber').optional().trim().isLength({ min: 1 }).withMessage('Contact number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { name, address, contactNumber } = req.body;
    
    if (name) client.name = name;
    if (address) client.address = address;
    if (contactNumber) client.contactNumber = contactNumber;

    await client.save();

    res.json({
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete client
router.delete('/clients/:id', adminAuth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if client has tasks
    const tasksCount = await Task.countDocuments({ client: req.params.id });
    if (tasksCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete client. ${tasksCount} task(s) are associated with this client.` 
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new staff member
router.post('/staff', adminAuth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Staff name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('temporaryPassword').isLength({ min: 6 }).withMessage('Temporary password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, temporaryPassword } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new staff member
    const newStaff = new User({
      name,
      email,
      password: temporaryPassword, // Will be hashed by pre-save hook
      role: 'staff',
      isActive: true,
      isTemporaryPassword: true,
      temporaryPasswordExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await newStaff.save();

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      },
      temporaryCredentials: {
        email: newStaff.email,
        temporaryPassword: temporaryPassword
      }
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Document templates CRUD
router.get('/document-templates', adminAuth, async (req, res) => {
  try {
    const templates = await DocumentTemplate.find().sort({ createdAt: -1 });
    res.json({ templates });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load templates' });
  }
});

router.post('/document-templates', adminAuth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().isString(),
  body('requiredForAllStaff').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description = '', requiredForAllStaff = true } = req.body;
    const tpl = new DocumentTemplate({ title, description, requiredForAllStaff });
    await tpl.save();
    res.status(201).json({ message: 'Template created', template: tpl });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create template' });
  }
});

router.put('/document-templates/:id', adminAuth, async (req, res) => {
  try {
    const tpl = await DocumentTemplate.findById(req.params.id);
    if (!tpl) return res.status(404).json({ message: 'Template not found' });
    const { title, description, requiredForAllStaff } = req.body;
    if (title !== undefined) tpl.title = title;
    if (description !== undefined) tpl.description = description;
    if (requiredForAllStaff !== undefined) tpl.requiredForAllStaff = requiredForAllStaff;
    await tpl.save();
    res.json({ message: 'Template updated', template: tpl });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update template' });
  }
});

router.delete('/document-templates/:id', adminAuth, async (req, res) => {
  try {
    await DocumentTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

// Toggle staff status (activate/deactivate)
router.put('/staff/:staffId/toggle-status', adminAuth, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' });
    if (!staff) {
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
    console.error('Error toggling staff status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get staff member details
router.get('/staff/:staffId', adminAuth, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' })
      .select('name email isActive createdAt');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Get staff activity counts
    const totalDocuments = await Document.countDocuments({ uploadedBy: req.params.staffId });
    const totalTasks = await Task.countDocuments({ assignedTo: req.params.staffId });
    const totalPayments = await Payment.countDocuments({ staffMember: req.params.staffId });
    
    // Calculate total hours from completed tasks
    const completedTasks = await Task.find({ 
      assignedTo: req.params.staffId, 
      status: 'completed' 
    });
    const totalHours = completedTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);

    // Get recent documents
    const documents = await Document.find({ uploadedBy: req.params.staffId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent tasks
    const tasks = await Task.find({ assignedTo: req.params.staffId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      staff: {
        ...staff.toObject(),
        totalDocuments,
        totalTasks,
        totalHours: Math.round(totalHours * 10) / 10,
        totalPayments
      },
      documents,
      tasks
    });
  } catch (error) {
    console.error('Error fetching staff details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete staff member
router.delete('/staff/:staffId', adminAuth, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if staff has assigned tasks
    const assignedTasksCount = await Task.countDocuments({ 
      assignedTo: req.params.staffId,
      status: { $in: ['assigned', 'in-progress'] }
    });
    
    if (assignedTasksCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete staff member. ${assignedTasksCount} active task(s) are assigned to this staff member.` 
      });
    }

    await User.findByIdAndDelete(req.params.staffId);

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
