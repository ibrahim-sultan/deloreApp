const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create task
router.post('/create', auth, [
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
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, location, totalHours } = req.body;

    // Extract hours from title for additional validation
    const hoursMatch = title.match(/\d+(\.\d+)?/);
    const titleHours = hoursMatch ? parseFloat(hoursMatch[0]) : null;
    
    // Optional: Validate that title hours match totalHours field
    // Uncomment if you want strict matching
    // if (titleHours && Math.abs(titleHours - parseFloat(totalHours)) > 0.01) {
    //   return res.status(400).json({ message: 'Hours in title must match total hours field' });
    // }

    const task = new Task({
      title,
      description,
      location,
      totalHours: parseFloat(totalHours),
      createdBy: req.user._id
    });

    await task.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        location: task.location,
        totalHours: task.totalHours,
        status: task.status,
        createdAt: task.createdAt
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

// Get user's tasks
router.get('/my-tasks', auth, async (req, res) => {
  try {
    console.log('Fetching tasks for user:', req.user._id);
    
    const tasks = await Task.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    const tasksWithHours = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      location: task.location,
      status: task.status,
      hoursSpent: task.hoursSpent,
      totalHours: task.totalHours,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
    
    console.log('Found', tasks.length, 'tasks for user', req.user._id);

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
      .populate('createdBy', 'name email');

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

    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });

    await task.save();

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

module.exports = router;
