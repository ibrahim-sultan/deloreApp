# Staff Registration Testing and Troubleshooting Guide

This guide provides instructions for testing the staff registration functionality and troubleshooting common issues.

## Prerequisites

Before testing, ensure you have:

1. Node.js installed (version 14 or higher)
2. MongoDB installed and running
3. All server and client dependencies installed

## Testing Registration with the Test Script

A test script has been provided to verify the registration functionality:

1. Install axios if not already installed:
   ```bash
   npm install axios
   ```

2. Ensure the server is running:
   ```bash
   cd server
   npm start
   ```

3. Run the test script:
   ```bash
   node test-registration.js
   ```

## Manual Testing via Frontend

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. In a new terminal, start the client:
   ```bash
   cd client
   npm start
   ```

3. Navigate to http://localhost:3000/register
4. Fill out the registration form with valid information
5. Submit the form and observe the result

## Common Issues and Solutions

### 1. "Server error during registration" or "Database error during registration"

**Cause:** MongoDB is not running or connection configuration is incorrect.

**Solution:**
- Ensure MongoDB is running:
  - Windows: Run `mongod` command
  - Mac: Run `brew services start mongodb-community`
  - Linux: Run `sudo systemctl start mongod`
- Verify the MONGODB_URI in `server/.env` is correct
- Check that the MongoDB service is accessible at the specified URI

### 2. "User already exists with this email"

**Cause:** Attempting to register with an email that's already in the database.

**Solution:**
- Use a different email address
- Clear the database collection if testing

### 3. "Validation error" messages

**Cause:** Form data doesn't meet validation requirements.

**Solution:**
- Ensure name is at least 2 characters
- Use a valid email format
- Password must be at least 6 characters

### 4. Network or Proxy Errors

**Cause:** Client cannot connect to the server.

**Solution:**
- Ensure both client and server are running
- Verify the proxy setting in `client/package.json` points to the correct server URL
- Check that ports 3000 (client) and 5000 (server) are not blocked by firewall

## Clearing Test Data

To clear test data from the database:

1. Connect to MongoDB:
   ```bash
   mongo
   ```

2. Switch to the delore_db database:
   ```bash
   use delore_db
   ```

3. Clear the users collection:
   ```bash
   db.users.deleteMany({})
   ```

## Verifying Database Connection

To verify that the server can connect to MongoDB:

1. Check the server console output for "Connected to MongoDB" message
2. Look for any connection error messages
3. Verify the MONGODB_URI in the server logs

## Additional Debugging

If issues persist:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed:
   ```bash
   cd server && npm install
   cd client && npm install
   ```
4. Check for any deprecation warnings that might indicate needed updates