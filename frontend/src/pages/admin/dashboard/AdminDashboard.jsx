import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeUsers: 0,
        totalUsers: 0,
        usersByRole: {
            administrator: 0,
            trainer: 0,
            trainee: 0,
            applicant: 0
        },
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
                // Check if token exists
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('You are not logged in. Please log in to access the dashboard.');
                    setLoading(false);
                    // Redirect to login after a short delay
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }
                
                // Check if user has admin role
                const userRole = localStorage.getItem('userRole');
                if (userRole !== 'administrator' && userRole !== 'admin') {
                    setError('You do not have permission to access this dashboard.');
                    setLoading(false);
                    // Redirect to appropriate dashboard
                    setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
                    return;
                }
                
                const adminService = await import('../../../services/adminService').then(m => m.default);
                console.log("About to fetch dashboard data");
                
                const data = await adminService.getDashboardData();
                console.log("API Response:", data);
                
                setStats(data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                
                // Handle authentication errors
                if (err.message.includes('Authentication') || err.message.includes('login')) {
                    setError('Authentication failed. Please log in again.');
                    // Redirect to login after a short delay
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError('Failed to load dashboard data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };
    
        fetchDashboardData();
    }, [navigate]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="admin-dashboard">
            {error && <AlertBanner message={error} type="error" />}
            
            {/* Header Statistics Summary */}
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h2>Admin Dashboard</h2>
                    <p>Welcome back! Here's what's happening in your LMS today.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-details">
                            <h4>{stats.activeUsers || 0}</h4>
                            <p>Active Users</p>
                        </div>
                    </div>
                    <div className="stat-pill">
                        <div className="stat-icon">
                            <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div className="stat-details">
                            <h4>{stats.activePrograms || 0}</h4>
                            <p>Active Programs</p>
                        </div>
                    </div>
                    <div className="stat-pill">
                        <div className="stat-icon">
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <div className="stat-details">
                            <h4>{stats.pendingApplicants || 0}</h4>
                            <p>Pending Applicants</p>
                        </div>
                    </div>
                    <div className="stat-pill">
                        <div className="stat-icon">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div className="stat-details">
                            <h4>{stats.totalQuizzes || 0}</h4>
                            <p>Total Quizzes</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Alerts Section */}
            {stats.alerts && stats.alerts.length > 0 && (
                <div className="alerts-section">
                    <h3>Alerts & Notifications</h3>
                    <div className="alerts-container">
                        {stats.alerts.map((alert, index) => (
                            <div key={index} className={`alert-card alert-${alert.type}`}>
                                <div className="alert-icon">
                                    {alert.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                                    {alert.type === 'info' && <i className="fas fa-info-circle"></i>}
                                    {alert.type === 'success' && <i className="fas fa-check-circle"></i>}
                                    {alert.type === 'danger' && <i className="fas fa-times-circle"></i>}
                                </div>
                                <div className="alert-content">
                                    <h4>{alert.title}</h4>
                                    <p>{alert.message}</p>
                                    {alert.deadline && (
                                        <p className="alert-deadline">
                                            <i className="far fa-clock"></i> Due: {new Date(alert.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="alert-actions">
                                    {alert.actionLink && (
                                        <Link to={alert.actionLink} className="alert-action-btn">
                                            {alert.actionText || 'View'}
                                        </Link>
                                    )}
                                    <button className="dismiss-btn">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Main Dashboard Layout - Two Column */}
            <div className="dashboard-main">
                {/* Left Column */}
                <div className="dashboard-column">
                    {/* User Management Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-users"></i> User Management</h3>
                            <Link to="/admin/user-management" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            <div className="stat-summary">
                                <div className="stat-circle">
                                    <div className="stat-number">{stats.totalUsers || 0}</div>
                                    <div className="stat-label">Total Users</div>
                                </div>
                                <div className="stat-details">
                                    <div className="stat-row">
                                        <span className="stat-label">Active:</span>
                                        <span className="stat-value">{stats.activeUsers || 0}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Inactive:</span>
                                        <span className="stat-value">{stats.inactiveUsers || (stats.totalUsers ? stats.totalUsers - (stats.activeUsers || 0) : 0)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="user-role-chart">
                                <h4>User Distribution by Role</h4>
                                <div className="donut-chart-container">
                                    <div className="donut-chart">
                                        <svg viewBox="0 0 36 36" className="circular-chart">
                                            {/* Calculate each segment - this is a simplified approach */}
                                            <circle 
                                                className="donut-segment admin-segment" 
                                                cx="18" cy="18" r="15.91"
                                                strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.administrator || 0) / stats.totalUsers * 100 : 0} 100`} 
                                            />
                                            <circle 
                                                className="donut-segment trainer-segment" 
                                                cx="18" cy="18" r="15.91"
                                                strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.trainer || 0) / stats.totalUsers * 100 : 0} 100`} 
                                                strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -((stats.usersByRole.administrator || 0) / stats.totalUsers * 100) : 0}`} 
                                            />
                                            <circle 
                                                className="donut-segment trainee-segment" 
                                                cx="18" cy="18" r="15.91"
                                                strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.trainee || 0) / stats.totalUsers * 100 : 0} 100`} 
                                                strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -(((stats.usersByRole.administrator || 0) + (stats.usersByRole.trainer || 0)) / stats.totalUsers * 100) : 0}`} 
                                            />
                                            <circle 
                                                className="donut-segment applicant-segment" 
                                                cx="18" cy="18" r="15.91"
                                                strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.applicant || 0) / stats.totalUsers * 100 : 0} 100`} 
                                                strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -(((stats.usersByRole.administrator || 0) + (stats.usersByRole.trainer || 0) + (stats.usersByRole.trainee || 0)) / stats.totalUsers * 100) : 0}`} 
                                            />
                                        </svg>
                                    </div>
                                    <div className="role-legend">
                                        <div className="legend-item">
                                            <span className="legend-color admin-color"></span>
                                            <span className="legend-label">Admin ({stats.usersByRole?.administrator || 0})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color trainer-color"></span>
                                            <span className="legend-label">Trainer ({stats.usersByRole?.trainer || 0})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color trainee-color"></span>
                                            <span className="legend-label">Trainee ({stats.usersByRole?.trainee || 0})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color applicant-color"></span>
                                            <span className="legend-label">Applicant ({stats.usersByRole?.applicant || 0})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="card-actions">
                                <Link to="/admin/user-management/create" className="action-btn">
                                    <i className="fas fa-user-plus"></i> Add User
                                </Link>
                                <Link to="/admin/user-management/export" className="action-btn secondary">
                                    <i className="fas fa-file-export"></i> Export List
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* Training Programs Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-chalkboard-teacher"></i> Training Programs</h3>
                            <Link to="/admin/programs" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            <div className="program-stats">
                                <div className="program-stat">
                                    <div className="stat-icon program-icon">
                                        <i className="fas fa-book-open"></i>
                                    </div>
                                    <div>
                                        <div className="stat-value">{stats.activePrograms || 0}</div>
                                        <div className="stat-label">Active Programs</div>
                                    </div>
                                </div>
                                <div className="program-stat">
                                    <div className="stat-icon quiz-icon">
                                        <i className="fas fa-question-circle"></i>
                                    </div>
                                    <div>
                                        <div className="stat-value">{stats.totalQuizzes || 0}</div>
                                        <div className="stat-label">Total Quizzes</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Program Activity Chart */}
                            {stats.programActivity && stats.programActivity.length > 0 && (
                                <div className="activity-chart">
                                    <h4>Program Enrollments</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={stats.programActivity}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="enrollments" stroke="#4361ee" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="completions" stroke="#38b000" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            
                            <div className="card-actions">
                                <Link to="/admin/programs/create" className="action-btn">
                                    <i className="fas fa-plus-circle"></i> New Program
                                </Link>
                                <Link to="/admin/quizzes/create" className="action-btn secondary">
                                    <i className="fas fa-plus-circle"></i> New Quiz
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* System Health Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-server"></i> System Health</h3>
                            <Link to="/admin/system" className="view-all">View Details</Link>
                        </div>
                        <div className="stat-content">
                            <div className="health-metrics">
                                <div className="health-metric">
                                    <div className="metric-label">Database Status</div>
                                    <div className="metric-value status-healthy">
                                        <i className="fas fa-check-circle"></i> Healthy
                                    </div>
                                </div>
                                <div className="health-metric">
                                    <div className="metric-label">Last Backup</div>
                                    <div className={`metric-value ${stats.lastBackupStatus || 'status-warning'}`}>
                                        {stats.lastBackupDays === 0 && <><i className="fas fa-check-circle"></i> Today</>}
                                        {stats.lastBackupDays === 1 && <><i className="fas fa-check-circle"></i> Yesterday</>}
                                        {stats.lastBackupDays > 1 && stats.lastBackupDays <= 7 && 
                                            <><i className="fas fa-check-circle"></i> {stats.lastBackupDays} days ago</>
                                        }
                                        {stats.lastBackupDays > 7 && 
                                            <><i className="fas fa-exclamation-triangle"></i> {stats.lastBackupDays} days ago</>
                                        }
                                        {!stats.lastBackupDays && <><i className="fas fa-exclamation-triangle"></i> No recent backup</>}
                                    </div>
                                </div>
                                <div className="health-metric">
                                    <div className="metric-label">System Load</div>
                                    <div className="metric-value status-healthy">
                                        <i className="fas fa-check-circle"></i> Normal
                                    </div>
                                </div>
                            </div>
                            
                            {/* Recent Backups */}
                            {stats.recentBackups && stats.recentBackups.length > 0 && (
                                <div className="backup-list">
                                    <h4>Recent Backups</h4>
                                    <div className="thin-scrollbar">
                                        {stats.recentBackups.map((backup, index) => (
                                            <div key={index} className="backup-item">
                                                <div className="backup-details">
                                                    <div className="backup-name">{backup.backup_name}</div>
                                                    <div className="backup-info">
                                                        <span className="backup-date">{new Date(backup.created_at).toLocaleDateString()}</span>
                                                        <span className={`backup-type backup-${backup.backup_type}`}>
                                                            {backup.backup_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="backup-actions">
                                                    <button className="icon-btn" title="Download">
                                                        <i className="fas fa-download"></i>
                                                    </button>
                                                    <button className="icon-btn" title="Restore">
                                                        <i className="fas fa-history"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="card-actions">
                                <Link to="/admin/backups/create" className="action-btn">
                                    <i className="fas fa-download"></i> Create Backup
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="dashboard-column">
                    {/* Applicant Pooling Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-user-tie"></i> Applicant Pooling</h3>
                            <Link to="/admin/applicant-dashboard" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            <div className="applicant-stats">
                                <div className="applicant-summary">
                                    <div className="summary-circle">
                                        <span className="summary-label">Total</span>
                                        <span className="summary-value">{stats.totalApplicants || 0}</span>
                                    </div>
                                    <div className="applicant-distribution">
                                        <div className="applicant-stat">
                                            <div className="stat-label">Pending</div>
                                            <div className="stat-value">{stats.pendingApplicants || 0}</div>
                                            <div className="stat-bar">
                                                <div className="bar-fill pending-fill" style={{ width: `${stats.totalApplicants ? (stats.pendingApplicants || 0) / stats.totalApplicants * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="applicant-stat">
                                            <div className="stat-label">Shortlisted</div>
                                            <div className="stat-value">{stats.shortlistedApplicants || 0}</div>
                                            <div className="stat-bar">
                                                <div className="bar-fill shortlisted-fill" style={{ width: `${stats.totalApplicants ? (stats.shortlistedApplicants || 0) / stats.totalApplicants * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="applicant-stat">
                                            <div className="stat-label">Hired</div>
                                            <div className="stat-value">{stats.hiredApplicants || 0}</div>
                                            <div className="stat-bar">
                                                <div className="bar-fill hired-fill" style={{ width: `${stats.totalApplicants ? (stats.hiredApplicants || 0) / stats.totalApplicants * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {stats.recentApplicants && stats.recentApplicants.length > 0 ? (
                                <div className="recent-applicants">
                                    <h4>Recent Applicants</h4>
                                    <div className="thin-scrollbar">
                                        {stats.recentApplicants.map((applicant, index) => (
                                            <div key={index} className="applicant-item">
                                                <div className="applicant-info">
                                                    <div className="applicant-name">{applicant.full_name}</div>
                                                    <div className="applicant-details">
                                                        <span className="applicant-role">{applicant.job_role}</span>
                                                        <span className="applicant-department">{applicant.department}</span>
                                                    </div>
                                                </div>
                                                <div className="applicant-status">
                                                    <span className={`status-badge status-${applicant.status}`}>
                                                        {applicant.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data-message">No recent applicants to display</div>
                            )}
                            
                            <div className="card-actions">
                                <Link to="/admin/applicant-pools" className="action-btn">
                                    <i className="fas fa-layer-group"></i> Manage Pools
                                </Link>
                                <Link to="/admin/applicants/export" className="action-btn secondary">
                                    <i className="fas fa-file-export"></i> Export Data
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* Recent Activity Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-history"></i> Recent Activity</h3>
                            <Link to="/admin/activity" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {stats.recentActivity && stats.recentActivity.length > 0 ? (
                                <div className="activity-list thin-scrollbar">
                                    {stats.recentActivity.map((activity, index) => (
                                        <div key={index} className="activity-item">
                                            <div className={`activity-icon activity-${activity.type}`}>
                                                {activity.type === 'user' && <i className="fas fa-user"></i>}
                                                {activity.type === 'program' && <i className="fas fa-book"></i>}
                                                {activity.type === 'quiz' && <i className="fas fa-question-circle"></i>}
                                                {activity.type === 'applicant' && <i className="fas fa-user-tie"></i>}
                                                {activity.type === 'system' && <i className="fas fa-cogs"></i>}
                                            </div>
                                            <div className="activity-content">
                                                <p className="activity-text">{activity.message}</p>
                                                <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-data-message">No recent activity to display</div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Actions Card */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                        </div>
                        <div className="quick-actions">
                            <div className="action-grid">
                                <Link to="/admin/user-management/create" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-user-plus"></i>
                                    </div>
                                    <div className="action-label">Add User</div>
                                </Link>
                                <Link to="/admin/programs/create" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-book"></i>
                                    </div>
                                    <div className="action-label">Create Program</div>
                                </Link>
                                <Link to="/admin/applicant-pools/create" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-layer-group"></i>
                                    </div>
                                    <div className="action-label">Create Pool</div>
                                </Link>
                                <Link to="/admin/backups/create" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-download"></i>
                                    </div>
                                    <div className="action-label">Create Backup</div>
                                </Link>
                                <Link to="/admin/reports" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-chart-bar"></i>
                                    </div>
                                    <div className="action-label">View Reports</div>
                                </Link>
                                <Link to="/admin/settings" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-cogs"></i>
                                    </div>
                                    <div className="action-label">Settings</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;