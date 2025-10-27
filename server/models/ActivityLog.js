const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'login',
      'logout',
      'task_created',
      'task_updated',
      'task_completed',
      'clock_in',
      'clock_out',
      'profile_updated',
      'password_changed',
      'message_sent',
      'message_read'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
