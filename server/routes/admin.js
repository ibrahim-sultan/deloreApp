const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const router = express.Router();

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
  body('staffId').isMongoId().withMessage('Valid staff ID is required')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Map attachment is required' });
    }
    
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
      staffId 
    } = req.body;

    // Verify staff exists
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Create task
    const task = new Task({
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
      status: 'assigned',
      attachmentFilename: req.file.filename,
      attachmentOriginalName: req.file.originalname,
      attachmentPath: req.file.path,
      attachmentSize: req.file.size,
      attachmentMimeType: req.file.mimetype
    });

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
        scheduledStartTime: task.scheduledStartTime,
        scheduledEndTime: task.scheduledEndTime
      }
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assigned tasks with staff details
router.get('/assigned-tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $in: ['assigned', 'in-progress', 'completed'] } })
      .populate('assignedTo', 'name email')
      .sort({ scheduledStartTime: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
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

module.exports = router;
