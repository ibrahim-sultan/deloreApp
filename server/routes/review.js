const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ReviewToken = require('../models/ReviewToken');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

const REVIEW_LINK_TTL_SECONDS = parseInt(process.env.REVIEW_LINK_TTL_SECONDS || '3600', 10); // default 1 hour
const REVIEW_MAX_LINK_TTL_SECONDS = parseInt(process.env.REVIEW_MAX_LINK_TTL_SECONDS || String(30 * 24 * 3600), 10); // default 30 days

// Helper: sign a JWT for app session (short-lived)
function signAppSession(user, ttlSeconds = 3600) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: `${ttlSeconds}s` }
  );
}

// Admin-only: generate a single-use review link for an existing user (e.g., a dedicated review account)
// Body: { email?: string, userId?: string, ttlSeconds?: number }
router.post('/api/review/generate-link', adminAuth, [
  body('email').optional().isEmail().withMessage('email must be a valid email'),
  body('userId').optional().isString(),
  body('ttlSeconds').optional().isInt({ min: 60, max: 24 * 3600 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, userId, ttlSeconds } = req.body;

    if (!email && !userId) {
      return res.status(400).json({ message: 'Provide either email or userId' });
    }

    const user = email
      ? await User.findOne({ email })
      : await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'User is not active. Reactivate before generating a link.' });
    }

    const jti = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const effectiveTtl = Math.max(60, Math.min(parseInt(ttlSeconds || REVIEW_LINK_TTL_SECONDS, 10), REVIEW_MAX_LINK_TTL_SECONDS));
    const expiresAt = new Date(Date.now() + effectiveTtl * 1000);

    const payload = { sub: String(user._id), jti, typ: 'review' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: effectiveTtl });

    await ReviewToken.create({ jti, userId: user._id, expiresAt });

    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.CLIENT_BASE_URL || '';
    const link = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/review-access?token=${encodeURIComponent(token)}`
      : `/review-access?token=${encodeURIComponent(token)}`;

    return res.json({
      message: 'One-time review link generated',
      link,
      expiresInSeconds: effectiveTtl,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Error generating review link:', err);
    return res.status(500).json({ message: 'Failed to generate review link' });
  }
});

// Public: redeem one-time review access link
// GET /review-access?token=...
router.get('/review-access', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('Missing token');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).send('Invalid or expired link');
    }

    const now = new Date();

    // Atomically mark token as used if not used and not expired
    const record = await ReviewToken.findOneAndUpdate(
      { jti: decoded.jti, usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { new: true }
    );

    if (!record) {
      return res.status(410).send('Link already used or expired');
    }

    // Fetch user
    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(404).send('Associated user not found');
    }

    // Issue short-lived session
    const sessionTtl = parseInt(process.env.REVIEW_SESSION_TTL_SECONDS || '3600', 10); // default 1 hour
    const sessionToken = signAppSession(user, sessionTtl);

    // Immediately deactivate the underlying user so credentials cannot be reused
    if (user.isActive) {
      user.isActive = false;
      await user.save();
    }

    const clientUrl = process.env.CLIENT_BASE_URL;
    if (clientUrl) {
      // Redirect to client with token in fragment (avoids sending token to servers via logs)
      const redirectUrl = `${clientUrl.replace(/\/$/, '')}/review#token=${encodeURIComponent(sessionToken)}`;
      return res.redirect(302, redirectUrl);
    }

    // Fallback: plain response
    return res.status(200).json({ message: 'Access granted (one-time).', token: sessionToken, expiresInSeconds: sessionTtl });
  } catch (err) {
    console.error('Error redeeming review link:', err);
    return res.status(500).send('Server error while redeeming link');
  }
});

module.exports = router;