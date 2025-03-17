import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Bell, 
  AlertTriangle, 
  Info, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  ChevronRight 
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import applicantService from '../../../services/applicantService';
import './styles/ApplicantDashboard.css';

const ApplicantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // This mirrors the structure from the server
  const [dashboardData, setDashboardData] = useState({
    user: {
      full_name: '',
      email: '',
      status: ''
    },
    myApplications: [],
    notifications: [],
    alerts: []
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please login to access the Applicant Dashboard.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'applicant') {
          setError('You do not have permission to access the applicant dashboard.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
          return;
        }

        const data = await applicantService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching applicant dashboard data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) return <LoadingSpinner />;

  const { user, myApplications, notifications, alerts } = dashboardData;

  return (
    <div className="applicant-dashboard">
      {error && <AlertBanner type="error" message={error} />}

      <div className="welcome-section">
        <h1>Welcome, {user.full_name}</h1>
        <p>Track your applications and stay updated on your application status.</p>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2>Alerts & Notifications</h2>
            <div className="header-line"></div>
          </div>
          <div className="alerts-container">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.type || 'info'}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="alert-content">
                  <h4>{alert.title || 'Alert'}</h4>
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Applications Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <Briefcase size={20} />
            </div>
            <div className="header-content">
              <h3>My Applications</h3>
              <Link to="/applicant/applications" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {myApplications.length > 0 ? (
              myApplications.map((app) => (
                <div key={app.application_id} className="application-item">
                  <h4>{app.program_title}</h4>
                  <div className="application-details">
                    <div className="detail-item">
                      <User size={14} className="icon-inline" />
                      <span>Job Role: {app.job_role}</span>
                    </div>
                    <div className="detail-item">
                      <Building size={14} className="icon-inline" />
                      <span>Department: {app.department}</span>
                    </div>
                    <div className="detail-item">
                      <FileText size={14} className="icon-inline" />
                      <span>Status: <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></span>
                    </div>
                    {app.evaluation_score && (
                      <div className="detail-item">
                        <span>Evaluation Score: {app.evaluation_score}</span>
                      </div>
                    )}
                    {app.fst_score && (
                      <div className="detail-item">
                        <span>FST Score: {app.fst_score}</span>
                      </div>
                    )}
                  </div>
                  <div className="application-dates">
                    <div className="date-item">
                      <Calendar size={12} className="icon-inline" />
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    {app.updated_at && (
                      <div className="date-item">
                        <Calendar size={12} className="icon-inline" />
                        <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Link to={`/applicant/applications/${app.application_id}`} className="view-details-link">
                    View Details <ChevronRight size={14} className="icon-inline" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>You have not submitted any applications yet.</p>
                <div className="card-actions">
                  <Link to="/applicant/programs" className="action-button primary">
                    Apply for a Program
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <Bell size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Notifications</h3>
              <Link to="/applicant/notifications" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className={`notification-item notif-${notification.type}`}>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <div className="notification-time">
                      <Calendar size={12} className="icon-inline" /> {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No recent notifications.</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <FileText size={20} />
            </div>
            <div className="header-content">
              <h3>Resources</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="resource-list">
              <Link to="/applicant/resources/faq" className="resource-item">
                <h4>Frequently Asked Questions</h4>
                <p>Find answers to common questions about the application process.</p>
              </Link>
              <Link to="/applicant/resources/tips" className="resource-item">
                <h4>Application Tips</h4>
                <p>Get tips on how to improve your application and stand out.</p>
              </Link>
              <Link to="/applicant/resources/requirements" className="resource-item">
                <h4>Program Requirements</h4>
                <p>Learn about the requirements for different programs.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/applicant/programs" className="action-button primary">
          <Briefcase size={16} className="icon-inline" /> Apply for a Program
        </Link>
      </div>
    </div>
  );
};

export default ApplicantDashboard;