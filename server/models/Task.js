const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  arrivalDateTime: {
    type: Date,
    required: true
  },
  departureDateTime: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  hoursSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total hours between arrival and departure
taskSchema.virtual('totalHours').get(function() {
  const diffMs = this.departureDateTime - this.arrivalDateTime;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
});

module.exports = mongoose.model('Task', taskSchema);
