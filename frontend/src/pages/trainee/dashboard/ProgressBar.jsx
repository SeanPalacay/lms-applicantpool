import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import ProgressBar from '../../../components/shared/ProgressBar';
import './styles/TraineeDashboard.css';

const TraineeDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        user: { full_name: '' },
        enrolledPrograms: [],
        programProgress: [],
        upcomingQuizzes: [],
        recentQuizResults: [],
        completedPrograms: [],
        inProgressMilestones: [],
        alerts: []
    });
    const navigate = useNavigate();

    // Colors for charts and progress bars
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
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
                
                // Check if user has trainee role
                const userRole = localStorage.getItem('userRole');
                if (userRole !== 'trainee') {
                    setError('You do not have permission to access this dashboard.');
                    setLoading(false);
                    // Redirect to appropriate dashboard
                    setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
                    return;
                }
                
                // Fetch trainee dashboard data
                const response = await fetch(`http://localhost:8080/lms-forbes/backend/api/trainee/dashboard.php`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                setDashboardData(data);
                
            } catch (err) {
                console.error('Error fetching trainee dashboard data:', err);
                
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

    // Format due date
    const formatDueDate = (dateString) => {
        if (!dateString) return 'No due date';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Check if due date is today or tomorrow
        if (date.toDateString() === today.toDateString()) {
            return 'Due Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Due Tomorrow';
        }
        
        // Otherwise show formatted date
        return new Date(dateString).toLocaleDateString();
    };
    
    // Calculate days remaining
    const getDaysRemaining = (dateString) => {
        if (!dateString) return null;
        
        const dueDate = new Date(dateString);
        const today = new Date();
        
        // Set time to midnight for accurate day calculation
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // Calculate difference in days
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="trainee-dashboard">
            {error && <AlertBanner message={error} type="error" />}
            
            {/* Header Welcome Section */}
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h2>Trainee Dashboard</h2>
                    <p>Welcome, {dashboardData.user.full_name}! Track your progress and stay updated with your training.</p>
                </div>
            </div>
            
            {/* Alerts Section */}
            {dashboardData.alerts && dashboardData.alerts.length > 0 && (
                <div className="alerts-section">
                    <h3>Alerts & Notifications</h3>
                    <div className="alerts-container">
                        {dashboardData.alerts.map((alert, index) => (
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
                                </div>
                                <div className="alert-actions">
                                    {alert.actionLink && (
                                        <Link to={alert.actionLink} className="alert-action-btn">
                                            {alert.actionText || 'View'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Dashboard Content */}
            <div className="dashboard-main">
                {/* Left Column */}
                <div className="dashboard-column">
                    {/* Program Progress */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-graduation-cap"></i> My Programs</h3>
                            <Link to="/trainee/programs" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.programProgress && dashboardData.programProgress.length > 0 ? (
                                <div className="program-progress-container">
                                    {dashboardData.programProgress.map((program, index) => (
                                        <div key={index} className="program-progress-item">
                                            <div className="program-info">
                                                <h4>{program.title}</h4>
                                                <Link to={`/trainee/programs/${program.id}`} className="continue-link">
                                                    Continue <i className="fas fa-chevron-right"></i>
                                                </Link>
                                            </div>
                                            <div className="progress-container">
                                                <ProgressBar 
                                                    percentage={program.progress} 
                                                    color={COLORS[index % COLORS.length]} 
                                                />
                                                <span className="progress-text">{program.progress}% Complete</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-book"></i>
                                    <p>You are not enrolled in any programs yet.</p>
                                    <Link to="/trainee/programs/available" className="action-btn">
                                        Browse Available Programs
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Upcoming Milestones */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-tasks"></i> Upcoming Milestones</h3>
                        </div>
                        <div className="stat-content">
                            {dashboardData.inProgressMilestones && dashboardData.inProgressMilestones.length > 0 ? (
                                <div className="milestone-list">
                                    {dashboardData.inProgressMilestones.map((milestone, index) => {
                                        const daysRemaining = getDaysRemaining(milestone.due_date);
                                        let urgencyClass = '';
                                        
                                        if (daysRemaining !== null) {
                                            if (daysRemaining < 0) urgencyClass = 'overdue';
                                            else if (daysRemaining <= 2) urgencyClass = 'urgent';
                                            else if (daysRemaining <= 7) urgencyClass = 'upcoming';
                                        }
                                        
                                        return (
                                            <div key={index} className={`milestone-item ${urgencyClass}`}>
                                                <div className="milestone-info">
                                                    <h4>{milestone.title}</h4>
                                                    <p className="program-name">{milestone.program_title}</p>
                                                    <p className="milestone-status">
                                                        Status: <span className={`status-${milestone.status}`}>
                                                            {milestone.status.replace('_', ' ')}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="milestone-date">
                                                    <div className="due-date">
                                                        {formatDueDate(milestone.due_date)}
                                                    </div>
                                                    {daysRemaining !== null && (
                                                        <div className={`days-remaining ${urgencyClass}`}>
                                                            {daysRemaining < 0 
                                                                ? `${Math.abs(daysRemaining)} days overdue` 
                                                                : daysRemaining === 0 
                                                                    ? 'Due today'
                                                                    : `${daysRemaining} days remaining`
                                                            }
                                                        </div>
                                                    )}
                                                    <Link to={`/trainee/programs/${milestone.program_id}/milestones/${milestone.id}`} className="milestone-link">
                                                        Details <i className="fas fa-chevron-right"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-circle"></i>
                                    <p>You have no upcoming milestones at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="dashboard-column">
                    {/* Upcoming Quizzes */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-question-circle"></i> Upcoming Quizzes</h3>
                            <Link to="/trainee/quizzes" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.upcomingQuizzes && dashboardData.upcomingQuizzes.length > 0 ? (
                                <div className="quiz-list">
                                    {dashboardData.upcomingQuizzes.map((quiz, index) => (
                                        <div key={index} className="quiz-item">
                                            <div className="quiz-info">
                                                <h4>{quiz.title}</h4>
                                                <p className="program-name">{quiz.program_title}</p>
                                                <div className="quiz-details">
                                                    <span className="time-limit">
                                                        <i className="fas fa-clock"></i> {quiz.time_limit} minutes
                                                    </span>
                                                    <span className="passing-score">
                                                        <i className="fas fa-percentage"></i> Pass: {quiz.passing_score}%
                                                    </span>
                                                    {quiz.attempt_count > 0 && (
                                                        <span className="attempts">
                                                            <i className="fas fa-redo"></i> Attempts: {quiz.attempt_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="quiz-actions">
                                                <Link to={`/trainee/quizzes/${quiz.id}`} className="take-quiz-btn">
                                                    Take Quiz <i className="fas fa-play-circle"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-double"></i>
                                    <p>You have no pending quizzes. All caught up!</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Recent Quiz Results */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-chart-line"></i> Recent Quiz Results</h3>
                        </div>
                        <div className="stat-content">
                            {dashboardData.recentQuizResults && dashboardData.recentQuizResults.length > 0 ? (
                                <div className="results-list">
                                    {dashboardData.recentQuizResults.map((result, index) => (
                                        <div key={index} className="result-item">
                                            <div className="result-info">
                                                <h4>{result.quiz_title}</h4>
                                                <p className="program-name">{result.program_title}</p>
                                                <p className="attempt-date">
                                                    {new Date(result.attempt_date).toLocaleDateString()} at{' '}
                                                    {new Date(result.attempt_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <div className="result-score">
                                                <div className={`score-circle ${result.passed ? 'passed' : 'failed'}`}>
                                                    <span className="score-value">{result.score}%</span>
                                                </div>
                                                <p className={`result-status ${result.passed ? 'passed' : 'failed'}`}>
                                                    {result.passed ? 'Passed' : 'Failed'}
                                                </p>
                                                <Link to={`/trainee/quizzes/${result.quiz_id}/results/${result.id}`} className="view-results-link">
                                                    View Results
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-clipboard-list"></i>
                                    <p>You haven't taken any quizzes yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Overall Progress Overview */}
                    {(dashboardData.programProgress.length > 0 || dashboardData.completedPrograms.length > 0) && (
                        <div className="stat-card">
                            <div className="card-header">
                                <h3><i className="fas fa-chart-pie"></i> My Learning Progress</h3>
                            </div>
                            <div className="stat-content">
                                <div className="progress-overview">
                                    <div className="progress-stats">
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.completedPrograms.length}</span>
                                            <span className="stat-label">Completed</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.programProgress.length}</span>
                                            <span className="stat-label">In Progress</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.upcomingQuizzes.length}</span>
                                            <span className="stat-label">Pending Quizzes</span>
                                        </div>
                                    </div>
                                    
                                    <div className="chart-container">
                                        <h4>Program Completion Status</h4>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Completed', value: dashboardData.completedPrograms.length },
                                                        { name: 'In Progress', value: dashboardData.programProgress.length }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={60}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    <Cell fill="#4CAF50" />
                                                    <Cell fill="#2196F3" />
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                        </div>
                        <div className="quick-actions">
                            <div className="action-grid">
                                <Link to="/trainee/programs" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-book-open"></i>
                                    </div>
                                    <div className="action-label">My Programs</div>
                                </Link>
                                <Link to="/trainee/quizzes" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-question-circle"></i>
                                    </div>
                                    <div className="action-label">Take Quizzes</div>
                                </Link>
                                <Link to="/trainee/milestones" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-flag-checkered"></i>
                                    </div>
                                    <div className="action-label">My Milestones</div>
                                </Link>
                                <Link to="/trainee/results" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-chart-bar"></i>
                                    </div>
                                    <div className="action-label">View Results</div>
                                </Link>
                                <Link to="/trainee/profile" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="action-label">My Profile</div>
                                </Link>
                                <Link to="/trainee/help" className="action-card">
                                    <div className="action-icon">
                                        <i className="fas fa-question"></i>
                                    </div>
                                    <div className="action-label">Help</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraineeDashboard