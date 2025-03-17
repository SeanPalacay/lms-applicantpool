// src/components/shared/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Filter,
  ArrowLeft,
  CheckSquare,
  Calendar,
  Clock
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import AlertBanner from './AlertBanner';
import './styles/Notifications.css';

const Notifications = ({ standalone = true }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    read: '',
    date: ''
  });
  
  const userRole = localStorage.getItem('userRole') || 'applicant';

  const notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'info', label: 'Information' },
    { value: 'warning', label: 'Warning' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' }
  ];

  const readOptions = [
    { value: '', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'read', label: 'Read Only' }
  ];

  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to view notifications.');
          setLoading(false);
          if (standalone) {
            setTimeout(() => navigate('/login'), 2000);
          }
          return;
        }
        
        // Try to get notifications from dashboard data if possible
        let notificationsData = [];
        
        try {
          // Use the applicantService to get dashboard data which includes notifications
          const dashboardModule = await import('../../services/applicantService');
          const applicantService = dashboardModule.default;
          
          const dashboardData = await applicantService.getDashboardData();
          if (dashboardData && dashboardData.notifications) {
            notificationsData = dashboardData.notifications;
          }
        } catch (serviceError) {
          console.warn('Could not fetch notifications from service:', serviceError);
          
          // Fallback to mock data if service is not available
          notificationsData = [
            {
              id: 1,
              type: 'success',
              title: 'Profile Updated',
              message: 'Your profile was updated successfully.',
              created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
              read_at: null
            },
            {
              id: 2,
              type: 'info',
              title: 'New Program Added',
              message: 'A new program "Advanced React Training" has been added.',
              created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
              read_at: null
            },
            {
              id: 3,
              type: 'warning',
              title: 'Quiz Deadline Approaching',
              message: 'You have a quiz due in 24 hours.',
              created_at: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
              read_at: null
            },
            {
              id: 4,
              type: 'error',
              title: 'Milestone Overdue',
              message: 'You have missed the deadline for submitting your milestone.',
              created_at: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 days ago
              read_at: null
            },
            {
              id: 5,
              type: 'info',
              title: 'System Maintenance',
              message: 'The system will be down for maintenance on Sunday from 2AM to 4AM.',
              created_at: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
              read_at: new Date(Date.now() - 70 * 3600000).toISOString() // Read 2 hours after receiving
            }
          ];
        }
        
        setNotifications(notificationsData);
        setFilteredNotifications(notificationsData);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate, standalone]);

  useEffect(() => {
    // Apply filters
    let results = [...notifications];
    
    // Filter by type
    if (filters.type) {
      results = results.filter(notification => notification.type === filters.type);
    }
    
    // Filter by read status
    if (filters.read === 'read') {
      results = results.filter(notification => notification.read_at !== null);
    } else if (filters.read === 'unread') {
      results = results.filter(notification => notification.read_at === null);
    }
    
    // Filter by date
    if (filters.date) {
      const now = new Date();
      let dateThreshold;
      
      switch (filters.date) {
        case 'today':
          dateThreshold = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateThreshold = new Date(now.setDate(now.getDate() - now.getDay()));
          dateThreshold.setHours(0, 0, 0, 0);
          break;
        case 'month':
          dateThreshold = new Date(now.setDate(1));
          dateThreshold.setHours(0, 0, 0, 0);
          break;
        default:
          dateThreshold = null;
      }
      
      if (dateThreshold) {
        results = results.filter(notification => new Date(notification.created_at) >= dateThreshold);
      }
    }
    
    setFilteredNotifications(results);
  }, [notifications, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      read: '',
      date: ''
    });
  };

  const markAsRead = async (notificationId) => {
    try {
      // For demonstration, we're using a mock update
      // In a real application, you would call your API service
      // await apiService.markNotificationAsRead(notificationId);
      
      // Update local state
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      // For demonstration, we're using a mock update
      // In a real application, you would call your API service
      // await apiService.markAllNotificationsAsRead();
      
      // Update local state
      const updatedNotifications = notifications.map(notification =>
        notification.read_at === null
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read. Please try again.');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // For demonstration, we're using a mock update
      // In a real application, you would call your API service
      // await apiService.deleteNotification(notificationId);
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification. Please try again.');
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getNotificationIcon = (type, size = 20) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={size} />;
      case 'warning':
        return <AlertTriangle size={size} />;
      case 'error':
        return <XCircle size={size} />;
      case 'info':
      default:
        return <Info size={size} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Main content to render
  const notificationsContent = (
    <div className="notifications-container">
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {standalone && (
        <div className="notifications-header">
          <div className="back-link" onClick={goBack}>
            <ArrowLeft size={16} className="icon-inline" />
            <span>Back</span>
          </div>
          
          <div className="header-actions">
            <button 
              className={`filter-toggle ${filterOpen ? 'active' : ''}`} 
              onClick={toggleFilter}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
            
            <button className="mark-all-read" onClick={markAllAsRead}>
              <CheckSquare size={16} className="icon-inline" />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>
      )}
      
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="type">Notification Type</label>
                <select 
                  id="type" 
                  name="type" 
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  {notificationTypes.map((type, index) => (
                    <option key={index} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="read">Read Status</label>
                <select 
                  id="read" 
                  name="read" 
                  value={filters.read}
                  onChange={handleFilterChange}
                >
                  {readOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="date">Time Period</label>
                <select 
                  id="date" 
                  name="date" 
                  value={filters.date}
                  onChange={handleFilterChange}
                >
                  {dateOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-actions">
                <button className="reset-filters" onClick={resetFilters}>
                  <X size={14} className="icon-inline" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read_at ? 'read' : 'unread'}`}
              onClick={() => {
                if (!notification.read_at) {
                  markAsRead(notification.id);
                }
              }}
            >
              <div className={`notification-icon ${notification.type}`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <div className="notification-actions">
                    {!notification.read_at && (
                      <button 
                        className="mark-read-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <CheckSquare size={16} />
                      </button>
                    )}
                    <button 
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-meta">
                  <div className="notification-time">
                    <Clock size={14} className="icon-inline" />
                    <span>{formatTimeAgo(notification.created_at)}</span>
                  </div>
                  
                  {notification.read_at && (
                    <div className="notification-read-status">
                      <CheckCircle size={14} className="icon-inline" />
                      <span>Read</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <Bell size={48} className="no-notifications-icon" />
            <h3>No Notifications</h3>
            <p>You don't have any notifications that match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );

  // If used as a standalone page, wrap in main container; otherwise, return just the notifications content
  if (standalone) {
    return (
      <div className="notifications-page-container">
        {notificationsContent}
      </div>
    );
  }

  return notificationsContent;
};

export default Notifications;