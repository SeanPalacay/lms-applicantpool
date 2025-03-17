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
            
            const data = await adminService.getDashboardData();
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

    // Refresh dashboard data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 300000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
}, [navigate]);

// Handle actions for different buttons

// Create backup function
const handleCreateBackup = async () => {
    try {
        setLoading(true);
        // Call the createBackup method from adminService
        await adminService.createBackup();
        
        // Show success message
        alert('Backup created successfully!');
        
        // Refresh dashboard data to show the new backup
        const data = await adminService.getDashboardData();
        setStats(data);
    } catch (err) {
        alert('Error creating backup: ' + err.message);
    } finally {
        setLoading(false)
    }
};

// Restore backup function
const handleRestoreBackup = async (backupId) => {
    if (window.confirm('Are you sure you want to restore this backup? This will replace all current data.')) {
        try {
            setLoading(true);
            // Call the restoreBackup method from adminService
            await adminService.restoreBackup(backupId);
            
            // Show success message
            alert('Backup restored successfully!');
            
            // Refresh dashboard data
            const data = await adminService.getDashboardData();
            setStats(data);
        } catch (err) {
            alert('Error restoring backup: ' + err.message);
        } finally {
            setLoading(false);
        }
    }
};

// Download backup function
const handleDownloadBackup = async (backupId, backupName) => {
    try {
        setLoading(true);
        // Call the downloadBackup method from adminService
        await adminService.downloadBackup(backupId);
        
        // Success is handled by the browser starting a download, no need for alert
    } catch (err) {
        alert('Error downloading backup: ' + err.message);
    } finally {
        setLoading(false);
    }
};

// Dismiss alert function
const handleDismissAlert = (alertIndex) => {
    // Create a copy of the alerts array
    const newAlerts = [...stats.alerts];
    // Remove the alert at the specified index
    newAlerts.splice(alertIndex, 1);
    // Update the state
    setStats({...stats, alerts: newAlerts});
};

// Navigate to applicant pool
const navigateToApplicantPool = () => {
    navigate('/admin/applicant-pools');
};

// Navigate to user management
const navigateToUserManagement = () => {
    navigate('/admin/user-management');
};

// Navigate to programs
const navigateToPrograms = () => {
    navigate('/admin/programs');
};

// Navigate to create program
const navigateToCreateProgram = () => {
    navigate('/admin/programs/create');
};

// Navigate to create quiz
const navigateToCreateQuiz = () => {
    navigate('/admin/quizzes/create');
};

// Navigate to reports
const navigateToReports = () => {
    navigate('/admin/reports');
};

// Navigate to settings
const navigateToSettings = () => {
    navigate('/admin/settings');
};

// Navigate to create user
const navigateToCreateUser = () => {
    navigate('/admin/user-management/create');
};

// Navigate to export users
const navigateToExportUsers = () => {
    navigate('/admin/user-management/export');
};

// Navigate to export applicants
const navigateToExportApplicants = () => {
    navigate('/admin/applicants/export');
};

// Navigate to create applicant pool
const navigateToCreatePool = () => {
    navigate('/admin/applicant-pools/create');
};

// Navigate to create backup
const navigateToCreateBackup = () => {
    navigate('/admin/backups/create');
};

// Helper function to format date
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

if (loading) {
    return <LoadingSpinner />;
}

