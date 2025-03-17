import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  CheckSquare, 
  Bell, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Calendar, 
  Clock 
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import traineeService from '../../../services/traineeService';
import './styles/TraineeDashboard.css';

const TraineeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    user: { full_name: '', email: '', role: '' },
    enrollments: [],
    quizAttempts: [],
    milestoneStatus: [],
    notifications: [],
    alerts: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('No token found. Please log in first.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 1500);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainee') {
          setError('You do not have permission to access this dashboard.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
          return;
        }

        const data = await traineeService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching trainee dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <LoadingSpinner />;

  const {
    user,
    enrollments,
    quizAttempts,
    milestoneStatus,
    notifications,
    alerts
  } = dashboardData;

  return (
    <div className="trainee-dashboard">
      {error && <AlertBanner type="error" message={error} />}

      <div className="welcome-section">
        <h1>Welcome, {user.full_name}</h1>
        <p>Here's an overview of your learning progress and activities.</p>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2>Alerts & Notifications</h2>
            <div className="header-line"></div>
          </div>
          <div className="alerts-container">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.type || 'info'}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="alert-content">
                  <h4>{alert.title || 'Alert'}</h4>
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Enrollments Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <GraduationCap size={20} />
            </div>
            <div className="header-content">
              <h3>My Programs</h3>
              <Link to="/trainee/enrollments" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="program-item">
                  <h4>{enrollment.program_title}</h4>
                  <div className="program-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${enrollment.completion_percentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{enrollment.completion_percentage}% Complete</span>
                  </div>
                  <p>
                    <Clock size={14} className="icon-inline" /> Enrolled on: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </p>
                  <Link to={`/trainee/programs/${enrollment.id}`} className="continue-link">
                    Continue Learning <ChevronRight size={14} className="icon-inline" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>You have not enrolled in any programs yet.</p>
                <div className="card-actions">
                  <Link to="/trainee/browse-programs" className="action-button primary">
                    Browse Programs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Attempts Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <BookOpen size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Quizzes</h3>
              <Link to="/trainee/quizzes" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {quizAttempts.length > 0 ? (
              quizAttempts.map((quiz) => (
                <div key={quiz.id} className="quiz-item">
                  <div className="quiz-info">
                    <h4>{quiz.quiz_title}</h4>
                    <div className="quiz-score">
                      <div className="score-badge">
                        Score: {quiz.score}
                      </div>
                    </div>
                    {quiz.feedback && <p className="quiz-feedback">{quiz.feedback}</p>}
                    <p className="attempt-date">
                      <Clock size={14} className="icon-inline" /> {new Date(quiz.attempt_date).toLocaleString()}
                    </p>
                  </div>
                  <div className="quiz-actions">
                    <Link to={`/trainee/quizzes/${quiz.id}`} className="review-quiz-btn">
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No quiz attempts recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Status Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <CheckSquare size={20} />
            </div>
            <div className="header-content">
              <h3>Milestone Progress</h3>
              <Link to="/trainee/milestones" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {milestoneStatus.length > 0 ? (
              milestoneStatus.map((milestone) => (
                <div key={milestone.milestone_id} className="milestone-item">
                  <div className="milestone-info">
                    <h4>{milestone.title}</h4>
                    <p className="program-name">{milestone.program_title}</p>
                    <div className={`milestone-status status-${milestone.status.toLowerCase()}`}>
                      {milestone.status}
                    </div>
                  </div>
                  <div className="milestone-date">
                    <div className="due-date">Due: {new Date(milestone.due_date).toLocaleDateString()}</div>
                    {milestone.completion_date && (
                      <div className="completed-date">
                        Completed: {new Date(milestone.completion_date).toLocaleDateString()}
                      </div>
                    )}
                    <Link to={`/trainee/milestones/${milestone.milestone_id}`} className="milestone-link">
                      Details <ChevronRight size={12} className="icon-inline" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No milestones to display.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <Bell size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Notifications</h3>
              <Link to="/notifications" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className={`notification-item notif-${notification.type}`}>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <div className="notification-time">
                      <Calendar size={12} className="icon-inline" /> {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>You have no recent notifications.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeDashboard;