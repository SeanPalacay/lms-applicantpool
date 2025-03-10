import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/ApplicantDashboard.css';

const ApplicantDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        applicantInfo: {
            full_name: '',
            job_role: '',
            department: '',
            status: '',
            evaluation_score: null,
            fst_score: null,
            applied_at: '',
            documents: []
        },
        applicationStatus: '',
        statusTimeline: [],
        alerts: [],
        nextSteps: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.get(
                    'http://localhost:8080/lms-forbes/backend/api/applicant/dashboard.php',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching applicant dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        
        // Refresh data every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'pending';
            case 'shortlisted': return 'success';
            case 'hired': return 'success';
            case 'rejected': return 'danger';
            default: return 'info';
        }
    };

    return (
            <div className="applicant-dashboard">
                {error && <AlertBanner message={error} type="error" />}
                
                {stats.alerts && stats.alerts.length > 0 && (
                    <div className="alerts-section">
                        <h3>Important Notifications</h3>
                        <div className="alerts-container">
                            {stats.alerts.map((alert, index) => (
                                <div key={index} className={`alert-card alert-${alert.type}`}>
                                    <div className="alert-icon">
                                        {alert.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                                        {alert.type === 'info' && <i className="fas fa-info-circle"></i>}
                                        {alert.type === 'success' && <i className="fas fa-check-circle"></i>}
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
                
                <div className="application-status-section">
                    <div className="status-header">
                        <h3>Application Status</h3>
                        <span className={`status-badge status-${getStatusClass(stats.applicationStatus)}`}>
                            {stats.applicationStatus || 'Pending'}
                        </span>
                    </div>
                    
                    <div className="application-timeline">
                        {stats.statusTimeline && stats.statusTimeline.length > 0 ? (
                            <div className="timeline">
                                {stats.statusTimeline.map((item, index) => (
                                    <div key={index} className={`timeline-item ${item.completed ? 'completed' : ''}`}>
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <h4>{item.status}</h4>
                                            <p>{item.description}</p>
                                            {item.date && (
                                                <span className="timeline-date">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data-message">Your application has been received. Status updates will appear here.</p>
                        )}
                    </div>
                </div>
                
                <div className="dashboard-content-grid">
                    <div className="dashboard-section applicant-info">
                        <h3>My Application</h3>
                        <div className="applicant-info-card">
                            <div className="applicant-header">
                                <div className="applicant-name">
                                    <h4>{stats.applicantInfo.full_name}</h4>
                                    <p>{stats.applicantInfo.job_role} - {stats.applicantInfo.department}</p>
                                </div>
                                <div className="application-date">
                                    <span>Applied on: {new Date(stats.applicantInfo.applied_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            
                            <div className="applicant-scores">
                                {stats.applicantInfo.evaluation_score !== null && (
                                    <div className="score-item">
                                        <div className="score-label">Evaluation Score</div>
                                        <div className="score-value">
                                            <div className="circular-progress">
                                                <svg viewBox="0 0 36 36" className="circular-chart">
                                                    <path className="circle-bg"
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path className="circle"
                                                        strokeDasharray={`${stats.applicantInfo.evaluation_score}, 100`}
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <text x="18" y="20.35" className="percentage">{stats.applicantInfo.evaluation_score}%</text>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {stats.applicantInfo.fst_score !== null && (
                                    <div className="score-item">
                                        <div className="score-label">FST Score</div>
                                        <div className="score-value">
                                            <div className="circular-progress">
                                                <svg viewBox="0 0 36 36" className="circular-chart">
                                                    <path className="circle-bg"
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path className="circle"
                                                        strokeDasharray={`${stats.applicantInfo.fst_score}, 100`}
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <text x="18" y="20.35" className="percentage">{stats.applicantInfo.fst_score}%</text>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="applicant-documents">
                                <h4>Submitted Documents</h4>
                                {stats.applicantInfo.documents && stats.applicantInfo.documents.length > 0 ? (
                                    <ul className="document-list">
                                        {stats.applicantInfo.documents.map((doc, index) => (
                                            <li key={index} className="document-item">
                                                <i className="fas fa-file-alt"></i>
                                                <span>{doc.description}</span>
                                                <div className="document-actions">
                                                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="doc-action">
                                                        <i className="fas fa-eye"></i>
                                                    </a>
                                                    <a href={doc.file_path} download className="doc-action">
                                                        <i className="fas fa-download"></i>
                                                    </a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-data-message">No documents submitted yet.</p>
                                )}
                                <div className="document-actions">
                                    <Link to="/applicant/upload" className="btn-primary">
                                        <i className="fas fa-upload"></i> Upload Document
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="dashboard-section next-steps">
                        <h3>Next Steps</h3>
                        {stats.nextSteps && stats.nextSteps.length > 0 ? (
                            <div className="next-steps-list">
                                {stats.nextSteps.map((step, index) => (
                                    <div key={index} className="next-step-card">
                                        <div className="step-number">{index + 1}</div>
                                        <div className="step-content">
                                            <h4>{step.title}</h4>
                                            <p>{step.description}</p>
                                            {step.deadline && (
                                                <p className="step-deadline">
                                                    <i className="far fa-calendar-alt"></i> Deadline: {new Date(step.deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        {step.actionLink && (
                                            <div className="step-action">
                                                <Link to={step.actionLink} className="btn-primary">
                                                    {step.actionText}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="waiting-message">
                                <div className="waiting-icon">
                                    <i className="fas fa-hourglass-half"></i>
                                </div>
                                <h4>Application Under Review</h4>
                                <p>Your application is currently being reviewed. We will update you on the next steps soon.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                        <Link to="/applicant/profile" className="action-btn">
                            <i className="fas fa-user-edit"></i> Edit Profile
                        </Link>
                        <Link to="/applicant/upload" className="action-btn">
                            <i className="fas fa-file-upload"></i> Upload Documents
                        </Link>
                        <Link to="/applicant/messages" className="action-btn">
                            <i className="fas fa-envelope"></i> Messages
                        </Link>
                        <Link to="/applicant/help" className="action-btn">
                            <i className="fas fa-question-circle"></i> Help Center
                        </Link>
                    </div>
                </div>
            </div>
    );
};

export default ApplicantDashboard;