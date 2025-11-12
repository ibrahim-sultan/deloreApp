const mongoose = require('mongoose');

const reviewTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // When the link expires. We also add a TTL index so expired docs get cleaned up automatically.
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null, index: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index to auto-remove expired tokens (Mongo will remove docs after expiresAt)
reviewTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ReviewToken', reviewTokenSchema);