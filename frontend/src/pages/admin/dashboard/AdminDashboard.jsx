import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, GraduationCap, AlertTriangle, 
  Info, CheckCircle, XCircle, Clock, Download, 
  RotateCcw, Server, BarChart2, UserPlus, 
  Plus, History, Layers, Settings, Calendar, Activity,
  Shield, Database, CheckCheck, HelpCircle, Briefcase,
  FileDown, Share2
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../../services/adminService';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalUsers: 0,
    usersByRole: { administrator: 0, trainer: 0, trainee: 0, applicant: 0 },
    activePrograms: 0,
    totalPrograms: 0,
    totalQuizzes: 0,
    pendingApplicants: 0,
    shortlistedApplicants: 0,
    hiredApplicants: 0,
    rejectedApplicants: 0,
    totalApplicants: 0,
    recentBackups: [],
    recentActivity: [],
    programActivity: [],
    recentApplicants: [],
    userActivity: [],
    inactiveUsers: 0,
    lastBackupDays: null,
    lastBackupStatus: null,
    alerts: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access the dashboard.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'administrator' && userRole !== 'admin') {
          setError('You do not have permission to access this dashboard.');
          setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
          return;
        }
        const data = await adminService.getDashboardData();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.message.includes('Authentication') || err.message.includes('login')) {
          setError('Authentication failed. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await adminService.createBackup();
      alert('Backup created successfully!');
      const data = await adminService.getDashboardData();
      setStats(data);
    } catch (err) {
      alert('Error creating backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (window.confirm('Are you sure you want to restore this backup? This will replace all current data.')) {
      try {
        setLoading(true);
        await adminService.restoreBackup(backupId);
        alert('Backup restored successfully!');
        const data = await adminService.getDashboardData();
        setStats(data);
      } catch (err) {
        alert('Error restoring backup: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadBackup = async (backupId) => {
    try {
      setLoading(true);
      await adminService.downloadBackup(backupId);
    } catch (err) {
      alert('Error downloading backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertIndex) => {
    const newAlerts = [...stats.alerts];
    newAlerts.splice(alertIndex, 1);
    setStats({ ...stats, alerts: newAlerts });
  };

  const navigateToApplicantPool = () => navigate('/admin/applicant-pools');
  const navigateToUserManagement = () => navigate('/admin/user-management');
  const navigateToPrograms = () => navigate('/admin/programs');
  const navigateToCreateProgram = () => navigate('/admin/programs/create');
  const navigateToCreateQuiz = () => navigate('/admin/quizzes/create');
  const navigateToReports = () => navigate('/admin/reports');
  const navigateToSettings = () => navigate('/admin/settings');
  const navigateToCreateUser = () => navigate('/admin/user-management/create');
  const navigateToExportUsers = () => navigate('/admin/user-management/export');
  const navigateToExportApplicants = () => navigate('/admin/applicants/export');

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px', // --spacing-md
        marginBottom: '32px' // --spacing-xl
      }}>
        {[
          { icon: Users, value: stats.activeUsers, label: 'Active Users', onClick: navigateToUserManagement },
          { icon: BookOpen, value: stats.activePrograms, label: 'Active Programs', onClick: navigateToPrograms },
          { icon: Briefcase, value: stats.pendingApplicants, label: 'Pending Applicants', onClick: navigateToApplicantPool },
          { icon: HelpCircle, value: stats.totalQuizzes, label: 'Total Quizzes', onClick: navigateToCreateQuiz }
        ].map((metric, index) => (
          <div key={index} onClick={metric.onClick} style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px', // --radius-lg
            padding: '24px', // --spacing-lg
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '16px', // --spacing-md
            transition: 'box-shadow 0.3s ease', // --transition-normal
            ':hover': { boxShadow: '0 10px 15px rgba(0,0,0,0.1)' } // --shadow-lg
          }}>
            <metric.icon size={24} style={{ color: '#1E88E5' }} /> {/* --primary-color */}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>{metric.value || 0}</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{metric.label}</p> {/* --text-secondary */}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {stats.alerts && stats.alerts.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px', // --radius-lg
          padding: '24px', // --spacing-lg
          marginBottom: '32px', // --spacing-xl
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)' // --shadow-md
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
            Alerts & Notifications
          </h2>
          {stats.alerts.map((alert, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: alert.type === 'warning' ? '#fff8e6' :
                              alert.type === 'info' ? '#E3F2FD' : // --primary-ultralight
                              alert.type === 'success' ? '#e6ffe6' : '#ffe6e6',
              borderRadius: '8px', // --radius-md
              padding: '16px', // --spacing-md
              marginBottom: '8px', // --spacing-sm
              borderLeft: `4px solid ${alert.type === 'warning' ? '#f39c12' : // --warning-color
                                     alert.type === 'info' ? '#1E88E5' : // --primary-color
                                     alert.type === 'success' ? '#2ecc71' : '#e74c3c'}` // --success-color, --danger-color
            }}>
              <div style={{ marginRight: '16px', color: alert.type === 'warning' ? '#f39c12' :
                                                    alert.type === 'info' ? '#1E88E5' :
                                                    alert.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
                {alert.type === 'warning' && <AlertTriangle size={20} />}
                {alert.type === 'info' && <Info size={20} />}
                {alert.type === 'success' && <CheckCircle size={20} />}
                {alert.type === 'error' && <XCircle size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1e293b' }}>{alert.title}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{alert.message}</p>
                {alert.deadline && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Due: {formatDate(alert.deadline)}
                  </p>
                )}
              </div>
              <button onClick={() => handleDismissAlert(index)} style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '8px'
              }}>
                <XCircle size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px' // --spacing-md
      }}>
        {/* User Management Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px', // --radius-lg
          padding: '24px', // --spacing-lg
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)' // --shadow-md
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Users size={20} style={{ color: '#1E88E5', marginRight: '16px' }} />
            <h3 style={{ margin: 0, flex: 1, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>User Management</h3>
            <Link to="/admin/user-management" style={{ color: '#1E88E5', textDecoration: 'none', fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#E3F2FD', // --primary-ultralight
                borderRadius: '9999px', // --radius-full
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{stats.totalUsers || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>Active</span>
                    <span style={{ color: '#1e293b' }}>{stats.activeUsers || 0}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0', // --medium-gray
                    borderRadius: '4px', // --radius-sm
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${stats.totalUsers ? (stats.activeUsers / stats.totalUsers * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#1E88E5' // --primary-color
                    }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>Inactive</span>
                    <span style={{ color: '#1e293b' }}>{stats.inactiveUsers || (stats.totalUsers ? stats.totalUsers - (stats.activeUsers || 0) : 0)}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${stats.totalUsers ? ((stats.totalUsers - stats.activeUsers) / stats.totalUsers * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#64748b' // --dark-gray
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={navigateToCreateUser} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px', // --radius-md
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' } // --primary-dark
              }}>
                <UserPlus size={16} /> Add User
              </button>
              <button onClick={navigateToExportUsers} style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <FileDown size={16} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Applicant Pooling Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Briefcase size={20} style={{ color: '#1E88E5', marginRight: '16px' }} />
            <h3 style={{ margin: 0, flex: 1, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Applicant Pooling</h3>
            <Link to="/admin/applicant-pools" style={{ color: '#1E88E5', textDecoration: 'none', fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#E3F2FD',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{stats.totalApplicants || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>Pending</span>
                    <span style={{ color: '#1e293b' }}>{stats.pendingApplicants || 0}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${stats.totalApplicants ? (stats.pendingApplicants / stats.totalApplicants * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#f39c12' // --warning-color
                    }}></div>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>Shortlisted</span>
                    <span style={{ color: '#1e293b' }}>{stats.shortlistedApplicants || 0}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${stats.totalApplicants ? (stats.shortlistedApplicants / stats.totalApplicants * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#1E88E5'
                    }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>Hired</span>
                    <span style={{ color: '#1e293b' }}>{stats.hiredApplicants || 0}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${stats.totalApplicants ? (stats.hiredApplicants / stats.totalApplicants * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#2ecc71' // --success-color
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
            {stats.recentApplicants && stats.recentApplicants.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Recent Applicants</h4>
                {stats.recentApplicants.map((applicant, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < stats.recentApplicants.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: '#1E88E5',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        color: '#ffffff'
                      }}>
                        {applicant.full_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{applicant.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {applicant.job_role} • {applicant.department}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: applicant.status === 'pending' ? '#fff8e6' :
                                      applicant.status === 'shortlisted' ? '#E3F2FD' :
                                      applicant.status === 'hired' ? '#e6ffe6' : '#ffe6e6',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#1e293b'
                    }}>
                      {applicant.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={navigateToApplicantPool} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}>
                <Layers size={16} /> Manage Pools
              </button>
              <button onClick={navigateToExportApplicants} style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <FileDown size={16} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Training Programs Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <BookOpen size={20} style={{ color: '#1E88E5', marginRight: '16px' }} />
            <h3 style={{ margin: 0, flex: 1, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Training Programs</h3>
            <Link to="/admin/programs" style={{ color: '#1E88E5', textDecoration: 'none', fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#E3F2FD',
                padding: '16px',
                borderRadius: '8px',
                flex: 1
              }}>
                <BookOpen size={20} style={{ color: '#1E88E5' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{stats.activePrograms || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Programs</div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#E3F2FD',
                padding: '16px',
                borderRadius: '8px',
                flex: 1
              }}>
                <HelpCircle size={20} style={{ color: '#1E88E5' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{stats.totalQuizzes || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Quizzes</div>
                </div>
              </div>
            </div>
            {stats.programActivity && stats.programActivity.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  Program Enrollments & Completions
                </h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={stats.programActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                        color: '#1e293b'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="#1E88E5" 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, stroke: '#1E88E5', strokeWidth: 1 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="#1565C0" 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, stroke: '#1565C0', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={navigateToCreateProgram} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}>
                <Plus size={16} /> New Program
              </button>
              <button onClick={navigateToCreateQuiz} style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <Plus size={16} /> New Quiz
              </button>
            </div>
          </div>
        </div>

        {/* System Health Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Server size={20} style={{ color: '#1E88E5', marginRight: '16px' }} />
            <h3 style={{ margin: 0, flex: 1, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>System Health</h3>
            <Link to="/admin/system" style={{ color: '#1E88E5', textDecoration: 'none', fontSize: '0.875rem' }}>
              View Details
            </Link>
          </div>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748b' }}>Database Status</span>
                <span style={{ color: '#2ecc71' }}>Healthy</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748b' }}>Last Backup</span>
                <span style={{ color: stats.lastBackupDays <= 7 ? '#2ecc71' : '#f39c12' }}>
                  {stats.lastBackupDays !== null ? `${stats.lastBackupDays} days ago` : 'No recent backup'}
                </span>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Recent Backups</h4>
              {stats.recentBackups && stats.recentBackups.length > 0 ? (
                stats.recentBackups.map((backup, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < stats.recentBackups.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{backup.backup_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatDate(backup.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDownloadBackup(backup.id)} style={{
                        backgroundColor: '#1E88E5',
                        color: '#ffffff',
                        padding: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleRestoreBackup(backup.id)} style={{
                        backgroundColor: '#ffffff',
                        color: '#1E88E5',
                        padding: '4px',
                        border: '1px solid #1E88E5',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>No recent backups to display</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={handleCreateBackup} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}>
                <Download size={16} /> Create Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;