return (
    <div className="admin-dashboard">
        {error && <AlertBanner message={error} type="error" />}
        <div className="key-metrics-container">
            <div className="key-metric-card gradient-blue" onClick={navigateToUserManagement} style={{ cursor: 'pointer' }}>
                <div className="metric-icon">
                    <Users size={24} />
                </div>
                <div className="metric-content">
                    <h2>{stats.activeUsers || 0}</h2>
                    <p>Active Users</p>
                </div>
            </div>
            
            <div className="key-metric-card gradient-purple" onClick={navigateToPrograms} style={{ cursor: 'pointer' }}>
                <div className="metric-icon">
                    <BookOpen size={24} />
                </div>
                <div className="metric-content">
                    <h2>{stats.activePrograms || 0}</h2>
                    <p>Active Programs</p>
                </div>
            </div>
            
            <div className="key-metric-card gradient-amber" onClick={navigateToApplicantPool} style={{ cursor: 'pointer' }}>
                <div className="metric-icon">
                    <Briefcase size={24} />
                </div>
                <div className="metric-content">
                    <h2>{stats.pendingApplicants || 0}</h2>
                    <p>Pending Applicants</p>
                </div>
            </div>
            
            <div className="key-metric-card gradient-teal" onClick={navigateToCreateQuiz} style={{ cursor: 'pointer' }}>
                <div className="metric-icon">
                    <HelpCircle size={24} />
                </div>
                <div className="metric-content">
                    <h2>{stats.totalQuizzes || 0}</h2>
                    <p>Total Quizzes</p>
                </div>
            </div>
        </div>
    
        {/* Alerts Section */}
        {stats.alerts && stats.alerts.length > 0 && (
            <div className="alerts-section">
                <div className="section-header">
                    <h2>Alerts & Notifications</h2>
                    <div className="header-line"></div>
                </div>
                
                <div className="alerts-container">
                    {stats.alerts.map((alert, index) => (
                        <div key={index} className={`alert-card alert-${alert.type}`}>
                            <div className="alert-icon">
                                {alert.type === 'warning' && <AlertTriangle size={20} />}
                                {alert.type === 'info' && <Info size={20} />}
                                {alert.type === 'success' && <CheckCircle size={20} />}
                                {alert.type === 'error' && <XCircle size={20} />}
                            </div>
                            <div className="alert-content">
                                <h4>{alert.title}</h4>
                                <p>{alert.message}</p>
                                {alert.deadline && (
                                    <p className="alert-deadline">
                                        <Clock size={14} className="icon-inline" /> 
                                        Due: {formatDate(alert.deadline)}
                                    </p>
                                )}
                            </div>
                            <div className="alert-actions">
                                {alert.actionLink && (
                                    <Link to={alert.actionLink} className="alert-action-btn">
                                        {alert.actionText || 'View'}
                                    </Link>
                                )}
                                <button 
                                    className="dismiss-btn" 
                                    onClick={() => handleDismissAlert(index)}
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* Dashboard Grid Layout */}
        <div className="dashboard-grid">
            {/* User Management Card */}
            <div className="dashboard-card">
                <div className="card-header">
                    <div className="header-icon">
                        <Users size={20} />
                    </div>
                    <div className="header-content">
                        <h3>User Management</h3>
                        <Link to="/admin/user-management" className="view-all-link">
                            View All
                        </Link>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="user-metrics">
                        <div className="user-metric-circle">
                            <div className="inner-circle">
                                <div className="metric-number">{stats.totalUsers || 0}</div>
                                <div className="metric-label">Total</div>
                            </div>
                        </div>
                        
                        <div className="user-metrics-details">
                            <div className="metric-item">
                                <div className="metric-label">Active</div>
                                <div className="metric-value">{stats.activeUsers || 0}</div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${stats.totalUsers ? (stats.activeUsers / stats.totalUsers * 100) : 0}%`,
                                            background: 'linear-gradient(to right, #4361ee, #3a0ca3)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="metric-item">
                                <div className="metric-label">Inactive</div>
                                <div className="metric-value">
                                    {stats.inactiveUsers || (stats.totalUsers ? stats.totalUsers - (stats.activeUsers || 0) : 0)}
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${stats.totalUsers ? ((stats.totalUsers - stats.activeUsers) / stats.totalUsers * 100) : 0}%`,
                                            background: 'linear-gradient(to right, #8d99ae, #2b2d42)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="user-distribution">
                        <h4>User Distribution</h4>
                        <div className="distribution-chart">
                            <div className="chart-container">
                                <svg viewBox="0 0 36 36" className="circular-chart">
                                    <circle 
                                        className="donut-segment admin-segment" 
                                        cx="18" cy="18" r="15.91"
                                        strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.administrator / stats.totalUsers * 100) : 0} 100`} 
                                    />
                                    <circle 
                                        className="donut-segment trainer-segment" 
                                        cx="18" cy="18" r="15.91"
                                        strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.trainer / stats.totalUsers * 100) : 0} 100`} 
                                        strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -((stats.usersByRole.administrator) / stats.totalUsers * 100) : 0}`} 
                                    />
                                    <circle 
                                        className="donut-segment trainee-segment" 
                                        cx="18" cy="18" r="15.91"
                                        strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.trainee / stats.totalUsers * 100) : 0} 100`} 
                                        strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -(((stats.usersByRole.administrator) + (stats.usersByRole.trainer)) / stats.totalUsers * 100) : 0}`} 
                                    />
                                    <circle 
                                        className="donut-segment applicant-segment" 
                                        cx="18" cy="18" r="15.91"
                                        strokeDasharray={`${stats.usersByRole && stats.totalUsers ? (stats.usersByRole.applicant / stats.totalUsers * 100) : 0} 100`} 
                                        strokeDashoffset={`${stats.usersByRole && stats.totalUsers ? -(((stats.usersByRole.administrator) + (stats.usersByRole.trainer) + (stats.usersByRole.trainee)) / stats.totalUsers * 100) : 0}`} 
                                    />
                                </svg>
                            </div>
                            
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <span className="legend-color admin-color"></span>
                                    <span className="legend-label">Admins ({stats.usersByRole?.administrator || 0})</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color trainer-color"></span>
                                    <span className="legend-label">Trainers ({stats.usersByRole?.trainer || 0})</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color trainee-color"></span>
                                    <span className="legend-label">Trainees ({stats.usersByRole?.trainee || 0})</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color applicant-color"></span>
                                    <span className="legend-label">Applicants ({stats.usersByRole?.applicant || 0})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card-actions">
                        <button onClick={navigateToCreateUser} className="action-button primary">
                            <UserPlus size={16} className="icon-inline" /> Add User
                        </button>
                        <button onClick={navigateToExportUsers} className="action-button secondary">
                            <FileDown size={16} className="icon-inline" /> Export
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Applicant Pooling Card */}
            <div className="dashboard-card">
                <div className="card-header">
                    <div className="header-icon">
                        <Briefcase size={20} />
                    </div>
                    <div className="header-content">
                        <h3>Applicant Pooling</h3>
                        <Link to="/admin/applicant-pools" className="view-all-link">
                            View All
                        </Link>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="applicant-summary">
                        <div className="summary-circle">
                            <div className="inner-circle">
                                <div className="metric-number">{stats.totalApplicants || 0}</div>
                                <div className="metric-label">Total</div>
                            </div>
                        </div>
                        
                        <div className="applicant-stats">
                            <div className="applicant-metric">
                                <div className="metric-info">
                                    <div className="metric-label">Pending</div>
                                    <div className="metric-value">{stats.pendingApplicants || 0}</div>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${stats.totalApplicants ? (stats.pendingApplicants / stats.totalApplicants * 100) : 0}%`,
                                            background: 'linear-gradient(to right, #fb8500, #ffb703)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="applicant-metric">
                                <div className="metric-info">
                                    <div className="metric-label">Shortlisted</div>
                                    <div className="metric-value">{stats.shortlistedApplicants || 0}</div>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${stats.totalApplicants ? (stats.shortlistedApplicants / stats.totalApplicants * 100) : 0}%`,
                                            background: 'linear-gradient(to right, #3a86ff, #4361ee)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="applicant-metric">
                                <div className="metric-info">
                                    <div className="metric-label">Hired</div>
                                    <div className="metric-value">{stats.hiredApplicants || 0}</div>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${stats.totalApplicants ? (stats.hiredApplicants / stats.totalApplicants * 100) : 0}%`,
                                            background: 'linear-gradient(to right, #2dc653, #0db39e)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {stats.recentApplicants && stats.recentApplicants.length > 0 ? (
                        <div className="recent-applicants">
                            <h4>Recent Applicants</h4>
                            <div className="applicants-list">
                                {stats.recentApplicants.map((applicant, index) => (
                                    <div key={index} className="applicant-item">
                                        <div className="applicant-info">
                                            <div className="applicant-avatar">
                                                {applicant.full_name.charAt(0)}
                                            </div>
                                            <div className="applicant-details">
                                                <div className="applicant-name">{applicant.full_name}</div>
                                                <div className="applicant-position">
                                                    {applicant.job_role} • {applicant.department}
                                                </div>
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
                        <div className="no-data-message">
                            <p>No recent applicants to display</p>
                        </div>
                    )}
                    
                    <div className="card-actions">
                        <button onClick={navigateToApplicantPool} className="action-button primary">
                            <Layers size={16} className="icon-inline" /> Manage Pools
                        </button>
                        <button onClick={navigateToExportApplicants} className="action-button secondary">
                            <FileDown size={16} className="icon-inline" /> Export
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Training Programs Card */}
            <div className="dashboard-card">
                <div className="card-header">
                    <div className="header-icon">
                        <BookOpen size={20} />
                    </div>
                    <div className="header-content">
                        <h3>Training Programs</h3>
                        <Link to="/admin/programs" className="view-all-link">
                            View All
                        </Link>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="program-metrics">
                        <div className="program-metric">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4361ee, #3a0ca3)' }}>
                                <BookOpen size={20} />
                            </div>
                            <div className="metric-details">
                                <div className="metric-value">{stats.activePrograms || 0}</div>
                                <div className="metric-label">Active Programs</div>
                            </div>
                        </div>
                        
                        <div className="program-metric">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f72585, #b5179e)' }}>
                                <HelpCircle size={20} />
                            </div>
                            <div className="metric-details">
                                <div className="metric-value">{stats.totalQuizzes || 0}</div>
                                <div className="metric-label">Total Quizzes</div>
                            </div>
                        </div>
                    </div>
                    
                    {stats.programActivity && stats.programActivity.length > 0 && (
                        <div className="activity-chart">
                            <h4>Program Enrollments & Completions</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={stats.programActivity}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                                    <XAxis dataKey="date" stroke="#8884d8" fontSize={12} />
                                    <YAxis stroke="#8884d8" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            background: 'rgba(255, 255, 255, 0.9)', 
                                            border: 'none', 
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="enrollments" 
                                        stroke="#4361ee" 
                                        strokeWidth={3} 
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6, stroke: '#4361ee', strokeWidth: 2 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="completions" 
                                        stroke="#2ec4b6" 
                                        strokeWidth={3} 
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6, stroke: '#2ec4b6', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    
                    <div className="card-actions">
                        <button onClick={navigateToCreateProgram} className="action-button primary">
                            <Plus size={16} className="icon-inline" /> New Program
                        </button>
                        <button onClick={navigateToCreateQuiz} className="action-button secondary">
                            <Plus size={16} className="icon-inline" /> New Quiz
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Recent Activity Card */}
            <div className="dashboard-card">
                <div className="card-header">
                    <div className="header-icon">
                        <Activity size={20} />
                    </div>
                    <div className="header-content">
                        <h3>Recent Activity</h3>
                        <Link to="/admin/activity" className="view-all-link">
                            View All
                        </Link>
                    </div>
                </div>
                
                <div className="card-content">
                    {stats.recentActivity && stats.recentActivity.length > 0 ? (
                        <div className="activity-list">
                            {stats.recentActivity.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className={`activity-icon activity-${activity.type || 'other'}`}>
                                        {activity.type === 'user' && <Users size={16} />}
                                        {activity.type === 'program' && <BookOpen size={16} />}
                                        {activity.type === 'quiz' && <HelpCircle size={16} />}
                                        {activity.type === 'applicant' && <Briefcase size={16} />}
                                        {activity.type === 'system' && <Settings size={16} />}
                                        {(!activity.type || activity.type === 'other') && <Activity size={16} />}
                                    </div>
                                    <div className="activity-content">
                                        <p className="activity-text">{activity.message}</p>
                                        <span className="activity-time">
                                            <Clock size={12} className="icon-inline" /> 
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <p>No recent activity to display</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* System Health Card */}
            <div className="dashboard-card">
                <div className="card-header">
                    <div className="header-icon">
                        <Server size={20} />
                    </div>
                    <div className="header-content">
                        <h3>System Health</h3>
                        <Link to="/admin/system" className="view-all-link">
                            View Details
                        </Link>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="health-metrics">
                        <div className="health-metric">
                        <div className="metric-info">
                                <div className="metric-label">Database Status</div>
                            </div>
                            <div className="metric-value status-healthy">
                                Healthy
                            </div>
                            <div className="metric-indicator healthy"></div>
                        </div>
                        
                        <div className="health-metric">
                            <div className="metric-info">
                                <div className="metric-label">Last Backup</div>
                            </div>
                            <div className={`metric-value ${stats.lastBackupStatus || 'status-warning'}`}>
                                {stats.lastBackupDays !== null 
                                    ? `${stats.lastBackupDays} days ago`
                                    : 'No recent backup'}
                            </div>
                            <div className={`metric-indicator ${stats.lastBackupDays !== null && stats.lastBackupDays <= 7 ? 'healthy' : 'warning'}`}></div>
                        </div>
                        
                        <div className="health-metric">
                            <div className="metric-info">
                                <div className="metric-label">System Load</div>
                            </div>
                            <div className="metric-value status-healthy">
                                Normal
                            </div>
                            <div className="metric-indicator healthy"></div>
                        </div>
                    </div>
                    
                    <div className="backups-list">
                        <h4>Recent Backups</h4>
                        <div className="backup-items">
                            {stats.recentBackups && stats.recentBackups.length > 0 ? (
                                stats.recentBackups.map((backup, index) => (
                                    <div key={index} className="backup-item">
                                        <div className="backup-details">
                                            <div className="backup-name">{backup.backup_name}</div>
                                            <div className="backup-info">
                                                <span className="backup-date">
                                                    <Calendar size={12} className="icon-inline" />
                                                    {formatDate(backup.created_at)}
                                                </span>
                                                <span className="backup-type">
                                                    {backup.backup_type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="backup-actions">
                                            <button 
                                                className="icon-button" 
                                                title="Download"
                                                onClick={() => handleDownloadBackup(backup.id, backup.backup_name)}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button 
                                                className="icon-button" 
                                                title="Restore"
                                                onClick={() => handleRestoreBackup(backup.id)}
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data-message">
                                    <p>No recent backups to display</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="card-actions">
                        <button className="action-button primary" onClick={handleCreateBackup}>
                            <Download size={16} className="icon-inline" /> Create Backup
                        </button>
                        <Link to="/admin/backups" className="action-button secondary">
                            <Server size={16} className="icon-inline" /> Manage Backups
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Quick Actions Card */}
            {/* <div className="dashboard-card">
                <div className="card-header gradient-rose">
                    <div className="header-icon">
                        <Activity size={20} />
                    </div>
                    <div className="header-content">
                        <h3>Quick Actions</h3>
                    </div>
                </div>
                
                <div className="card-content">
                    <div className="quick-actions-grid">
                        <button onClick={navigateToCreateUser} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #4361ee, #3a0ca3)' }}>
                                <UserPlus size={20} />
                            </div>
                            <div className="action-name">Add User</div>
                        </button>
                        
                        <button onClick={navigateToCreateProgram} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #7209b7, #560bad)' }}>
                                <BookOpen size={20} />
                            </div>
                            <div className="action-name">Create Program</div>
                        </button>
                        
                        <button onClick={navigateToCreatePool} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #fb8500, #ffb703)' }}>
                                <Layers size={20} />
                            </div>
                            <div className="action-name">Create Pool</div>
                        </button>
                        
                        <button onClick={navigateToCreateBackup} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #2ec4b6, #0db39e)' }}>
                                <Download size={20} />
                            </div>
                            <div className="action-name">Create Backup</div>
                        </button>
                        
                        <button onClick={navigateToReports} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #f72585, #b5179e)' }}>
                                <BarChart2 size={20} />
                            </div>
                            <div className="action-name">View Reports</div>
                        </button>
                        
                        <button onClick={navigateToSettings} className="action-tile">
                            <div className="action-icon" style={{ background: 'linear-gradient(135deg, #8d99ae, #2b2d42)' }}>
                                <Settings size={20} />
                            </div>
                            <div className="action-name">Settings</div>
                        </button>
                    </div>
                </div>
            </div> */}
        </div>
    </div>
);
};

export default AdminDashboard;