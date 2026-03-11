#!/usr/bin/env node
/*
  Usage examples:
    node scripts/generate-review-link.js --email play-review@example.com --ttl 3600

  This script:
    - Loads env from server/.env (fallback to .env.production)
    - Connects to MongoDB
    - Finds or creates a dedicated review user (if email provided and not found)
    - Creates a ReviewToken document (single-use)
    - Signs a JWT using JWT_SECRET
    - Prints the one-time link and expiry
*/

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const prodEnvPath = path.join(rootDir, '.env.production');

// Load env: prefer .env, fallback to .env.production
require('dotenv').config({ path: fs.existsSync(envPath) ? envPath : prodEnvPath });

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('Missing required env (JWT_SECRET, MONGODB_URI). Set them in server/.env or .env.production.');
  process.exit(1);
}

const MAX_TTL = parseInt(process.env.REVIEW_MAX_LINK_TTL_SECONDS || String(30 * 24 * 3600), 10); // 30 days default

const User = require('../models/User');
const ReviewToken = require('../models/ReviewToken');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--email') out.email = args[++i];
    else if (a === '--ttl') out.ttl = parseInt(args[++i], 10);
    else if (a === '--userId') out.userId = args[++i];
  }
  return out;
}

async function main() {
  const { email, userId } = parseArgs();
  let { ttl } = parseArgs();
  if (!ttl || Number.isNaN(ttl)) ttl = parseInt(process.env.REVIEW_LINK_TTL_SECONDS || '3600', 10);
  if (ttl < 60) ttl = 60;
  if (ttl > MAX_TTL) ttl = MAX_TTL;

  if (!email && !userId) {
    // default ephemeral email if none provided
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    console.warn('No --email or --userId provided. Using default email.');
    // Use example.com to avoid sending real mail unintentionally
    defaultEmail = `play-review-${ts}@example.com`;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  let user;
  try {
    if (userId) {
      user = await User.findById(userId);
      if (!user) throw new Error('User not found by userId');
    } else {
      const targetEmail = email || defaultEmail;
      user = await User.findOne({ email: targetEmail });
      if (!user) {
        // Create a dedicated review user
        const randomPassword = crypto.randomBytes(12).toString('base64url');
        user = new User({
          name: 'Play Reviewer',
          email: targetEmail,
          password: randomPassword,
          role: 'staff',
          isActive: true,
        });
        await user.save();
      } else if (!user.isActive) {
        // ensure active prior to link generation; it will be deactivated on redemption
        user.isActive = true;
        await user.save();
      }
    }

    const jti = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await ReviewToken.create({ jti, userId: user._id, expiresAt });

    const payload = { sub: String(user._id), jti, typ: 'review' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ttl });

    const baseUrl = (process.env.PUBLIC_BASE_URL || process.env.CLIENT_BASE_URL || '').replace(/\/$/, '');
    const link = baseUrl ? `${baseUrl}/review-access?token=${encodeURIComponent(token)}` : `/review-access?token=${encodeURIComponent(token)}`;

    const out = {
      link,
      expiresInSeconds: ttl,
      user: { id: String(user._id), email: user.email, role: user.role },
      note: 'This link is single-use. On first redemption, the user is deactivated and attempts to reuse will fail.'
    };

    console.log(JSON.stringify(out, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error('Failed to generate review link:', e.message);
  process.exit(1);
});