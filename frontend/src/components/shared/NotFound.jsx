import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const userRole = localStorage.getItem('userRole') || '';

  const getDashboardPath = () => {
    switch (userRole) {
      case 'administrator':
        return '/administrator-dashboard';
      case 'trainer':
        return '/trainer-dashboard';
      case 'trainee':
        return '/trainee-dashboard';
      case 'applicant':
        return '/applicant-dashboard';
      default:
        return '/login';
    }
  };

  // Main container styles
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc', // Light gray background
    padding: '20px',
    textAlign: 'center',
  };

  // Content container styles
  const contentStyle = {
    maxWidth: '500px',
    width: '100%',
    padding: '40px',
    backgroundColor: '#ffffff', // White background
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow
  };

  // Error icon styles
  const iconStyle = {
    color: '#ef4444', // Red color for the icon
    marginBottom: '20px',
  };

  // Heading styles
  const headingStyle = {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1e293b', // Dark gray color
    margin: '10px 0',
  };

  // Subheading styles
  const subheadingStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#475569', // Medium gray color
    margin: '10px 0',
  };

  // Paragraph styles
  const paragraphStyle = {
    fontSize: '16px',
    color: '#64748b', // Light gray color
    margin: '20px 0',
  };

  // Action buttons container styles
  const actionButtonsStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '30px',
  };

  // Button base styles
  const buttonBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  };

  // Secondary button styles (Go Back)
  const secondaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#e2e8f0', // Light gray background
    color: '#1e293b', // Dark gray text
  };

  // Primary button styles (Back to Dashboard)
  const primaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#3b82f6', // Blue background
    color: '#ffffff', // White text
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={iconStyle}>
          <AlertTriangle size={80} />
        </div>
        <h1 style={headingStyle}>404</h1>
        <h2 style={subheadingStyle}>Page Not Found</h2>
        <p style={paragraphStyle}>
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div style={actionButtonsStyle}>
          <button style={secondaryButtonStyle} onClick={goBack}>
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to={getDashboardPath()} style={primaryButtonStyle}>
            <Home size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;