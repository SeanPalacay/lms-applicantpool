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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {error && <AlertBanner type="error" message={error} />}

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>Welcome, {user.full_name}</h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Here's an overview of your learning progress and activities.
        </p>
      </div>

      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>Alerts & Notifications</h2>
            <div style={{ height: '2px', background: '#ddd' }}></div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < alerts.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  gap: '15px',
                  background: alert.type === 'warning' ? '#fff3cd' : '#cce5ff'
                }}
              >
                <div style={{ 
                  color: alert.type === 'warning' ? '#856404' : '#004085',
                  flexShrink: 0 
                }}>
                  {alert.type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{alert.title || 'Alert'}</h4>
                  <p style={{ fontSize: '14px', margin: 0, color: '#666' }}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #007bff, #00b7ff)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <GraduationCap size={20} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>My Programs</h3>
              <Link to="/trainee/enrollments" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '15px' }}>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  style={{ 
                    paddingBottom: '15px', 
                    marginBottom: '15px', 
                    borderBottom: enrollments.length > 1 ? '1px solid #eee' : 'none',
                    ':last-child': { borderBottom: 'none', marginBottom: 0 }
                  }}
                >
                  <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{enrollment.program_title}</h4>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: '#eee', 
                      borderRadius: '3px', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${enrollment.completion_percentage}%`, 
                        height: '100%', 
                        background: '#007bff' 
                      }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#666' }}>{enrollment.completion_percentage}% Complete</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} /> Enrolled on: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </p>
                  <Link 
                    to={`/trainee/programs/${enrollment.id}`} 
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'none', 
                      fontSize: '14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}
                  >
                    Continue Learning <ChevronRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 15px 0' }}>
                  You have not enrolled in any programs yet.
                </p>
                <Link 
                  to="/trainee/browse-programs" 
                  style={{ 
                    padding: '8px 15px', 
                    background: '#007bff', 
                    color: 'white', 
                    borderRadius: '4px', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  Browse Programs
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #7209b7, #b517ff)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <BookOpen size={20} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Recent Quizzes</h3>
              <Link to="/trainee/assessments" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '15px' }}>
            {quizAttempts.length > 0 ? (
              quizAttempts.map((quiz) => (
                <div 
                  key={quiz.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    paddingBottom: '15px', 
                    marginBottom: '15px', 
                    borderBottom: quizAttempts.length > 1 ? '1px solid #eee' : 'none',
                    ':last-child': { borderBottom: 'none', marginBottom: 0 }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{quiz.quiz_title}</h4>
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      background: quiz.score >= 70 ? '#d4edda' : '#f8d7da', 
                      color: quiz.score >= 70 ? '#155724' : '#721c24', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      marginBottom: '5px'
                    }}>
                      Score: {quiz.score}
                    </div>
                    {quiz.feedback && (
                      <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>{quiz.feedback}</p>
                    )}
                    <p style={{ fontSize: '14px', color: '#666', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} /> {new Date(quiz.attempt_date).toLocaleString()}
                    </p>
                  </div>  
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>No quiz attempts recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #ff8c00, #ffbc00)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <CheckSquare size={20} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Milestone Progress</h3>
              <Link to="/trainee/milestones" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '15px' }}>
            {milestoneStatus.length > 0 ? (
              milestoneStatus.map((milestone) => (
                <div 
                  key={milestone.milestone_id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    paddingBottom: '15px', 
                    marginBottom: '15px', 
                    borderBottom: milestoneStatus.length > 1 ? '1px solid #eee' : 'none',
                    ':last-child': { borderBottom: 'none', marginBottom: 0 }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{milestone.title}</h4>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px 0' }}>{milestone.program_title}</p>
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      background: milestone.status.toLowerCase() === 'completed' ? '#d4edda' : 
                                 milestone.status.toLowerCase() === 'in_progress' ? '#cce5ff' : '#fff3cd',
                      color: milestone.status.toLowerCase() === 'completed' ? '#155724' : 
                            milestone.status.toLowerCase() === 'in_progress' ? '#004085' : '#856404'
                    }}>
                      {milestone.status}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                    </div>
                    {milestone.completion_date && (
                      <div style={{ fontSize: '12px', color: '#28a745' }}>
                        Completed: {new Date(milestone.completion_date).toLocaleDateString()}
                      </div>
                    )}
                    <Link 
                      to={`/trainee/milestones/${milestone.milestone_id}`} 
                      style={{ 
                        color: '#ff8c00', 
                        textDecoration: 'none', 
                        fontSize: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        marginTop: '5px'
                      }}
                    >
                      Details <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>No milestones to display.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #00b7b7, #00e0e0)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <Bell size={20} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Recent Notifications</h3>
              <Link to="/notifications" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                View All
              </Link>
            </div>
          </div>
          <div style={{ padding: '15px' }}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  style={{ 
                    paddingBottom: '15px', 
                    marginBottom: '15px', 
                    borderBottom: notifications.length > 1 ? '1px solid #eee' : 'none',
                    ':last-child': { borderBottom: 'none', marginBottom: 0 }
                  }}
                >
                  <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{notification.title}</h4>
                  <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px 0' }}>{notification.message}</p>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} /> {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>You have no recent notifications.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeDashboard;