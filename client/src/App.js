import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy';
import StaffDashboard from './components/Staff/StaffDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import TokenTest from './components/Admin/TokenTest';
import LoadingSpinner from './components/Common/LoadingSpinner';
import './App.css';

const NavbarWrapper = () => {
  const location = useLocation();
  const shouldShowNavbar = !location.pathname.startsWith('/staff');
  
  return shouldShowNavbar ? <Navbar /> : null;
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('ProtectedRoute: User is not admin, redirecting to staff dashboard');
    return <Navigate to="/staff/dashboard" replace />;
  }

  console.log('ProtectedRoute: Access granted for user:', user.name, 'Role:', user.role);
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Redirect admin to admin dashboard, staff to staff dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/staff/dashboard" replace />;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Router>
        <NavbarWrapper />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />

            <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />

            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* Public registration removed - only admins can create staff accounts */}
            
            <Route path="/staff/*" element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/*" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/test-token" element={
              <ProtectedRoute adminOnly={true}>
                <TokenTest />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
