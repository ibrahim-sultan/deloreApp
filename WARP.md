# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Delore is a full-stack staff management application built with:
- **Frontend**: React 18 with React Router for navigation
- **Backend**: Node.js/Express with MongoDB and Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing
- **File Handling**: Multer for document and image uploads

The app has two main user types:
- **Staff**: Can upload documents, create tasks, view payments, and receive messages
- **Admin**: Manages staff, assigns tasks, uploads payments, sends messages, and has oversight of all data

## Development Commands

### Initial Setup
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install

# Set up environment variables
cd ../server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Development Mode
```bash
# Start server (from server directory)
npm run dev
# Server runs on http://localhost:5000

# Start client (from client directory, in new terminal)
npm start  
# Client runs on http://localhost:3000
```

### Production Build
```bash
# Build frontend (from server directory)
npm run build

# Start production server
npm start
```

### Testing & Database
```bash
# Test database connection
node test-db-connection.js

# Create admin user (after server is running)
node create-admin-user.js

# Test user registration
node test-registration.js
```

## Architecture

### Backend Structure (`server/`)
- **`server.js`**: Main Express server with middleware and route setup
- **`models/`**: Mongoose schemas for User, Task, Document, Payment, Message
- **`routes/`**: API route handlers for auth, admin, documents, tasks, payments, messages
- **`middleware/`**: Authentication middleware (`auth.js`) for protected routes
- **`uploads/`**: File storage directory for documents and payment receipts

### Frontend Structure (`client/src/`)
- **`App.js`**: Main routing and authentication flow
- **`context/AuthContext.js`**: Global authentication state management
- **`components/`**:
  - **`Admin/`**: Admin dashboard, staff management, document oversight, task assignment, payment management, messaging
  - **`Staff/`**: Staff dashboard, document uploads, task management, payment viewing, messages
  - **`Auth/`**: Login and registration components
  - **`Common/`**: Reusable components (LoadingSpinner, ErrorBoundary, Navbar)

### Key API Endpoints
- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Admin**: `/api/admin/dashboard`, `/api/admin/assign-task`, `/api/admin/staff-reports`
- **Documents**: `/api/documents/upload`, `/api/documents/my-documents`
- **Tasks**: `/api/tasks/create`, `/api/tasks/my-tasks`, `/api/tasks/clock-in`, `/api/tasks/clock-out`
- **Payments**: `/api/payments/upload`, `/api/payments/my-payments`
- **Messages**: `/api/messages/send`, `/api/messages/inbox`

## Database Models

### User Model
- Handles both staff and admin roles
- Includes temporary password functionality for new staff
- Password hashing with pre-save middleware

### Task Model  
- Admin-created tasks assigned to staff members
- Includes location coordinates, time tracking, and file attachments
- Status tracking: assigned → in-progress → completed
- Clock-in/clock-out functionality with admin override capabilities

### Document Model
- Staff-uploaded documents with expiry date tracking
- File metadata and automatic expiry status updates
- Admin can view and delete documents

### Payment/Message Models
- Admin-to-staff communication and payment tracking
- Read/unread status for messages

## Development Patterns

### Authentication Flow
1. JWT tokens stored in localStorage
2. AuthContext provides global auth state
3. Protected routes use `adminAuth` or `staffAuth` middleware
4. Automatic token refresh on API calls

### File Upload Pattern
- Multer middleware for file handling
- Separate upload directories for different file types
- File validation by type and size
- Original filename preservation with unique server filenames

### Error Handling
- ErrorBoundary components prevent full app crashes
- Consistent API error response format
- Client-side error states and user feedback
- Server-side validation with express-validator

### Admin Override System
- Admins can override staff clock-in/clock-out for tasks
- All overrides logged with reasons
- Comprehensive audit trail for task management

## Common Development Tasks

### Adding New API Endpoints
1. Create route handler in appropriate `/routes/*.js` file
2. Add middleware for authentication if needed
3. Include input validation with express-validator
4. Update frontend API calls in relevant components

### Database Operations
- Use async/await pattern for all database operations
- Include proper error handling and validation
- Use Mongoose populate() for referenced documents
- Implement aggregation pipelines for complex queries

### Frontend Component Development  
- Use functional components with React hooks
- Implement loading states and error boundaries
- Follow existing CSS class naming conventions
- Include proper prop validation and error handling

## Environment Variables

Required in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/delore
JWT_SECRET=your-jwt-secret-key-change-in-production
PORT=5000
NODE_ENV=development
```

Optional for email notifications:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

## Deployment

The application is configured for Render deployment with:
- Automatic build scripts in package.json
- Environment variable management
- Health check endpoint (`/api/health`)
- Production-ready MongoDB Atlas configuration

See `DEPLOYMENT.md` for detailed deployment instructions.