# Fix Proxy Issues and Deprecation Warnings

## Issues Identified:
1. Port mismatch: Client proxy points to 5001, server runs on 5000
2. Server might not be running
3. Deprecation warnings from Node.js dependencies

## Steps to Fix:

### 1. Fix Port Mismatch
- Update client/package.json proxy from 5001 to 5000
- Ensure server runs on consistent port

### 2. Start Server First
- Install server dependencies
- Start MongoDB service
- Start server on port 5000

### 3. Update Dependencies
- Update Node.js to latest LTS
- Update package dependencies to fix deprecation warnings

### 4. Add Error Handling
- Add better error handling for proxy requests
- Add fallback for favicon.ico requests
