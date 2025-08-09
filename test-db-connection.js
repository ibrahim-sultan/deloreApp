const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env.production' });

// Test MongoDB connection with the same options as server.js
const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase server selection timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });
    
    console.log('MongoDB Connected Successfully:', conn.connection.host);
    console.log('Connection test passed!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (err) {
    console.error('MongoDB Connection Test Failed:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
  }
};

testConnection();