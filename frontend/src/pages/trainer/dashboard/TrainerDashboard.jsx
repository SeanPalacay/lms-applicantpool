import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TrainerDashboard.css'; // Create this CSS file

const TrainerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        user: { full_name: '' },
        createdPrograms: [],
        totalPrograms: 0,
        activeTrainees: 0,
        createdQuizzes: [],
        createdMilestones: [],
        traineeProgress: [],
        alerts: []
    });
    const navigate = useNavigate();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
                if (userRole !== 'trainer') {
                    setError('You do not have permission to access this dashboard.');
                    setLoading(false);
                    setTimeout(() => navigate(`/${userRole}/dashboard`), 2000);
                    return;
                }

                const response = await fetch(`http://localhost:8080/lms-forbes/backend/api/trainer/dashboard.php`, {
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
                console.error('Error fetching trainer dashboard data:', err);
                setError(`Failed to load dashboard data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="trainer-dashboard">
            {error && <AlertBanner message={error} type="error" />}
            <div className="dashboard-header">
                <h2>Trainer Dashboard</h2>
                <p>Welcome, {dashboardData.user.full_name}! Manage your training content and track trainee progress.</p>
            </div>

            {/* Alerts Section */}
            {dashboardData.alerts.length > 0 && (
                <div className="alerts-section">
                    <h3>Alerts & Notifications</h3>
                    <div className="alerts-container">
                        {dashboardData.alerts.map((alert, index) => (
                            <div key={index} className={`alert-card alert-${alert.type}`}>
                                <div className="alert-icon">
                                    <i className="fas fa-exclamation-triangle"></i>
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
                    {/* Created Programs */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-graduation-cap"></i> My Programs</h3>
                            <Link to="/trainer/programs" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.createdPrograms.length > 0 ? (
                                dashboardData.createdPrograms.map((program, index) => (
                                    <div key={index} className="program-item">
                                        <h4>{program.title}</h4>
                                        <p>{program.type} - Created: {new Date(program.created_at).toLocaleDateString()}</p>
                                        <Link to={`/trainer/programs/${program.id}`} className="continue-link">
                                            Manage <i className="fas fa-chevron-right"></i>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-book"></i>
                                    <p>You haven’t created any programs yet.</p>
                                    <Link to="/trainer/programs/create" className="action-btn">Create Program</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Created Milestones */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-tasks"></i> Recent Milestones</h3>
                        </div>
                        <div className="stat-content">
                            {dashboardData.createdMilestones.length > 0 ? (
                                dashboardData.createdMilestones.map((milestone, index) => (
                                    <div key={index} className="milestone-item">
                                        <div className="milestone-info">
                                            <h4>{milestone.title}</h4>
                                            <p className="program-name">{milestone.program_title}</p>
                                        </div>
                                        <div className="milestone-date">
                                            <div className="due-date">{formatDueDate(milestone.due_date)}</div>
                                            <Link to={`/trainer/milestones/${milestone.id}`} className="milestone-link">
                                                Details <i className="fas fa-chevron-right"></i>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-circle"></i>
                                    <p>No milestones created yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-column">
                    {/* Created Quizzes */}
                    <div className="stat-card">
                        <div className="card-header">
                            <h3><i className="fas fa-question-circle"></i> Recent Quizzes</h3>
                            <Link to="/trainer/quizzes" className="view-all">View All</Link>
                        </div>
                        <div className="stat-content">
                            {dashboardData.createdQuizzes.length > 0 ? (
                                dashboardData.createdQuizzes.map((quiz, index) => (
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
                                            <Link to={`/trainer/quizzes/${quiz.id}`} className="take-quiz-btn">
                                                Edit <i className="fas fa-edit"></i>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-check-double"></i>
                                    <p>No quizzes created yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trainee Progress */}
                    {dashboardData.traineeProgress.length > 0 && (
                        <div className="stat-card">
                            <div className="card-header">
                                <h3><i className="fas fa-chart-pie"></i> Trainee Progress</h3>
                            </div>
                            <div className="stat-content">
                                <div className="progress-overview">
                                    <div className="progress-stats">
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.totalPrograms}</span>
                                            <span className="stat-label">Programs</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-value">{dashboardData.activeTrainees}</span>
                                            <span className="stat-label">Active Trainees</span>
                                        </div>
                                    </div>
                                    {dashboardData.traineeProgress.map((prog, index) => (
                                        <div key={index} className="progress-item">
                                            <h4>{prog.title}</h4>
                                            <p>Enrolled: {prog.enrolled_count} | Avg. Completion: {prog.avg_completion ? prog.avg_completion.toFixed(2) : 0}% | Quiz Attempts: {prog.quiz_attempts}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerDashboard;