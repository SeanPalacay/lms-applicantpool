import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TraineeDashboard.css';

const TraineeDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        user: { full_name: '' },
        enrolledPrograms: [],
        totalEnrolled: 0,
        completedPrograms: 0,
        averageScore: 0,
        upcomingQuizzes: [],
        pendingMilestones: [],
        alerts: []
    });
    const navigate = useNavigate();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('You are not logged in. Please log in to access the dashboard.');
                    setLoading(false);
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                const userRole = localStorage.getItem('userRole');
                if (userRole !== 'trainee') {
                    setError('You do not have permission to access this dashboard.');
                    setLoading(false);
                    setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
                    return;
                }

                const response = await fetch(`http://localhost:8080/lms-forbes/backend/api/trainee/dashboard.php`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Fetch failed:', response.status, errorText);
                    throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                console.error('Error fetching trainee dashboard data:', err);
                setError(`Failed to load dashboard data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // Format due date (for milestones only)
    const formatDueDate = (dateString) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Due Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Due Tomorrow';
        return date.toLocaleDateString();
    };

    // Calculate days remaining (for milestones only)
    const getDaysRemaining = (dateString) => {
        if (!dateString) return null;
        const dueDate = new Date(dateString);
        const today = new Date();
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="trainee-dashboard">
            {error && <AlertBanner message={error} type="error" />}
            <div className="dashboard-header">
                <h2>Trainee Dashboard</h2>
                <p>Welcome, {dashboardData.user.full_name}! Track your progress and stay updated.</p>
            </div>

            {/* Alerts Section (Milestones Only) */}
            {dashboardData.alerts.length > 0 && (
                <div className="alerts-section">
                    <h3>Alerts & Notifications</h3>
                    <div className="alerts-container">
                        {dashboardData.alerts.map((alert, index) => (
                            <div key={index} className={`alert-card alert-${alert.type}`}>
                                <div className="alert-icon">
                                    {alert.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                                    {alert.type === 'info' && <i className="fas fa-info-circle"></i>}
                                </div>
                                <div className="alert-content">
                                    <h4>{alert.title}</h4>
                                    <p>{alert.message} - {formatDueDate(alert.dueDate)}</p>
                                </div>
                                <div className="alert-actions">
                                    <Link to={alert.actionLink} className="alert-action-btn">{alert.actionText}</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-main">
                <div className="dashboard-column">
                    {/* Enrolled Programs */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-graduation-cap"></i> My Programs</h3>
                            <Link to="/trainee/programs" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.enrolledPrograms.length > 0 ? (
                                dashboardData.enrolledPrograms.map((program, index) => (
                                    <div key={index} className="program-progress-item">
                                        <div className="program-info">
                                            <h4>{program.title}</h4>
                                            <Link to={`/trainee/programs/${program.id}`} className="continue-link">
                                                Continue <i className="fas fa-chevron-right"></i>
                                            </Link>
                                        </div>
                                        <div className="progress-container">
                                            <span className="progress-text">
                                                {program.completion_percentage}% Complete
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-book"></i>
                                    <p>You are not enrolled in any programs yet.</p>
                                    <Link to="/trainee/programs/available" className="action-btn">Browse Programs</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Milestones */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-tasks"></i> Pending Milestones</h3>
                        </div>
                        <div className="stat-content">
                            {dashboardData.pendingMilestones.length > 0 ? (
                                dashboardData.pendingMilestones.map((milestone, index) => {
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
                                            </div>
                                            <div className="milestone-date">
                                                <div className="due-date">{formatDueDate(milestone.due_date)}</div>
                                                {daysRemaining !== null && (
                                                    <div className={`days-remaining ${urgencyClass}`}>
                                                        {daysRemaining < 0
                                                            ? `${Math.abs(daysRemaining)} days overdue`
                                                            : daysRemaining === 0
                                                            ? 'Due today'
                                                            : `${daysRemaining} days remaining`}
                                                    </div>
                                                )}
                                                <Link to={`/trainee/programs/${milestone.program_id}/milestones/${milestone.id}`} className="milestone-link">
                                                    Details <i className="fas fa-chevron-right"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-circle"></i>
                                    <p>No pending milestones at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-column">
                    {/* Upcoming Quizzes (No due_date) */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-question-circle"></i> Upcoming Quizzes</h3>
                            <Link to="/trainee/quizzes" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.upcomingQuizzes.length > 0 ? (
                                dashboardData.upcomingQuizzes.map((quiz, index) => (
                                    <div key={index} className="quiz-item">
                                        <div className="quiz-info">
                                            <h4>{quiz.title}</h4>
                                            <p className="program-name">{quiz.program_title}</p>
                                            <div className="quiz-details">
                                                <span className="time-limit">
                                                    <i className="fas fa-clock"></i> {quiz.time_limit} minutes
                                                </span>
                                            </div>
                                        </div>
                                        <div className="quiz-actions">
                                            <Link to={`/trainee/quizzes/${quiz.id}`} className="take-quiz-btn">
                                                Take Quiz <i className="fas fa-play-circle"></i>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-double"></i>
                                    <p>No pending quizzes at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Learning Progress */}
                    {(dashboardData.enrolledPrograms.length > 0 || dashboardData.completedPrograms > 0) && (
                        <div className="stat-card">
                            <div className="card-header">
                                <h3><i className="fas fa-chart-pie"></i> My Learning Progress</h3>
                            </div>
                            <div className="stat-content">
                                <div className="progress-overview">
                                    <div className="progress-stats">
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.completedPrograms}</span>
                                            <span className="stat-label">Completed</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.enrolledPrograms.length}</span>
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
                                                        { name: 'Completed', value: dashboardData.completedPrograms },
                                                        { name: 'In Progress', value: dashboardData.enrolledPrograms.length }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={60}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                </div>
            </div>
        </div>
    );
};

export default TraineeDashboard;