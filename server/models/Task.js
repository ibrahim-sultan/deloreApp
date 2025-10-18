const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Title must contain total hours as numbers (e.g., "Task Name 8", "Project Work 4.5")
        const hoursMatch = v.match(/\d+(\.\d+)?/);
        return hoursMatch !== null;
      },
      message: 'Title must include total hours as numbers (e.g., "Task Name 8" or "Project Work 4.5")'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  totalHours: {
    type: Number,
    required: true,
    min: [0.1, 'Total hours must be at least 0.1'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Total hours must be greater than 0'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Only required for admin-created tasks
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  hoursSpent: {
    type: Number,
    default: 0
  },
  // Admin task scheduling fields
  scheduledStartTime: {
    type: Date,
    required: false
  },
  scheduledEndTime: {
    type: Date,
    required: false
  },
  // Time tracking fields
  clockInTime: {
    type: Date,
    required: false
  },
  clockOutTime: {
    type: Date,
    required: false
  },
  // Location and contact fields for admin tasks
  coordinates: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  contactPerson: {
    type: String,
    required: false,
    trim: true
  },
  // Work summary and admin override tracking
  workSummary: {
    type: String,
    trim: true
  },
  adminOverride: {
    clockIn: {
      type: Boolean,
      default: false
    },
    clockOut: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      trim: true
    }
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  attachmentFilename: {
    type: String,
    required: false // Optional for backward compatibility
  },
  attachmentOriginalName: {
    type: String,
    required: false
  },
  attachmentPath: {
    type: String,
    required: false
  },
  attachmentSize: {
    type: Number,
    required: false
  },
  attachmentMimeType: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Extract total hours from title for validation consistency
taskSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    const hoursMatch = this.title.match(/\d+(\.\d+)?/);
    if (hoursMatch) {
      const extractedHours = parseFloat(hoursMatch[0]);
      // Optionally sync the totalHours field with the hours in the title
      // Uncomment the next line if you want automatic sync
      // this.totalHours = extractedHours;
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
