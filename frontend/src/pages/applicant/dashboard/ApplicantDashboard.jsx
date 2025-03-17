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
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      {error && <AlertBanner type="error" message={error} />}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Welcome, {user.full_name}</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Track your applications and stay updated on your application status.</p>
      </div>

      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Alerts & Notifications</h2>
            <div style={{ height: '1px', backgroundColor: 'var(--medium-gray)', marginTop: '8px' }}></div>
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
                  backgroundColor: alert.type === 'warning' ? 'var(--warning-color)' : 'var(--info-color)', 
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
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={20} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>My Applications</h3>
              <Link 
                to="/applicant/applications" 
                style={{ marginLeft: 'auto', fontSize: '14px', color: 'var(--primary-color)', textDecoration: 'none' }}
              >
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {myApplications.length > 0 ? (
              myApplications.map((app) => (
                <div key={app.application_id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{app.program_title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="var(--text-secondary)" />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Job Role: {app.job_role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={14} color="var(--text-secondary)" />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Department: {app.department}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} color="var(--text-secondary)" />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Status: <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          backgroundColor: app.status.toLowerCase() === 'pending' ? 'var(--warning-color)' : 
                                        app.status.toLowerCase() === 'approved' ? 'var(--success-color)' : 
                                        app.status.toLowerCase() === 'rejected' ? 'var(--danger-color)' : 'var(--info-color)', 
                          color: 'white' 
                        }}>
                          {app.status}
                        </span>
                      </span>
                    </div>
                    {app.evaluation_score && (
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Evaluation Score: {app.evaluation_score}
                      </div>
                    )}
                    {app.fst_score && (
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        FST Score: {app.fst_score}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={12} color="var(--text-secondary)" />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    {app.updated_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={12} color="var(--text-secondary)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/applicant/applications/${app.application_id}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '14px', 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none', 
                      marginTop: '12px' 
                    }}
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>You have not submitted any applications yet.</p>
                <Link 
                  to="/applicant/programs" 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '14px', 
                    fontWeight: '500' 
                  }}
                >
                  Apply for a Program
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={20} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Notifications</h3>
              <Link 
                to="/applicant/notifications" 
                style={{ marginLeft: 'auto', fontSize: '14px', color: 'var(--primary-color)', textDecoration: 'none' }}
              >
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  style={{ 
                    marginBottom: '16px', 
                    paddingBottom: '16px', 
                    borderBottom: '1px solid var(--medium-gray)' 
                  }}
                >
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{notification.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{notification.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={12} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>No recent notifications.</p>
            )}
          </div>
        </div>

        {/* Resources Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Resources</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link 
                to="/applicant/resources/faq" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Frequently Asked Questions</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Find answers to common questions about the application process.</p>
              </Link>
              <Link 
                to="/applicant/resources/tips" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Application Tips</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Get tips on how to improve your application and stand out.</p>
              </Link>
              <Link 
                to="/applicant/resources/requirements" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Program Requirements</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Learn about the requirements for different programs.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Link 
          to="/applicant/programs" 
          style={{ 
            padding: '12px 24px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '16px', 
            fontWeight: '500', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Briefcase size={16} /> Apply for a Program
        </Link>
      </div>
    </div>
  );
};

export default ApplicantDashboard;