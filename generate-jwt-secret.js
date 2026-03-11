const crypto = require('crypto');

// Generate a secure 256-bit (32 bytes) random string for JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('JWT_SECRET=' + jwtSecret);
console.log('Copy this value to your .env file');
