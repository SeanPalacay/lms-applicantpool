import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/login/Login';
import Register from './pages/auth/register/Register';
import AdminDashboard from './pages/admin/dashboard/AdminDashboard';
import ApplicantDashboard from './pages/applicant/dashboard/ApplicantDashboard';
import TraineeDashboard from './pages/trainee/dashboard/TraineeDashboard';
import TrainerDashboard from './pages/trainer/dashboard/TrainerDashboard';
import DashboardLayout from './components/shared/DashboardLayout';

// Protected route component
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (role && userRole !== role) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'administrator') return <Navigate to="/administrator-dashboard" />;
    if (userRole === 'trainer') return <Navigate to="/trainer-dashboard" />;
    if (userRole === 'trainee') return <Navigate to="/trainee-dashboard" />;
    if (userRole === 'applicant') return <Navigate to="/applicant-dashboard" />;
    return <Navigate to="/login" />;
  }
  
  return children;
};

const DashboardWrapper = ({ component: Component, title, role }) => {
  return (
    <DashboardLayout title={title} role={role}>
      <Component />
    </DashboardLayout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Administrator routes */}
      <Route 
        path="/administrator-dashboard" 
        element={
          <ProtectedRoute role="administrator">
            <DashboardWrapper 
              component={AdminDashboard} 
              title="Administrator Dashboard" 
              role="administrator" 
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes - for backward compatibility */}
      <Route 
        path="/admin-dashboard" 
        element={<Navigate to="/administrator-dashboard" />} 
      />
      
      {/* Applicant routes */}
      <Route 
        path="/applicant-dashboard" 
        element={
          <ProtectedRoute role="applicant">
            <DashboardWrapper 
              component={ApplicantDashboard} 
              title="Applicant Dashboard" 
              role="applicant" 
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Trainee routes */}
      <Route 
        path="/trainee-dashboard" 
        element={
          <ProtectedRoute role="trainee">
            <DashboardWrapper 
              component={TraineeDashboard} 
              title="Trainee Dashboard" 
              role="trainee" 
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Trainer routes */}
      <Route 
        path="/trainer-dashboard" 
        element={
          <ProtectedRoute role="trainer">
            <DashboardWrapper 
              component={TrainerDashboard} 
              title="Trainer Dashboard" 
              role="trainer" 
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin sub-routes */}
      <Route 
        path="/admin/user-management" 
        element={
          <ProtectedRoute role="administrator">
            <DashboardWrapper 
              component={() => <h2>User Management</h2>} 
              title="User Management" 
              role="administrator" 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute role="administrator">
            <DashboardWrapper 
              component={() => <h2>Assessment Reports</h2>} 
              title="Assessment Reports" 
              role="administrator" 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/applicant-dashboard" 
        element={
          <ProtectedRoute role="administrator">
            <DashboardWrapper 
              component={() => <h2>Applicant Pooling</h2>} 
              title="Applicant Pooling" 
              role="administrator" 
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/profile" 
        element={
          <ProtectedRoute role="administrator">
            <DashboardWrapper 
              component={() => <h2>Profile</h2>} 
              title="Profile" 
              role="administrator" 
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;