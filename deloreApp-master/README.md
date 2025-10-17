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
Create a `.env` file in the server directory with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delore
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

### 5. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections.

### 6. Create Admin User
Since only staff can register through the UI, you'll need to create an admin user manually in MongoDB:

```javascript
// Connect to MongoDB and run this in MongoDB shell or MongoDB Compass
use delore
db.users.insertOne({
  name: "Admin User",
  email: "admin@delore.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

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

## Default Login Credentials

### Admin Login
- **Email**: admin@delore.com
- **Password**: password

### Staff Registration
Staff members can register through the registration page at `/register`

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

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- File type validation
- Input validation and sanitization

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
