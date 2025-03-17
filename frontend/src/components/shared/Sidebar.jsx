import React from 'react';
import './styles/sidebar.css';

const Sidebar = ({ isOpen }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>LMS Portal</h2>
      </div>
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