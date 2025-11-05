const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

