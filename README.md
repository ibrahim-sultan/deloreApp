# Delore - Staff Management Application

A full-stack React application for staff management with document upload, task creation, payment tracking, and messaging functionality.

## Features

### Staff Features
- **User Registration & Login**: Staff can register and login to their accounts
- **Document Management**: Upload documents with expiry dates and times
- **Task Creation**: Create tasks with title, description, location, arrival/departure times
- **Payment View**: View payment records uploaded by admin
- **Message Inbox**: Receive and read messages from admin

### Admin Features
- **Dashboard Overview**: View statistics and recent activities
- **Staff Management**: View all staff members and their activity
- **Document Oversight**: See all documents uploaded by staff
- **Task Monitoring**: View all tasks created by staff with hours tracking
- **Payment Management**: Upload payment receipts for staff
- **Messaging System**: Send messages to staff members

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Axios** for API calls
- **Custom CSS** for styling (no external UI frameworks)

## Project Structure

```
deloreApp/
├── server/                 # Backend code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── uploads/           # File upload directory
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   ├── App.js         # Main App component
│   │   └── index.js       # React entry point
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd deloreApp
```

### 2. Backend Setup
```bash
cd server
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory (never commit this file):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delore
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
# Optional email settings
EMAIL_USER=
EMAIL_PASS=
# Client base URL for password reset links
CLIENT_BASE_URL=http://localhost:3000
```
Also (optional) create `client/.env` with any client-side keys you need:
```env
# Example: used by MapPreview
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

### 5. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections.

### 6. Admin Account Setup
For first-time setup, you can create an initial admin user via the server endpoint (only works when no admin exists):

- POST /api/auth/create-admin

Alternatively, create an admin directly in your database with a strong, unique password. Do not commit any credentials to the repository.

## Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

2. **Start the Frontend Development Server**:
```bash
cd client
npm start
# React app will run on http://localhost:3000
```

### Production Mode

1. **Build the Frontend**:
```bash
cd client
npm run build
```

2. **Start the Backend**:
```bash
cd server
npm start
```

## Accounts

- Admin accounts are not publicly exposed. For initial setup, use the endpoint noted above or create an admin in the database with a secure password.
- Staff members can register through the registration page at `/register` (if enabled by your deployment policies).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Staff registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents/:id/download` - Download document

### Tasks
- `POST /api/tasks/create` - Create task
- `GET /api/tasks/my-tasks` - Get user's tasks
- `PUT /api/tasks/:id` - Update task

### Payments (Admin only)
- `POST /api/payments/upload` - Upload payment receipt
- `GET /api/payments/all` - Get all payments
- `GET /api/payments/my-payments` - Get user's payments

### Messages
- `POST /api/messages/send` - Send message (Admin only)
- `GET /api/messages/inbox` - Get messages

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/staff` - Get all staff
- `GET /api/admin/staff/:id` - Get staff details

## File Upload Limits

- **Documents**: 10MB max, supports PDF, DOC, DOCX, TXT, images
- **Payment Receipts**: 5MB max, supports PDF and images

## Security Notes

- Environment files are ignored by Git (see .gitignore). Do not commit secrets.
- Rotate any secrets that were previously committed (e.g., database passwords, JWT secrets).
- JWT-based authentication; passwords hashed with bcrypt; role-based access control.
- Avoid logging credentials or full connection strings in production logs.
- Validate and sanitize all inputs; validate file types and sizes for uploads.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please contact the development team.
