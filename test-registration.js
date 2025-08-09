// Test script for staff registration
// This script can be used to test the registration flow without the frontend

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Server URL
const TEST_USER = {
  name: 'Test Staff User',
  email: 'test.staff@example.com',
  password: 'password123'
};

async function testRegistration() {
  console.log('Testing staff registration...\n');
  
  try {
    // Attempt to register a new staff user
    console.log('1. Attempting to register new staff user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
    
    console.log('   Registration successful!');
    console.log('   Response:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   User Name:', registerResponse.data.user.name);
    console.log('   User Email:', registerResponse.data.user.email);
    console.log('   User Role:', registerResponse.data.user.role);
    
    // Test login with the same credentials
    console.log('\n2. Attempting to login with the same credentials...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('   Login successful!');
    console.log('   Response:', loginResponse.data.message);
    console.log('   Token received:', !!loginResponse.data.token);
    
    console.log('\n✅ All tests passed! Registration and login are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
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
  }
}

// Run the test
testRegistration();