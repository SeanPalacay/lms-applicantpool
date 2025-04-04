import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  // Layout icons
  LayoutDashboard, Menu, X, ChevronDown, LogOut, Settings,
  
  // Admin icons
  Users, BookOpen, UserCheck, BarChart2, FolderOpen, Database, Shield,
  
  // Trainer icons
  ClipboardList, Flag, GraduationCap, RotateCw, FileText as TrainerFiles,
  
  // Trainee icons
  Award, BookMarked, CheckSquare, TrendingUp,
  
  // Applicant icons
  FileText, Upload, Briefcase,
  
  // Shared icons
  User, Bell, Calendar, AlertTriangle
} from 'lucide-react';
import './styles/dashboardlayout.css';

/**
 * Dashboard Layout Component
 * Provides a consistent layout for all dashboard pages including sidebar navigation
 * based on LMS database schema and module requirements
 * @param {string} title - The title to display in the header
 * @param {string} role - The user role (administrator, trainer, trainee, applicant)
 * @param {ReactNode} children - The content to render in the main area
 */
const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const fullName = localStorage.getItem('full_name') || 'User';
  
  // Get notifications from localStorage or use default
  const savedNotifications = localStorage.getItem('notifications');
  const defaultNotifications = [
    { id: 1, type: 'info', title: 'Profile Updated', message: 'Your profile was updated successfully', isRead: false, time: '5 min ago' },
    { id: 2, type: 'success', title: 'New Program Added', message: 'New program has been added: Advanced React', isRead: false, time: '2 hours ago' },
    { id: 3, type: 'warning', title: 'Milestone Approaching', message: 'You have a milestone due in 2 days', isRead: false, time: '1 day ago' },
    { id: 4, type: 'error', title: 'Quiz Score Alert', message: 'Your score was below passing on the Policy Quiz', isRead: true, time: '3 days ago' }
  ];
  
  const [notifications, setNotifications] = useState(
    savedNotifications ? JSON.parse(savedNotifications) : defaultNotifications
  );

// Update the roleToPathMap object in DashboardLayout.js

const roleToPathMap = {

  'administrator': 'admin',

  'trainer': 'trainer',

  'trainee': 'trainee',

  'employee': 'employee', // Add employee route path

  'applicant': 'applicant'

};

  const navRole = roleToPathMap[role] || role; // Use mapped role for paths

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount to set initial state
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
      if (notificationsOpen && !event.target.closest('.notifications-dropdown')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notificationsOpen]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleLogout = () => {
    // Track user logout activity via API
    fetch('/api/activity/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        activity_type: 'logout',
        details: `${fullName} logged out`
      })
    }).catch(err => console.error('Error logging activity:', err));
    
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('full_name');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTime');
    
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: true } 
        : notification
    ));
  };

  const renderIcon = (iconName, size = 18) => {
    const icons = {
      // Admin icons
      'dashboard': <LayoutDashboard size={size} />,
      'users': <Users size={size} />,
      'programs': <BookOpen size={size} />,
      'applicants': <UserCheck size={size} />,
      'reports': <BarChart2 size={size} />,
      'records': <FolderOpen size={size} />,
      'backups': <Database size={size} />,
      'incidents': <AlertTriangle size={size} />,
      'admin-profile': <Shield size={size} />,
      
      // Trainer icons
      'quizzes': <ClipboardList size={size} />,
      'milestones': <Flag size={size} />,
      'trainees': <GraduationCap size={size} />,
      'refresher': <RotateCw size={size} />,
      'trainer-records': <TrainerFiles size={size} />,
      'trainer-profile': <User size={size} />,
      
      // Trainee icons
      'assessments': <ClipboardList size={size} />,
      'certificates': <Award size={size} />,
      'my-programs': <BookMarked size={size} />,
      'progress': <TrendingUp size={size} />,
      'completion': <CheckSquare size={size} />,
      'trainee-profile': <User size={size} />,
      
      // Applicant icons
      'applications': <FileText size={size} />,
      'upload': <Upload size={size} />,
      'available-programs': <Calendar size={size} />,
      'job-roles': <Briefcase size={size} />,
      'applicant-profile': <User size={size} />,
    };
    
    return icons[iconName] || null;
  };

  // Define navigation links based on user role with Lucide icons
  // Updated to match database schema and module requirements
  const navLinks = {
    administrator: [
      { path: '/administrator-dashboard', label: 'Dashboard', iconName: 'dashboard' },
      { path: '/admin/user-management', label: 'User Management', iconName: 'users' },
      { path: '/admin/programs', label: 'Programs', iconName: 'programs' },
      { path: '/admin/applications', label: 'Applications', iconName: 'applicants' },
      { path: '/admin/applicant-pools', label: 'Applicant Pools', iconName: 'applicants' },
      { path: '/admin/reports', label: 'Assessment Reports', iconName: 'reports' },
      { path: '/admin/records', label: 'Records Management', iconName: 'records' },
      { path: '/admin/backups', label: 'System Backups', iconName: 'backups' },
      // { path: '/admin/incidents', label: 'Performance Incidents', iconName: 'incidents' },
      { path: '/admin/profile', label: 'Profile', iconName: 'admin-profile' },
    ],
    trainer: [
      { path: '/trainer-dashboard', label: 'Dashboard', iconName: 'dashboard' },
      { path: '/trainer/programs', label: 'Programs', iconName: 'programs' },
      { path: '/trainer/practical-exams', label: 'Exam', iconName: 'certificates' },
      { path: '/trainer/quizzes', label: 'Quizzes & Assessments', iconName: 'quizzes' },
      // { path: '/trainer/milestones', label: 'Milestones', iconName: 'milestones' },
      { path: '/trainer/trainees', label: 'Trainees', iconName: 'trainees' },
      { path: '/trainer/refresher-courses', label: 'Refresher Courses', iconName: 'refresher' },
      { path: '/trainer/records', label: 'Training Records', iconName: 'trainer-records' },
      { path: '/trainer/profile', label: 'Profile', iconName: 'trainer-profile' },
    ],
    trainee: [
      { path: '/trainee-dashboard', label: 'Dashboard', iconName: 'dashboard' },
      { path: '/trainee/programs', label: 'My Programs', iconName: 'my-programs' },
      { path: '/trainee/practical-exams', label: 'Exam', iconName: 'certificates' },
      { path: '/trainee/assessments', label: 'Assessments', iconName: 'assessments' },
      { path: '/trainee/progress', label: 'Progress Tracking', iconName: 'progress' },
      // { path: '/trainee/certificates', label: 'Certificates', iconName: 'certificates' },
      { path: '/trainee/profile', label: 'Profile', iconName: 'trainee-profile' },
    ],
    employee: [

      { path: '/employee-dashboard', label: 'Dashboard', iconName: 'dashboard' },
  
      { path: '/employee/programs', label: 'My Programs', iconName: 'my-programs' },
  
      { path: '/employee/practical-exams', label: 'Exam', iconName: 'certificates' },
  
      { path: '/employee/assessments', label: 'Assessments', iconName: 'assessments' },
  
      { path: '/employee/progress', label: 'Progress Tracking', iconName: 'progress' },
  
      { path: '/employee/profile', label: 'Profile', iconName: 'trainee-profile' },
  
    ],
    applicant: [
      { path: '/applicant-dashboard', label: 'Dashboard', iconName: 'dashboard' },
      // { path: '/applicant/programs', label: 'Available Programs', iconName: 'available-programs' },
      // { path: '/applicant/pool', label: 'Application Pool', iconName: 'available-programs' },
      { path: '/applicant/job-roles', label: 'Job Roles', iconName: 'job-roles' },
      { path: '/applicant/applications', label: 'My Applications', iconName: 'applications' },
      // { path: '/applicant/upload', label: 'Upload Documents', iconName: 'upload' },
      { path: '/applicant/profile', label: 'Profile', iconName: 'applicant-profile' },
    ],
  };

  // Use the appropriate links for the current role, or empty array if role not recognized
  const links = navLinks[role] || [];

  // Generate initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const userInitials = getInitials(fullName);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Badge colors based on notification type
  const getNotificationIconColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500'; // info
    }
  };

  return (
    <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/assets/images/logocolor.png" alt="Logo" className="logo" />
            {/* <span className="logo-text">Forbes LMS</span> */}
          </div>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {userInitials}
          </div>
          <div className="user-info">
            <span className="user-name">{fullName}</span>
            <span className="user-role">{role}</span>
          </div>
        </div>
        
        <div className="sidebar-divider">
          <span>MENU</span>
        </div>
        
        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setSidebarOpen(false)}
            >
              <span className="sidebar-icon">
                {renderIcon(link.iconName)}
              </span>
              <span className="sidebar-label">{link.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="sidebar-icon">
              <LogOut size={18} />
            </span>
            <span>Logout</span>
          </button>
        </div> */}
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle" 
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen && window.innerWidth < 992 ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="page-title">{title}</h1>
          </div>
          
          <div className="header-right">
            <div className={`notifications-dropdown ${notificationsOpen ? 'open' : ''}`}>
              <button 
                className="notifications-toggle" 
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {notificationsOpen && (
                <div className="notifications-menu">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button className="mark-read" onClick={markAllAsRead}>Mark all as read</button>
                  </div>
                  
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">No notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className={`notification-icon ${getNotificationIconColor(notification.type)}`}>
                            {notification.type === 'success' && <CheckSquare size={16} />}
                            {notification.type === 'warning' && <AlertTriangle size={16} />}
                            {notification.type === 'error' && <AlertTriangle size={16} />}
                            {notification.type === 'info' && <Bell size={16} />}
                          </div>
                          <div className="notification-content">
                            <strong className="notification-title">{notification.title}</strong>
                            <p>{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="notifications-footer">
                    <Link to="/notifications" className="view-all">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
              <button 
                className="user-dropdown-toggle" 
                onClick={toggleDropdown}
                aria-label="User menu"
              >
                <div className="user-avatar small">
                  {userInitials}
                </div>
                <span className="user-name hide-mobile">{fullName}</span>
                <ChevronDown size={16} className={dropdownOpen ? 'rotate-180' : ''} />
              </button>
              
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="user-avatar medium">
                      {userInitials}
                    </div>
                    <div>
                      <div className="dropdown-name">{fullName}</div>
                      <div className="dropdown-role">{role}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
{/*                   
                  <Link to={`/${navRole}/profile`} className="dropdown-item">                    <Settings size={18} />
                    <span>Profile Settings</span>
                  </Link> */}
                  
                  <button onClick={handleLogout} className="dropdown-item">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          {children}
        </div>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth < 992 && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};


DashboardLayout.propTypes = {

  title: PropTypes.string.isRequired,

  role: PropTypes.oneOf(['administrator', 'trainer', 'trainee', 'employee', 'applicant']).isRequired,

  children: PropTypes.node.isRequired

};

export default DashboardLayout;