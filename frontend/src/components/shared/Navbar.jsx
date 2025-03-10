import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/navbar.css';

const Navbar = ({ toggleSidebar, role }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    // Example notifications
    setNotifications([
      { id: 1, type: 'info', message: 'Welcome to JMH Microfinance LMS!', read: false },
      { id: 2, type: 'success', message: 'Profile completed successfully.', read: false },
      { id: 3, type: 'warning', message: 'Pending assessments need your attention.', read: true },
    ]);
    
    // Update time and date
    const updateDateTime = () => {
      const now = new Date();
      
      // Format time as HH:MM AM/PM
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      setCurrentTime(`${formattedHours}:${minutes} ${ampm}`);
      
      // Format date as Month Day, Year
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options).toUpperCase());
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="jmh-navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
          <img src="/assets/images/whitelogo.png" alt="JMH" className="jmh-logo" />
        </div>
        
        {/* Right Section - Time, Date, Notifications, Profile */}
        <div className="navbar-right">
          <div className="time-date-container">
            <div className="current-time">{currentTime}</div>
            <div className="current-date">{currentDate}</div>
          </div>
          
          <div className="navbar-actions">
            {/* Notifications */}
            <div className="notification-container">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)} 
                className="notification-btn"
                aria-label="Notifications"
              >
                <svg className="bell-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.some((n) => !n.read) && <span className="notification-badge"></span>}
              </button>
              
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <h3>Notifications</h3>
                  <ul>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <li key={n.id} className={n.read ? 'read' : ''}>
                          {n.message}
                        </li>
                      ))
                    ) : (
                      <li>No new notifications</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            <div className="profile-container">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="profile-btn"
                aria-label="User Profile"
              >
                <img 
                  src="https://static.vecteezy.com/system/resources/previews/005/544/718/original/profile-icon-design-free-vector.jpg" 
                  alt={user?.fullName || 'User'} 
                  className="user-avatar" 
                />
              </button>
              
              {dropdownOpen && (
                <div className="profile-dropdown">
                  <p>{user?.fullName || 'User'}</p>
                  <Link to="/my-account">My Account</Link>
                  <button onClick={handleLogout}>Log Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;