const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

const router = express.Router();

// Ensure uploads directory exists
const tasksUploadDir = path.join(__dirname, '..', 'uploads', 'tasks');
if (!fs.existsSync(tasksUploadDir)) {
  fs.mkdirSync(tasksUploadDir, { recursive: true });
}

// Configure multer storage for task attachments
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tasksUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `task-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  }
});

// Create task
router.post('/create', auth, upload.single('attachment'), [
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
  body('assignedTo').optional().isMongoId().withMessage('assignedTo must be a valid user id')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Attachment is required' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, location, totalHours, clientId, assignedTo } = req.body;

    // Extract hours from title for additional validation
    const hoursMatch = title.match(/\d+(\.\d+)?/);
    const titleHours = hoursMatch ? parseFloat(hoursMatch[0]) : null;
    
    // Optional: Validate that title hours match totalHours field
    // Uncomment if you want strict matching
    // if (titleHours && Math.abs(titleHours - parseFloat(totalHours)) > 0.01) {
    //   return res.status(400).json({ message: 'Hours in title must match total hours field' });
    // }

    const taskData = {
      title,
      description,
      location,
      totalHours: parseFloat(totalHours),
      createdBy: req.user._id,
      attachmentFilename: req.file.filename,
      attachmentOriginalName: req.file.originalname,
      attachmentPath: req.file.path,
      attachmentSize: req.file.size,
      attachmentMimeType: req.file.mimetype
    };

    if (clientId) {
      taskData.client = clientId;
    }

    if (assignedTo) {
      taskData.assignedTo = assignedTo;
      taskData.status = 'assigned';
    }

    const task = new Task(taskData);

    await task.save();

    // Send assignment email if assigned
    try {
      if (assignedTo) {
        const assignee = await User.findById(assignedTo);
        const transporter = getTransporter();
        if (assignee && transporter) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignee.email,
            subject: '[Delore] New Task Assigned',
            html: `<p>Hello ${assignee.name || ''},</p>
                   <p>You have been assigned a new task:</p>
                   <p><strong>${title}</strong></p>
                   <p>Location: ${location}</p>
                   <p>Total Hours: ${totalHours}</p>`
          });
        }
      }
    } catch (mailErr) {
      console.warn('Task assignment email failed:', mailErr.message);
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        location: task.location,
        totalHours: task.totalHours,
        status: task.status,
        createdAt: task.createdAt,
        client: task.client
      }
    });
  } catch (error) {
    console.error('Task creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during task creation' });
  }
});

// Get user's tasks (both created by user and assigned to user)
router.get('/my-tasks', auth, async (req, res) => {
  try {
    console.log('Fetching tasks for user:', req.user._id, 'Role:', req.user.role);
    
    // Fetch tasks created by user OR assigned to user
    const tasks = await Task.find({ 
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    })
      .populate('client', 'name address contactNumber')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const tasksWithHours = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      location: task.location,
      contactPerson: task.contactPerson,
      status: task.status,
      hoursSpent: task.hoursSpent,
      totalHours: task.totalHours,
      scheduledStartTime: task.scheduledStartTime,
      scheduledEndTime: task.scheduledEndTime,
      clockInTime: task.clockInTime,
      clockOutTime: task.clockOutTime,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      client: task.client,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
      coordinates: task.coordinates,
      attachmentFilename: task.attachmentFilename,
      attachmentOriginalName: task.attachmentOriginalName
    }));
    
    console.log('Found', tasks.length, 'tasks for user', req.user._id, '- Created:', tasks.filter(t => t.createdBy?._id?.toString() === req.user._id.toString()).length, 'Assigned:', tasks.filter(t => t.assignedTo?._id?.toString() === req.user._id.toString()).length);

    res.json({ tasks: tasksWithHours });
  } catch (error) {
    console.error('Get tasks error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error while fetching tasks' });
    }
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('client', 'name address contactNumber');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task or is admin
    if (task.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ 
      task: {
        ...task.toObject()
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty')
    .custom((value) => {
      if (value) {
        const hoursMatch = value.match(/\d+(\.\d+)?/);
        if (!hoursMatch) {
          throw new Error('Title must include total hours as numbers (e.g., "Task Name 8" or "Project Work 4.5")');
        }
      }
      return true;
    }),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('totalHours').optional().isNumeric().withMessage('Total hours must be a number')
    .custom((value) => {
      if (value !== undefined) {
        const hours = parseFloat(value);
        if (hours <= 0) {
          throw new Error('Total hours must be greater than 0');
        }
        if (hours < 0.1) {
          throw new Error('Total hours must be at least 0.1');
        }
      }
      return true;
    }),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('hoursSpent').optional().isNumeric().withMessage('Hours spent must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;

    const prevAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });

    await task.save();

    // If newly assigned or reassigned, notify assignee
    try {
      const newAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
      if (newAssignedTo && newAssignedTo !== prevAssignedTo) {
        const assignee = await User.findById(newAssignedTo);
        const transporter = getTransporter();
        if (assignee && transporter) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignee.email,
            subject: '[Delore] Task Assigned to You',
            html: `<p>Hello ${assignee.name || ''},</p>
                   <p>You have been assigned a task:</p>
                   <p><strong>${task.title}</strong></p>
                   <p>Location: ${task.location}</p>
                   <p>Total Hours: ${task.totalHours}</p>`
          });
        }
      }
    } catch (mailErr) {
      console.warn('Task assignment email failed:', mailErr.message);
    }

    res.json({
      message: 'Task updated successfully',
      task: {
        ...task.toObject()
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Haversine distance in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Staff clock-in: must be assigned user, within ±30 mins of scheduled start, and within 500m of coordinates
router.post('/:id/clock-in', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only assigned staff can clock in
    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    if (task.clockInTime) return res.status(400).json({ message: 'Already clocked in' });

    // Time window check: ±30 minutes around scheduledStartTime
    if (!task.scheduledStartTime) {
      return res.status(400).json({ message: 'This task does not have a scheduled start time set' });
    }
    const now = Date.now();
    const start = new Date(task.scheduledStartTime).getTime();
    const windowMs = 30 * 60 * 1000;
    if (now < (start - windowMs) || now > (start + windowMs)) {
      return res.status(400).json({ message: 'You can only clock in within 30 minutes before or after the scheduled start time' });
    }

    // Geofence: must be within 500m if coordinates exist
    const { latitude, longitude } = req.body || {};
    if (task.coordinates?.latitude != null && task.coordinates?.longitude != null) {
      if (latitude == null || longitude == null) {
        return res.status(400).json({ message: 'Missing current coordinates' });
      }
      const dist = distanceMeters(
        parseFloat(latitude), parseFloat(longitude),
        task.coordinates.latitude, task.coordinates.longitude
      );
      if (dist > 500) {
        return res.status(400).json({ message: 'Must be within 500m of assigned location to check in' });
      }
    }

    task.clockInTime = new Date();
    task.status = 'in-progress';
    await task.save();

    res.json({ message: 'Clock-in successful', clockInTime: task.clockInTime });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Staff clock-out: must be assigned user and provide workSummary
router.post('/:id/clock-out', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    if (!task.clockInTime) return res.status(400).json({ message: 'Not clocked in yet' });
    if (task.clockOutTime) return res.status(400).json({ message: 'Already clocked out' });

    const { workSummary } = req.body || {};
    if (!workSummary || !String(workSummary).trim()) {
      return res.status(400).json({ message: 'Work summary is required to clock out' });
    }

    task.clockOutTime = new Date();
    task.status = 'completed';
    task.workSummary = String(workSummary).trim();

    const hoursSpent = (task.clockOutTime - new Date(task.clockInTime)) / (1000 * 60 * 60);
    task.hoursSpent = parseFloat(hoursSpent.toFixed(2));

    await task.save();

    res.json({ message: 'Clock-out successful', clockOutTime: task.clockOutTime, hoursSpent: task.hoursSpent });
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
