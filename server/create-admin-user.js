// Script to create an admin user for the Delore application
// This script registers a user and then updates their role to 'admin' in the database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Server URL
const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@delore.com',
  password: 'admin123'
};

async function createAdminUser() {
  console.log('Creating admin user...\n');
  
  try {
    // First, try to register the user (this will create them as a staff member)
    console.log('1. Attempting to register admin user as staff...');
    let registerResponse;
    
    try {
      registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, ADMIN_USER);
      console.log('   Registration successful!');
      console.log('   User ID:', registerResponse.data.user.id);
      console.log('   User Name:', registerResponse.data.user.name);
      console.log('   User Email:', registerResponse.data.user.email);
      console.log('   Current Role:', registerResponse.data.user.role);
    } catch (error) {
      if (error.response && error.response.data.message === 'User already exists with this email') {
        console.log('   User already exists, proceeding to update role...');
        // We'll handle finding the user after connecting to the database
      } else {
        throw error;
      }
    }
    
    // Connect to MongoDB
    console.log('\n2. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('   Connected to MongoDB successfully!');
    
    // Find the user by email
    console.log('\n3. Finding user in database...');
    let user = await User.findOne({ email: ADMIN_USER.email });
    
    if (!user) {
      // If user doesn't exist, create them directly in the database
      console.log('   User not found, creating admin user directly in database...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_USER.password, salt);
      
      user = new User({
        name: ADMIN_USER.name,
        email: ADMIN_USER.email,
        password: hashedPassword,
        role: 'admin' // Create as admin directly
      });
      
      await user.save();
      console.log('   Admin user created successfully!');
    } else {
      // Update existing user's role to admin
      console.log('   User found, updating role to admin...');
      user.role = 'admin';
      await user.save();
      console.log('   User role updated to admin successfully!');
    }
    
    console.log('\n4. Verifying admin user...');
    const updatedUser = await User.findOne({ email: ADMIN_USER.email });
    console.log('   User ID:', updatedUser._id);
    console.log('   User Name:', updatedUser.name);
    console.log('   User Email:', updatedUser.email);
    console.log('   User Role:', updatedUser.role);
    console.log('   Account Status:', updatedUser.isActive ? 'Active' : 'Inactive');
    
    console.log('\n✅ Admin user created/updated successfully!');
    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Email:', ADMIN_USER.email);
    console.log('   Password:', ADMIN_USER.password);
    console.log('\nYou can now login to the admin dashboard using these credentials.');
    
    // Test login with the admin credentials
    console.log('\n5. Testing login with admin credentials...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
      });
      
      console.log('   Login successful!');
      console.log('   Token received:', !!loginResponse.data.token);
      console.log('   User Role:', loginResponse.data.user.role);
      
      if (loginResponse.data.user.role === 'admin') {
        console.log('   ✅ User has admin role as expected!');
      } else {
        console.log('   ⚠️  User does not have admin role. Manual database update may be needed.');
      }
    } catch (error) {
      console.error('   ❌ Login test failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to create admin user:');
    if (error.response) {
      // Server responded with error status
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('   No response received from server');
      console.error('   Please check if the server is running on', BASE_URL);
    } else {
      // Something else happened
      console.error('   Error:', error.message);
    }
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the script
createAdminUser();