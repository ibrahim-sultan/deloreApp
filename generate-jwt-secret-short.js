const crypto = require('crypto');

// Generate a secure 128-bit (16 bytes) random string for JWT_SECRET
const jwtSecret = crypto.randomBytes(16).toString('hex');

console.log('JWT_SECRET=' + jwtSecret);
