import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';
import './styles/TrainerDashboard.css';

const TrainerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activePrograms: [],
        totalPrograms: 0,
        totalTrainees: 0,
        pendingQuizzes: 0,
        overallProgress: 0,
        traineePerformance: [],
        alerts: [],
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                const authToken = localStorage.getItem('authToken');
                const userRole = localStorage.getItem('role');
                if (!authToken || userRole !== 'trainer') {
                    setError('Access denied. Redirecting to login...');
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                console.log('Fetching trainer dashboard data...');
                const data = await trainerService.getDashboardData();
                console.log('API Response:', data);

                setStats(data);
            } catch (err) {
                console.error('Error fetching trainer dashboard data:', err);
                if (err.message.includes('Authentication') || err.message.includes('login')) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError('Failed to load dashboard data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Refresh data every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
        return () => clearInterval(interval);
    }, [navigate]);

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="trainer-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h2>Trainer Dashboard</h2>
                <p>Welcome back! Here's an overview of your training activities.</p>
            </div>

            {/* Alerts Section */}
            {stats.alerts.length > 0 && (
                <div className="alerts-section">
                    <h3>Alerts & Notifications</h3>
                    <div className="alerts-container">
                        {stats.alerts.map((alert, index) => (
                            <div key={index} className={`alert-card alert-${alert.type}`}>
                                <div className="alert-icon">
                                    {alert.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                                    {alert.type === 'info' && <i className="fas fa-info-circle"></i>}
                                </div>
                                <div className="alert-content">
                                    <h4>{alert.title}</h4>
                                    <p>{alert.message}</p>
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

            {/* Summary Section */}
            <div className="dashboard-summary">
                <div className="summary-card">
                    <div className="stat-icon">
                        <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-details">
                        <h4>{stats.totalPrograms}</h4>
                        <p>Total Programs</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="stat-icon">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                    <div className="stat-details">
                        <h4>{stats.totalTrainees}</h4>
                        <p>Total Trainees</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="stat-icon">
                        <i className="fas fa-tasks"></i>
                    </div>
                    <div className="stat-details">
                        <h4>{stats.pendingQuizzes}</h4>
                        <p>Pending Quizzes</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="stat-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-details">
                        <h4>{stats.overallProgress}%</h4>
                        <p>Overall Progress</p>
                        <div className="progress-bar">
                            <div className="progress-value" style={{ width: `${stats.overallProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Programs Section */}
            <div className="dashboard-section active-programs">
                <h3>Active Programs</h3>
                {stats.activePrograms.length > 0 ? (
                    <div className="programs-list">
                        {stats.activePrograms.map((program) => (
                            <div key={program.id} className="program-card">
                                <h4>{program.title}</h4>
                                <p>{program.description}</p>
                                <div className="program-stats">
                                    <span>{program.enrolled_count} Enrolled</span>
                                    <span>{program.completion_rate}% Complete</span>
                                </div>
                                <Link to={`/trainer/programs/${program.id}`} className="btn-view">View</Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No active programs found.</p>
                )}
            </div>

            {/* Trainee Performance Section */}
            <div className="dashboard-section trainee-performance">
                <h3>Trainee Performance</h3>
                {stats.traineePerformance.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Progress</th>
                                <th>Quiz Avg.</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.traineePerformance.map((trainee) => (
                                <tr key={trainee.id}>
                                    <td>{trainee.full_name}</td>
                                    <td>{trainee.progress}%</td>
                                    <td>{trainee.quiz_average}%</td>
                                    <td>{trainee.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No trainee performance data available.</p>
                )}
            </div>
        </div>
    );
};

export default TrainerDashboard;