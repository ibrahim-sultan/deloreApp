const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  taskTitle: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);

