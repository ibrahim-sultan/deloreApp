const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  requiredForAllStaff: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
