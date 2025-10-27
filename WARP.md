# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Delore is a full-stack staff management application with a React frontend and Node.js/Express backend. It features role-based access control with two user types: **Staff** (document uploads, task management, payment viewing) and **Admin** (staff oversight, task assignment, payment management, messaging).

**Tech Stack**: React 18 + React Router | Node.js/Express | MongoDB/Mongoose | JWT auth + bcrypt | Multer file uploads

## Development Commands

### Initial Setup
```powershell
# From root directory - Install all dependencies
cd server; npm install; cd ../client; npm install; cd ..

# Configure environment
cd server
copy .env.example .env
# Edit .env: Set MONGODB_URI and JWT_SECRET
```

### Development Mode (Run in separate terminals)
```powershell
# Terminal 1: Start backend (from server/)
cd server
npm run dev  # Runs on http://localhost:5000 with nodemon

# Terminal 2: Start frontend (from client/)
cd client
npm start    # Runs on http://localhost:3000, proxies API to :5000
```

### Production Build & Run
```powershell
# From server/ directory
npm run build  # Installs client deps + builds React app to client/build/
npm start      # Serves built React app + API on :5000
```

### Database Utilities
```powershell
# From root directory
node test-db-connection.js    # Verify MongoDB connection
node create-admin-user.js     # Create admin user (default: admin@delore.com)
node test-registration.js     # Test staff registration flow
```

## Architecture

### Backend (`server/`)
```
server.js              # Express app: CORS, routes, static file serving, MongoDB connection w/ retry
models/                # Mongoose schemas: User, Task, Document, Payment, Message, Client, ActivityLog
routes/                # API handlers: auth, admin, documents, tasks, payments, messages, clients
middleware/auth.js     # JWT verification: auth() for all users, adminAuth() for admin-only routes
uploads/               # File storage for documents and payment receipts
```

**Critical**: `server.js` validates required env vars (`JWT_SECRET`, `MONGODB_URI`) on startup and exits if missing.

### Frontend (`client/src/`)
```
App.js                 # Routing: ProtectedRoute, PublicRoute, role-based dashboard redirect
context/AuthContext.js # Global auth: JWT in localStorage, axios defaults, login/logout/register
components/
  Admin/               # Dashboard, staff/task/document/payment/message management, client mgmt
  Staff/               # Dashboard, document upload, task creation, payment/message viewing
  Auth/                # Login, Register (admin-only staff creation), PasswordChange
  Common/              # ErrorBoundary, LoadingSpinner
  Layout/              # Sidebar navigation
  Navbar/              # Top navigation bar
```

**Proxy**: Client dev server (`localhost:3000`) proxies `/api/*` to backend (`localhost:5000`).

### Key API Routes
```
/api/auth/login, /register, /me              # Authentication
/api/admin/dashboard, /staff, /assign-task   # Admin operations
/api/documents/upload, /my-documents         # Document management
/api/tasks/create, /my-tasks, /clock-in      # Task & time tracking
/api/payments/upload, /my-payments           # Payment receipts
/api/messages/send, /inbox                   # Messaging system
/api/clients/*                               # Client management
/api/health                                  # Health check endpoint
```

## Database Models (Mongoose Schemas)

### User (`models/User.js`)
- **Roles**: `staff` | `admin` (enum, default: `staff`)
- **Password**: bcrypt hash via `pre('save')` hook; `comparePassword()` method for login
- **Temporary passwords**: `isTemporaryPassword` boolean + `temporaryPasswordExpiry` date for forced password change
- **Status**: `isActive` boolean for account management

### Task (`models/Task.js`)
- **Title validation**: Must include hours as numbers (e.g., "Project Work 8" or "Task 4.5")
- **Relationships**: `createdBy` (User), `assignedTo` (User), `client` (Client) - all refs
- **Status flow**: `pending` → `assigned` → `in-progress` → `completed` | `cancelled`
- **Time tracking**: `clockInTime`, `clockOutTime`, `scheduledStartTime`, `scheduledEndTime`
- **Admin override**: `adminOverride.clockIn/clockOut` booleans + `reason` for audit trail
- **Geolocation**: `coordinates` (lat/lng), `contactPerson` for admin-assigned tasks
- **Attachments**: File metadata fields for task-related documents

### Document (`models/Document.js`)
- **Expiry tracking**: `expiryDate` required, `isExpired` boolean updated via `pre('save')` hook
- **Virtual**: `expired` getter compares `expiryDate` to current date
- **Metadata**: `originalName`, `filename`, `filePath`, `fileSize`, `mimeType`

### Client (`models/Client.js`)
- Simple schema: `name`, `address`, `contactNumber`, `addedBy` (User ref)

### Payment & Message Models
- **Payment**: Staff payment records uploaded by admin
- **Message**: Admin-to-staff messaging with read/unread status
- **ActivityLog**: Audit trail for system actions

## Critical Development Patterns

### Authentication Flow
1. **JWT lifecycle**: Stored in `localStorage`, set as axios default header in `AuthContext`
2. **Middleware chain**: `auth()` verifies token → `adminAuth()` additionally checks `user.role === 'admin'`
3. **Protected routes**: `<ProtectedRoute>` in `App.js` checks `isAuthenticated`, redirects to `/login` if false
4. **Token invalidation**: `auth()` middleware returns 401 if user not found → client clears localStorage

### File Uploads (Multer)
- **Storage**: Multer `diskStorage` with unique filenames (`Date.now() + originalname`)
- **Validation**: File type whitelist + size limits (10MB documents, 5MB payments)
- **Metadata**: Always store `originalName`, `filename`, `filePath`, `fileSize`, `mimeType` in DB
- **Serving**: Static route `/uploads` serves files from `server/uploads/`

### Error Handling Strategy
- **Frontend**: `<ErrorBoundary>` wraps components, catches React errors, shows fallback UI
- **Backend**: Try-catch in all async route handlers, return `{ message: 'error' }` with status codes
- **Validation**: Use `express-validator` for input validation, return 400 with validation errors
- **MongoDB errors**: Catch timeout/connection errors separately, return 500 with retry message

### Admin Override System (Tasks)
- **Clock-in/out override**: Admin can manually set times if staff forgets
- **Audit trail**: `adminOverride.clockIn/clockOut` booleans + `reason` text field
- **Use case**: Handle edge cases where staff can't clock in/out due to technical issues

## Environment Variables

**Required** in `server/.env` (copy from `.env.example`):
```bash
MONGODB_URI=mongodb://localhost:27017/delore  # Local dev or MongoDB Atlas URI
JWT_SECRET=<generate-with-node-generate-jwt-secret.js>  # MUST be random in production
PORT=5000                                      # Backend port
NODE_ENV=development                           # development | production
```

**Optional** (email notifications, not currently active):
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

**Startup validation**: `server.js` exits with error if `JWT_SECRET` or `MONGODB_URI` missing.

## Deployment (Render)

**Current deployment**: https://deloreapp.onrender.com

**Build process** (automated via `server/package.json`):
1. `npm run build` → installs client deps + builds React to `client/build/`
2. `npm start` → serves static React build + API on same port

**Initial admin setup**: Run `node create-admin-user.js` or visit `/api/auth/create-admin` (one-time)

**Health check**: `/api/health` returns `{ message: 'Delore server is running!' }`

See `DEPLOYMENT.md` for full instructions.
