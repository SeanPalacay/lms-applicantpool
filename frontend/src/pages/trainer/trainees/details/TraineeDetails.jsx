import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Mail, Phone, Calendar, BookOpen, Flag, 
  Award, CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, 
  Bell, BarChart2, ClipboardList
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/TraineeDetails.css';

/**
 * TraineeDetails Component
 * Displays detailed information about a trainee including their programs, milestones, and assessments
 */
const TraineeDetails = () => {
  const { traineeId } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('programs');

  // Fetch trainee data on component mount
  useEffect(() => {
    const fetchTraineeData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Check if user is logged in and has correct role
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch trainee details
        const traineeData = await trainerService.getTraineeDetails(traineeId);
        setTrainee(traineeData);
      } catch (err) {
        console.error('Error fetching trainee data:', err);
        setError('Failed to load trainee details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTraineeData();
  }, [traineeId, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total progress percentage
  const calculateTotalProgress = () => {
    if (!trainee || !trainee.programs || trainee.programs.length === 0) {
      return 0;
    }
    
    return trainee.overall_progress || 0;
  };

  // Get status color class based on status
  const getStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'not_started': return 'status-not-started';
      default: return '';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  // Format score for display
  const formatScore = (score) => {
    if (score === null || score === undefined) return 'N/A';
    // Make sure score is a number before calling toFixed()
    const scoreNum = Number(score);
    if (isNaN(scoreNum)) return 'N/A';
    return `${scoreNum.toFixed(1)}%`;
  };
  // Navigate to progress tracking
  const navigateToProgress = () => {
    navigate(`/trainer/trainees/${traineeId}/progress`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!trainee) {
    return <AlertBanner message="Trainee not found" type="error" />;
  }

  return (
    <div className="trainee-details-container">
      {/* Back navigation */}
      <div className="back-navigation">
        <Link to="/trainer/trainees" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Trainees</span>
        </Link>
      </div>
      
      {/* Profile Overview Card */}
      <div className="card trainee-profile-card">
        <div className="profile-header">
          <div className="trainee-avatar large">
            {trainee.full_name.charAt(0)}
          </div>
          <div className="trainee-info">
            <h2 className="trainee-name">{trainee.full_name}</h2>
            <div className="trainee-details">
              <div className="detail-item">
                <Mail size={16} />
                <span>{trainee.email}</span>
              </div>
              <div className="detail-item">
                <Phone size={16} />
                <span>{trainee.phone || 'No phone number'}</span>
              </div>
              <div className="detail-item">
                <Calendar size={16} />
                <span>Joined: {formatDate(trainee.registration_date)}</span>
              </div>
            </div>
          </div>
          <div className="progress-overview">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path 
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path 
                  className="circle"
                  strokeDasharray={`${calculateTotalProgress()}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {calculateTotalProgress()}%
                </text>
              </svg>
            </div>
            <button onClick={navigateToProgress} className="btn-view-progress">
              <TrendingUp size={16} />
              <span>View Progress</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'programs' ? 'active' : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          <BookOpen size={18} />
          <span>Programs</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          <Flag size={18} />
          <span>Milestones</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          <ClipboardList size={18} />
          <span>Assessments</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <BarChart2 size={18} />
          <span>Performance</span>
        </button>
      </div>
      
      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Enrolled Programs</h3>
          </div>
          
          {trainee.programs && trainee.programs.length > 0 ? (
            <div className="programs-list">
              {trainee.programs.map(program => (
                <div key={program.id} className="program-card">
                  <div className="program-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="program-details">
                    <h4 className="program-title">{program.title}</h4>
                    <div className="program-meta">
                      <span className="program-type">{program.type || 'Regular'}</span>
                      <span className="program-dates">
                        <Calendar size={14} />
                        {formatDate(program.enrollment_date)}
                      </span>
                    </div>
                    <div className="program-progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${program.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="program-progress-details">
                      <span className="progress-percentage">{program.completion_percentage || 0}% complete</span>
                      <div className={`status-badge ${getStatusClass(program.completion_status)}`}>
                        {program.completion_status === 'completed' && <CheckCircle size={14} />}
                        {program.completion_status === 'in_progress' && <Clock size={14} />}
                        {program.completion_status === 'not_started' && <AlertTriangle size={14} />}
                        <span>{getStatusLabel(program.completion_status)}</span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/trainer/programs/${program.id}`} className="program-link">
                    View Program
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              <BookOpen size={48} />
              <p>This trainee is not enrolled in any programs.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Assigned Milestones</h3>
          </div>
          
          {trainee.milestones && trainee.milestones.length > 0 ? (
            <div className="milestones-list">
              {trainee.milestones.map(milestone => (
                <div key={milestone.id} className="milestone-card">
                  <div className="milestone-header">
                    <div className="milestone-icon">
                      <Flag size={20} />
                    </div>
                    <h4 className="milestone-title">{milestone.title}</h4>
                    <div className={`status-badge ${getStatusClass(milestone.status)}`}>
                      {milestone.status === 'completed' && <CheckCircle size={14} />}
                      {milestone.status === 'in_progress' && <Clock size={14} />}
                      {milestone.status === 'not_started' && <AlertTriangle size={14} />}
                      <span>{getStatusLabel(milestone.status)}</span>
                    </div>
                  </div>
                  
                  <div className="milestone-details">
                    <div className="milestone-meta">
                      <span className="milestone-program">
                        <BookOpen size={14} />
                        {milestone.program_title || 'Unknown Program'}
                      </span>
                      <span className="milestone-date">
                        <Calendar size={14} />
                        Due: {formatDate(milestone.due_date)}
                      </span>
                    </div>
                    
                    {milestone.description && (
                      <p className="milestone-description">{milestone.description}</p>
                    )}
                    
                    {milestone.status === 'completed' && milestone.completion_date && (
                      <div className="completion-info">
                        <CheckCircle size={16} className="completion-icon" />
                        <span>Completed on {formatDate(milestone.completion_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/trainer/milestones/${milestone.id}`} className="milestone-link">
                    View Milestone
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              <Flag size={48} />
              <p>No milestones have been assigned to this trainee.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Quiz Attempts & Assessments</h3>
          </div>
          
          {trainee.quiz_attempts && trainee.quiz_attempts.length > 0 ? (
            <div className="assessments-list">
              {trainee.quiz_attempts.map(assessment => (
                <div key={assessment.id} className="assessment-card">
                  <div className="assessment-header">
                    <div className="assessment-icon">
                      <ClipboardList size={20} />
                    </div>
                    <h4 className="assessment-title">{assessment.title || 'Unknown Quiz'}</h4>
                    <div className="assessment-score">
                      <span className={`score ${assessment.score >= (assessment.passing_score || 70) ? 'pass' : 'fail'}`}>
                        {formatScore(assessment.score)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="assessment-details">
                    <div className="assessment-meta">
                      <span className="assessment-program">
                        <BookOpen size={14} />
                        {assessment.program_title || 'Unknown Program'}
                      </span>
                      <span className="assessment-date">
                        <Calendar size={14} />
                        Attempted: {formatDate(assessment.attempt_date)}
                      </span>
                    </div>
                    
                    {assessment.feedback && (
                      <div className="assessment-feedback">
                        <FileText size={16} className="feedback-icon" />
                        <p>{assessment.feedback}</p>
                      </div>
                    )}
                    
                    <div className="assessment-status">
                      {assessment.score >= (assessment.passing_score || 70) ? (
                        <div className="status-badge status-completed">
                          <CheckCircle size={14} />
                          <span>Passed</span>
                        </div>
                      ) : (
                        <div className="status-badge status-not-started">
                          <AlertTriangle size={14} />
                          <span>Failed</span>
                        </div>
                      )}
                      
                      {assessment.passing_score && (
                        <span className="passing-score">
                          Passing score: {assessment.passing_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/trainer/quizzes/${assessment.id}/results`} className="assessment-link">
                    View Results
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              <ClipboardList size={48} />
              <p>No quiz attempts found for this trainee.</p>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Performance Overview</h3>
          </div>

          <div className="performance-overview-grid">
            {/* Performance Metrics Card */}
            <div className="card performance-metrics-card">
              <div className="card-header gradient-blue">
                <div className="header-icon">
                  <BarChart2 size={20} />
                </div>
                <div className="header-content">
                  <h3>Performance Metrics</h3>
                </div>
              </div>
              <div className="card-content">
                <div className="metrics-grid">
                  <div className="metric-box">
                    <div className="metric-value">{trainee.programs ? trainee.programs.length : 0}</div>
                    <div className="metric-label">Programs</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-value">
                      {trainee.quiz_attempts ? 
                        trainee.quiz_attempts.filter(a => a.score >= (a.passing_score || 70)).length : 0}
                    </div>
                    <div className="metric-label">Quizzes Passed</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-value">
                      {trainee.milestones ? 
                        trainee.milestones.filter(m => m.status === 'completed').length : 0}
                    </div>
                    <div className="metric-label">Milestones Completed</div>
                  </div>
                  <div className="metric-box">
                  <div className="metric-value">
                      {trainee.average_quiz_score ? 
                        `${Number(trainee.average_quiz_score).toFixed(1)}%` : 'N/A'}
                  </div>
                    <div className="metric-label">Avg. Quiz Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Notifications Card */}
            <div className="card notifications-card">
              <div className="card-header gradient-amber">
                <div className="header-icon">
                  <Bell size={20} />
                </div>
                <div className="header-content">
                  <h3>Recent Notifications</h3>
                </div>
              </div>
              <div className="card-content">
                {trainee.notifications && trainee.notifications.length > 0 ? (
                  <div className="notifications-list">
                    {trainee.notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className="notification-item">
                        <div className={`notification-icon notification-${notification.type}`}>
                          {notification.type === 'success' && <CheckCircle size={16} />}
                          {notification.type === 'warning' && <AlertTriangle size={16} />}
                          {notification.type === 'error' && <AlertTriangle size={16} />}
                          {notification.type === 'info' && <Bell size={16} />}
                        </div>
                        <div className="notification-content">
                          <strong className="notification-title">{notification.title}</strong>
                          <p>{notification.message}</p>
                          <span className="notification-time">{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <Bell size={32} />
                    <p>No recent notifications</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Incidents Card */}
            <div className="card incidents-card">
              <div className="card-header gradient-rose">
                <div className="header-icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="header-content">
                  <h3>Performance Incidents</h3>
                </div>
              </div>
              <div className="card-content">
                {trainee.performance_incidents && trainee.performance_incidents.length > 0 ? (
                  <div className="incidents-list">
                    {trainee.performance_incidents.map((incident, index) => (
                      <div key={index} className="incident-item">
                        <div className="incident-type">
                          {incident.incident_type === 'low_quiz_score' && (
                            <div className="incident-icon quiz-incident">
                              <ClipboardList size={16} />
                            </div>
                          )}
                          {incident.incident_type === 'policy_violation' && (
                            <div className="incident-icon policy-incident">
                              <AlertTriangle size={16} />
                            </div>
                          )}
                          {incident.incident_type === 'other' && (
                            <div className="incident-icon other-incident">
                              <AlertTriangle size={16} />
                            </div>
                          )}
                        </div>
                        <div className="incident-details">
                          <div className="incident-description">
                            {incident.description}
                          </div>
                          <div className="incident-meta">
                            <span className="incident-date">
                              <Calendar size={14} />
                              {formatDate(incident.incident_date)}
                            </span>
                            {incident.reported_by_name && (
                              <span className="reported-by">
                                <User size={14} />
                                Reported by: {incident.reported_by_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <CheckCircle size={32} />
                    <p>No performance incidents reported</p>
                  </div>
                )}
              </div>
            </div>

            {/* Certificates Card */}
            <div className="card certificates-card">
              <div className="card-header gradient-teal">
                <div className="header-icon">
                  <Award size={20} />
                </div>
                <div className="header-content">
                  <h3>Certificates & Achievements</h3>
                </div>
              </div>
              <div className="card-content">
                {trainee.certificates && trainee.certificates.length > 0 ? (
                  <div className="certificates-list">
                    {trainee.certificates.map((certificate, index) => (
                      <div key={index} className="certificate-item">
                        <div className="certificate-icon">
                          <Award size={24} />
                        </div>
                        <div className="certificate-details">
                          <h4 className="certificate-title">{certificate.title}</h4>
                          <div className="certificate-meta">
                            <span className="certificate-program">
                              <BookOpen size={14} />
                              {certificate.program_title}
                            </span>
                            <span className="certificate-date">
                              <Calendar size={14} />
                              {formatDate(certificate.issue_date)}
                            </span>
                          </div>
                        </div>
                        <Link 
                          to={`/trainer/certificates/${certificate.id}`} 
                          className="certificate-link"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <Award size={32} />
                    <p>No certificates earned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeDetails;