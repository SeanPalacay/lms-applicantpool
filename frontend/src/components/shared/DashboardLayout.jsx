import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types'; 
import './styles/dashboardlayout.css';

/**
 * Dashboard Layout Component
 * Provides a consistent layout for all dashboard pages including sidebar navigation
 * @param {string} title - The title to display in the header
 * @param {string} role - The user role (administrator, trainer, trainee, applicant)
 * @param {ReactNode} children - The content to render in the main area
 */
const DashboardLayout = ({ title, role, children }) => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fullName = localStorage.getItem('full_name') || 'User';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('full_name');
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Define navigation links based on user role
    const navLinks = {
        administrator: [
            { path: '/administrator-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
            { path: '/admin/user-management', label: 'User Management', icon: 'fa-users' },
            { path: '/admin/reports', label: 'Assessment Reports', icon: 'fa-chart-bar' },
            { path: '/admin/applicant-dashboard', label: 'Applicant Pooling', icon: 'fa-user-tie' },
            { path: '/admin/backups', label: 'System Backups', icon: 'fa-database' },
            { path: '/admin/profile', label: 'Profile', icon: 'fa-user-cog' },
        ],
        trainer: [
            { path: '/trainer-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
            { path: '/trainer/programs', label: 'Programs', icon: 'fa-book' },
            { path: '/trainer/quizzes', label: 'Assessments', icon: 'fa-tasks' },
            { path: '/trainer/trainees', label: 'Trainees', icon: 'fa-user-graduate' },
            { path: '/trainer/progress', label: 'Progress Reports', icon: 'fa-chart-line' },
            { path: '/trainer/profile', label: 'Profile', icon: 'fa-user-cog' },
        ],
        trainee: [
            { path: '/trainee-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
            { path: '/trainee/programs', label: 'My Programs', icon: 'fa-book' },
            { path: '/trainee/assessments', label: 'My Assessments', icon: 'fa-tasks' },
            { path: '/trainee/certificates', label: 'Certificates', icon: 'fa-certificate' },
            { path: '/trainee/profile', label: 'Profile', icon: 'fa-user' },
        ],
        applicant: [
            { path: '/applicant-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
            { path: '/applicant/profile', label: 'My Application', icon: 'fa-file-alt' },
            { path: '/applicant/upload', label: 'Upload Documents', icon: 'fa-file-upload' },
            { path: '/applicant/status', label: 'Application Status', icon: 'fa-hourglass-half' },
        ],
    };

    // Use the appropriate links for the current role, or empty array if role not recognized
    const links = navLinks[role] || [];

    return (
        <div className={`dashboard-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/assets/images/logocolor.png" alt="Logo" className="logo" />
                    </div>
                    <button className="sidebar-close-btn" onClick={toggleSidebar}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="sidebar-user">
                    <div className="user-avatar">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="user-info">
                        <span className="user-name">{fullName}</span>
                        <span className="user-role">{role}</span>
                    </div>
                </div>
                
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <Link 
                            key={link.path} 
                            to={link.path} 
                            className="sidebar-link"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <i className={`fas ${link.icon}`}></i>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
                
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-button">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="sidebar-toggle" onClick={toggleSidebar}>
                            <i className="fas fa-bars"></i>
                        </button>
                        <h1 className="page-title">{title}</h1>
                    </div>
                    
                    <div className="header-right">
                        <div className="user-dropdown">
                            <button className="user-dropdown-toggle">
                                <div className="user-avatar small">
                                    <i className="fas fa-user"></i>
                                </div>
                                <span className="user-name">{fullName}</span>
                                <i className="fas fa-chevron-down"></i>
                            </button>
                            <div className="user-dropdown-menu">
                                <Link to={`/${role}/profile`} className="dropdown-item">
                                    <i className="fas fa-user-cog"></i>
                                    <span>Profile</span>
                                </Link>
                                <button onClick={handleLogout} className="dropdown-item">
                                    <i className="fas fa-sign-out-alt"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-wrapper">
                    {/* Page Content - Children are rendered here without any additional title */}
                    <section className="dashboard-content">
                        {children}
                    </section>
                </div>
            </div>
            
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

DashboardLayout.propTypes = {
    title: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['administrator', 'trainer', 'trainee', 'applicant']).isRequired,
    children: PropTypes.node.isRequired
};

export default DashboardLayout;