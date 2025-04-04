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

const ApplicantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  // Add a state to store the most recent applications from the job_applications table
  const [recentApplications, setRecentApplications] = useState([]);

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

        // Fetch dashboard data from the main dashboard API
        const data = await applicantService.getDashboardData();
        setDashboardData(data);

        // Separately fetch the most recent job applications
        try {
          const applicationData = await applicantService.getUserApplications();
          setRecentApplications(applicationData);
        } catch (appError) {
          console.error('Error fetching user applications:', appError);
          // Don't stop the dashboard from loading if this fails
        }
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

  // Combine applications from both sources, prioritizing the newer job_applications data
  const combinedApplications = [...recentApplications, ...myApplications];

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {error && <AlertBanner type="error" message={error} />}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>Welcome, {user.full_name}</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Track your applications and stay updated on your application status.</p>
      </div>

      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Alerts & Notifications</h2>
            <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginTop: '8px' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  backgroundColor: alert.type === 'warning' ? '#f59e0b' : '#3b82f6', 
                  color: 'white' 
                }}
              >
                <div>
                  {alert.type === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{alert.title || 'Alert'}</h4>
                  <p style={{ fontSize: '14px' }}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Applications Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={20} color="#64748b" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>My Applications</h3>
              <Link 
                to="/applicant/applications" 
                style={{ marginLeft: 'auto', fontSize: '14px', color: '#1E88E5', textDecoration: 'none' }}
              >
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {recentApplications.length > 0 ? (
              // Display applications from job_applications table
              recentApplications.slice(0, 3).map((app) => (
                <div key={app.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    {app.position_name || "Job Application"}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>Position ID: {app.position_id}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>Department: {app.department || "N/A"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Status: <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          backgroundColor: app.status?.toLowerCase() === 'pending' ? '#f59e0b' : 
                                        app.status?.toLowerCase() === 'approved' ? '#10b981' : 
                                        app.status?.toLowerCase() === 'rejected' ? '#ef4444' : '#3b82f6', 
                          color: 'white' 
                        }}>
                          {app.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={12} color="#64748b" />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    {app.updated_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={12} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/applicant/applications/${app.id}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '14px', 
                      color: '#1E88E5', 
                      textDecoration: 'none', 
                      marginTop: '12px' 
                    }}
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              ))
            ) : myApplications.length > 0 ? (
              // Fallback to original applications data if available
              myApplications.slice(0, 3).map((app) => (
                <div key={app.application_id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{app.pool_name || "Application"}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>Job Role: {app.job_role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>Department: {app.department}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Status: <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          backgroundColor: app.status?.toLowerCase() === 'pending' ? '#f59e0b' : 
                                        app.status?.toLowerCase() === 'approved' ? '#10b981' : 
                                        app.status?.toLowerCase() === 'rejected' ? '#ef4444' : '#3b82f6', 
                          color: 'white' 
                        }}>
                          {app.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={12} color="#64748b" />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>You have not submitted any applications yet.</p>
                <Link 
                  to="/applicant/job-roles" 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    backgroundColor: '#1E88E5', 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '14px',
                    display: 'inline-block'
                  }}
                >
                  Find Jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={20} color="#64748b" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Recent Notifications</h3>
              <Link 
                to="/applicant/notifications" 
                style={{ marginLeft: 'auto', fontSize: '14px', color: '#1E88E5', textDecoration: 'none' }}
              >
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  style={{ 
                    marginBottom: '16px', 
                    paddingBottom: '16px', 
                    borderBottom: '1px solid #e2e8f0' 
                  }}
                >
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{notification.title}</h4>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{notification.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={12} color="#64748b" />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>No recent notifications.</p>
            )}
          </div>
        </div>

        {/* Resources Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} color="#64748b" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Resources</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link 
                to="/applicant/job-roles" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Available Positions</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Browse all open positions and submit your application.</p>
              </Link>
              <Link 
                to="/applicant/applications" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>My Applications</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>View all your submitted applications and their status.</p>
              </Link>
              <Link 
                to="/applicant/profile" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>My Profile</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Update your profile information and preferences.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Link 
          to="/applicant/job-roles" 
          style={{ 
            padding: '12px 24px', 
            borderRadius: '4px', 
            backgroundColor: '#1E88E5', 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '16px', 
            fontWeight: '500', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Briefcase size={16} /> Apply for a Position
        </Link>
      </div>
    </div>
  );
};

export default ApplicantDashboard;