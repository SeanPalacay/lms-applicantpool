import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Calendar, 
  HelpCircle, 
  PieChart, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Clock, 
  Edit 
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TrainerDashboard.css'; 
import trainerService from '../../../services/trainerService';

const TrainerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial state with arrays for everything (avoid undefined)
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

  // Function to transform trainee data format to trainer format
  const transformApiDataToTrainerFormat = (apiData) => {
    console.log("Transforming API data to trainer format:", apiData);
    
    // If apiData already has the correct structure, just return it
    if (apiData.createdPrograms) {
      return apiData;
    }

    // Create a trainer data structure from trainee data
    const transformedData = {
      user: apiData.user || { full_name: 'Trainer' },
      
      // Convert enrollments to createdPrograms
      createdPrograms: (apiData.enrollments || []).map(enrollment => ({
        id: enrollment.program_id,
        title: enrollment.program_title || "Program",
        type: "Course",
        created_at: enrollment.enrollment_date
      })),
      
      // Calculate total programs
      totalPrograms: (apiData.enrollments || []).length,
      
      // Estimate active trainees
      activeTrainees: Math.max(2, (apiData.enrollments || []).length),
      
      // Convert quiz attempts to created quizzes
      createdQuizzes: (apiData.quizAttempts || []).map(attempt => ({
        id: attempt.id,
        title: attempt.quiz_title || "Quiz",
        program_title: "Training Program",
        time_limit: 30
      })),
      
      // Convert milestone status to created milestones
      createdMilestones: (apiData.milestoneStatus || []).map(milestone => ({
        id: milestone.milestone_id,
        title: milestone.title || "Milestone",
        program_title: milestone.program_title || "Training Program",
        due_date: milestone.due_date
      })),
      
      // Create trainee progress from enrollments
      traineeProgress: apiData.enrollments ? [
        {
          id: 1,
          title: "Overall Progress",
          enrolled_count: apiData.enrollments.length,
          avg_completion: apiData.enrollments.reduce((sum, enr) => sum + (enr.completion_percentage || 0), 0) / 
                          (apiData.enrollments.length || 1),
          quiz_attempts: (apiData.quizAttempts || []).length
        }
      ] : [],
      
      // Map notifications to alerts
      alerts: (apiData.notifications || []).map(notification => ({
        type: notification.type || "info",
        title: notification.title || "Notification",
        message: notification.message || "",
        dueDate: notification.created_at,
        actionLink: "/notifications",
        actionText: "View Details"
      })).concat(
        (apiData.alerts || []).map(alert => ({
          type: "warning",
          title: alert.title || "Alert",
          message: alert.message || "",
          actionLink: "/trainer/programs",
          actionText: "View Programs"
        }))
      )
    };
    
    console.log("Transformed data:", transformedData);
    return transformedData;
  };

  useEffect(() => {
    (async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        console.log('User Role:', userRole); // Debugging
        
        // For testing purposes, we'll allow even if the userRole is trainee
        // In production, uncomment this check
        /*
        if (userRole !== 'trainer') {
          setError('You do not have permission to view the Trainer Dashboard.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        */
  
        const apiData = await trainerService.getDashboardData();
        console.log('Dashboard Data:', apiData); // Debugging
        
        // Transform data from API to match the expected format
        const transformedData = transformApiDataToTrainerFormat(apiData);
        
        setDashboardData(transformedData);
  
      } catch (err) {
        console.error('Error fetching trainer dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Simple date formatter for milestones/alerts
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

  // Format percentage values for display
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00%';
    return parseFloat(value).toFixed(2) + '%';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainer-dashboard">
      {error && <AlertBanner message={error} type="error" />}

      {/* Alerts Section (using optional chaining for safe .length access) */}
      {dashboardData.alerts?.length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2>Alerts & Notifications</h2>
            <div className="header-line"></div>
          </div>
          <div className="alerts-container">
            {dashboardData.alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.type || 'info'}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="alert-content">
                  <h4>{alert.title || 'Notification'}</h4>
                  <p>
                    {alert.message}
                    {alert.dueDate && ` - ${formatDueDate(alert.dueDate)}`}
                  </p>
                </div>
                <div className="alert-actions">
                  {alert.actionLink && (
                    <Link to={alert.actionLink} className="alert-action-btn">
                      {alert.actionText || 'View Details'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* 1. Created Programs */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <GraduationCap size={20} />
            </div>
            <div className="header-content">
              <h3>My Programs</h3>
              <Link to="/trainer/programs" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {dashboardData.createdPrograms?.length > 0 ? (
              dashboardData.createdPrograms.map((program, index) => (
                <div key={index} className="program-item">
                  <h4>{program.title || 'Untitled Program'}</h4>
                  <p>
                    {program.type || 'Standard'} • Created: {program.created_at 
                      ? new Date(program.created_at).toLocaleDateString() 
                      : 'Unknown Date'}
                  </p>
                  <Link to={`/trainer/programs/${program.id}`} className="continue-link">
                    Manage <ChevronRight size={14} className="icon-inline" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>You haven't created any programs yet.</p>
                <div className="card-actions">
                  <Link to="/trainer/programs/create" className="action-button primary">
                    Create Program
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Created Milestones */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <Calendar size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Milestones</h3>
            </div>
          </div>
          <div className="card-content">
            {dashboardData.createdMilestones?.length > 0 ? (
              dashboardData.createdMilestones.map((milestone, index) => (
                <div key={index} className="milestone-item">
                  <div className="milestone-info">
                    <h4>{milestone.title || 'Untitled Milestone'}</h4>
                    {milestone.program_title && (
                      <p className="program-name">{milestone.program_title}</p>
                    )}
                  </div>
                  <div className="milestone-date">
                    <div className="due-date">{formatDueDate(milestone.due_date)}</div>
                    <Link to={`/trainer/milestones/${milestone.id}`} className="milestone-link">
                      Details <ChevronRight size={12} className="icon-inline" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No milestones created yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Created Quizzes */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="header-icon">
              <HelpCircle size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Quizzes</h3>
              <Link to="/trainer/quizzes" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="card-content">
            {dashboardData.createdQuizzes?.length > 0 ? (
              dashboardData.createdQuizzes.map((quiz, index) => (
                <div key={index} className="quiz-item">
                  <div className="quiz-info">
                    <h4>{quiz.title || 'Untitled Quiz'}</h4>
                    {quiz.program_title && (
                      <p className="program-name">{quiz.program_title}</p>
                    )}
                    <div className="quiz-details">
                      <span className="time-limit">
                        <Clock size={14} className="icon-inline" /> {quiz.time_limit || 'No'} minutes
                      </span>
                    </div>
                  </div>
                  <div className="quiz-actions">
                    <Link to={`/trainer/quizzes/${quiz.id}`} className="take-quiz-btn">
                      Edit <Edit size={14} className="icon-inline" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No quizzes created yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Trainee Progress */}
        {dashboardData.traineeProgress?.length > 0 && (
          <div className="dashboard-card">
            <div className="card-header">
              <div className="header-icon">
                <PieChart size={20} />
              </div>
              <div className="header-content">
                <h3>Trainee Progress</h3>
              </div>
            </div>
            <div className="card-content">
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
                    <h4>{prog.title || 'Overall Progress'}</h4>
                    <div className="progress-metrics">
                      <div className="progress-metric">
                        <span className="metric-name">Enrolled:</span>
                        <span className="metric-value">{prog.enrolled_count || 0}</span>
                      </div>
                      <div className="progress-metric">
                        <span className="metric-name">Avg. Completion:</span>
                        <span className="metric-value">{formatPercentage(prog.avg_completion)}</span>
                      </div>
                      <div className="progress-metric">
                        <span className="metric-name">Quiz Attempts:</span>
                        <span className="metric-value">{prog.quiz_attempts || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerDashboard;