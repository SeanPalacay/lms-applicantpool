// src/pages/shared/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import './styles/NotFound.css';

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

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-icon">
          <AlertTriangle size={80} />
        </div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Sorry, the page you are looking for doesn't exist or has been moved.</p>
        
        <div className="action-buttons">
          <button className="action-button secondary" onClick={goBack}>
            <ArrowLeft size={16} className="icon-inline" /> Go Back
          </button>
          <Link to={getDashboardPath()} className="action-button primary">
            <Home size={16} className="icon-inline" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;