const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isExpired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Check if document is expired
documentSchema.virtual('expired').get(function() {
  return new Date() > this.expiryDate;
});

// Update expired status before saving
documentSchema.pre('save', function(next) {
  this.isExpired = new Date() > this.expiryDate;
  next();
});

module.exports = mongoose.model('Document', documentSchema);
