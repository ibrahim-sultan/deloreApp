const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Set timezone to Toronto, Canada (EST/EDT)
process.env.TZ = 'America/Toronto';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  console.error('Copy .env.example to .env and update the values.');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app build directory
const buildPath = path.join(__dirname, '../client/build');
app.use(express.static(buildPath));

// Connect to MongoDB with retry logic and better options
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase server selection timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Please ensure MongoDB is running and the MONGODB_URI in .env is correct');
    // Do not log the full connection string to avoid leaking credentials
    if (process.env.MONGODB_URI) {
      const uriPreview = process.env.MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
      console.error('MONGODB_URI (redacted):', uriPreview);
    }

    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Initial connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/leave-requests', require('./routes/leaveRequests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/admin')); // Users routes handled by admin for now

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Delore server is running!' });
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error serving client application');
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
