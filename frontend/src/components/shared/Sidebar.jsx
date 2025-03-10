import React from 'react';
import { NavLink } from 'react-router-dom';
import './styles/sidebar.css';

const Sidebar = ({ isOpen, role }) => {
  // Define navigation items based on user role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
          { to: '/admin/user-management', icon: '👥', label: 'Manage Users' },
          { to: '/admin/reports', icon: '📈', label: 'Assessment Reports' },
          { to: '/admin/applicant-dashboard', icon: '👔', label: 'Applicant Pooling' },
          { to: '/profile', icon: '👤', label: 'Profile' }
        ];
      case 'trainer':
        return [
          { to: '/trainer/dashboard', icon: '📊', label: 'Dashboard' },
          { to: '/trainer/assessments', icon: '📝', label: 'Assessments' }, // Updated to unified assessments page
          { to: '/profile', icon: '👤', label: 'Profile' }
        ];
      case 'trainee':
        return [
          { to: '/trainee/dashboard', icon: '📊', label: 'Dashboard' },
          { to: '/trainee/assessments', icon: '📝', label: 'My Assessments' },
          { to: '/profile', icon: '👤', label: 'Profile' }
        ];
      case 'applicant':
        return [
          { to: '/applicant/dashboard', icon: '📊', label: 'Dashboard' },
          { to: '/applicant/upload', icon: '📤', label: 'Upload Application' },
          { to: '/applicant/profile', icon: '👔', label: 'My Application' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>LMS Portal</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.to} 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          localStorage.removeItem('user_id');
          window.location.href = '/login';
        }}>
          <span className="sidebar-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;