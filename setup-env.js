#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', '.env.example');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the values in .env file before running the server.');
  } else {
    console.error('❌ .env.example file not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists.');
}

// Validate JWT_SECRET
require('dotenv').config({ path: envPath });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  console.warn('⚠️  WARNING: JWT_SECRET is using the default value!');
  console.warn('   Please update JWT_SECRET in your .env file to a secure random string.');
}
