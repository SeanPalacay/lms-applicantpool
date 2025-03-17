import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, ArrowLeft, User, Calendar, CheckCircle, Clock, 
  AlertTriangle, BookOpen, Target, BarChart2, Flag, ClipboardList, 
  Award, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/TraineeProgress.css';

/**
 * TraineeProgress Component
 * Displays comprehensive progress tracking for a trainee
 */
const TraineeProgress = () => {
  const { traineeId } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState({});
  
  // Fetch trainee and progress data on component mount
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch progress data
        const progressData = await trainerService.getTraineeProgress(traineeId, timeRange);
        setProgressData(progressData);
        
        // Initialize expanded state for programs
        if (progressData && progressData.programs) {
          const initialExpandedState = {};
          progressData.programs.forEach(program => {
            initialExpandedState[program.id] = false;
          });
          setExpandedPrograms(initialExpandedState);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load progress data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [traineeId, timeRange, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format short date for chart
  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Toggle program expansion
  const toggleProgramExpansion = (programId) => {
    setExpandedPrograms({
      ...expandedPrograms,
      [programId]: !expandedPrograms[programId]
    });
  };

  // Get status badge based on status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return (
          <div className="status-badge status-completed">
            <CheckCircle size={14} />
            <span>Completed</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="status-badge status-in-progress">
            <Clock size={14} />
            <span>In Progress</span>
          </div>
        );
      case 'not_started':
        return (
          <div className="status-badge status-not-started">
            <AlertTriangle size={14} />
            <span>Not Started</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!progressData || !progressData.programs || progressData.programs.length === 0) {
      return 0;
    }
    
    return Math.round(progressData.overallProgress || 0);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!progressData || !progressData.progressHistory) {
      return [];
    }
    
    return progressData.progressHistory.map(entry => ({
      date: formatShortDate(entry.date),
      progress: entry.progressPercentage
    }));
  };

  // Get last 5 activities
  const getRecentActivities = () => {
    if (!progressData || !progressData.activities) {
      return [];
    }
    
    return progressData.activities.slice(0, 5);
  };

  // Get activity icon
  const getActivityIcon = (activityType) => {
    switch(activityType) {
      case 'program_enrollment':
        return <BookOpen size={16} className="icon-blue" />;
      case 'program_completion':
        return <CheckCircle size={16} className="icon-green" />;
      case 'milestone_completion':
        return <Flag size={16} className="icon-purple" />;
      case 'quiz_attempt':
        return <ClipboardList size={16} className="icon-amber" />;
      case 'certificate_earned':
        return <Award size={16} className="icon-teal" />;
      default:
        return <FileText size={16} className="icon-gray" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!trainee || !progressData) {
    return <AlertBanner message="Unable to load trainee progress data" type="error" />;
  }

  return (
    <div className="trainee-progress-container">
      {/* Back navigation */}
      <div className="back-navigation">
        <Link to={`/trainer/trainees/${traineeId}`} className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Trainee Profile</span>
        </Link>
      </div>
      
      {/* Progress Header Card */}
      <div className="card progress-header-card">
        <div className="progress-header">
          <div className="trainee-info">
            <div className="trainee-avatar">
              {trainee.full_name.charAt(0)}
            </div>
            <div className="trainee-details">
              <h2>{trainee.full_name}</h2>
              <span className="trainee-email">{trainee.email}</span>
            </div>
          </div>
          <div className="progress-period-selector">
            <label htmlFor="time-range">Progress Period:</label>
            <select 
              id="time-range" 
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="time-range-select"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="progress-overview-grid">
        {/* Overall Progress Card */}
        <div className="card overall-progress-card">
          <div className="card-header gradient-blue">
            <div className="header-icon">
              <TrendingUp size={20} />
            </div>
            <div className="header-content">
              <h3>Overall Progress</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="progress-display">
              <div className="progress-circle-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path 
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path 
                    className="circle"
                    strokeDasharray={`${calculateOverallProgress()}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="18.5" className="percentage-value">
                    {calculateOverallProgress()}
                  </text>
                  <text x="18" y="24" className="percentage-sign">%</text>
                </svg>
              </div>
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="stat-label">Programs</div>
                  <div className="stat-value">{progressData.programs?.length || 0}</div>
                </div>
                <div className="progress-stat">
                  <div className="stat-label">Complete</div>
                  <div className="stat-value">
                    {progressData.programs?.filter(p => p.completion_status === 'completed').length || 0}
                  </div>
                </div>
                <div className="progress-stat">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">
                    {progressData.programs?.filter(p => p.completion_status === 'in_progress').length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Chart Card */}
        <div className="card progress-chart-card">
          <div className="card-header gradient-purple">
            <div className="header-icon">
              <BarChart2 size={20} />
            </div>
            <div className="header-content">
              <h3>Progress Over Time</h3>
            </div>
          </div>
          <div className="card-content">
            {progressData.progressHistory && progressData.progressHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Progress']}
                    contentStyle={{ 
                      background: 'rgba(255, 255, 255, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="#7209b7" 
                    strokeWidth={3} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#7209b7', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-chart-data">
                <BarChart2 size={48} />
                <p>Not enough data to display progress chart</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activities Card */}
        <div className="card recent-activities-card">
          <div className="card-header gradient-amber">
            <div className="header-icon">
              <FileText size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Activities</h3>
            </div>
          </div>
          <div className="card-content">
            {progressData.activities && progressData.activities.length > 0 ? (
              <div className="activities-list">
                {getRecentActivities().map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-details">
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-date">
                        <Calendar size={14} />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activities">
                <FileText size={48} />
                <p>No recent activities recorded</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Achievements Card */}
        <div className="card achievements-card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Target size={20} />
            </div>
            <div className="header-content">
              <h3>Achievements</h3>
            </div>
          </div>
          <div className="card-content">
            {progressData.achievements && progressData.achievements.length > 0 ? (
              <div className="achievements-list">
                {progressData.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <div className="achievement-icon">
                      <Award size={24} />
                    </div>
                    <div className="achievement-details">
                      <h4 className="achievement-title">{achievement.title}</h4>
                      <p className="achievement-description">{achievement.description}</p>
                      <div className="achievement-date">
                        <Calendar size={14} />
                        <span>{formatDate(achievement.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-achievements">
                <Award size={48} />
                <p>No achievements earned yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Program Progress Section */}
      <div className="section-header">
        <h2>Program Progress</h2>
        <div className="header-line"></div>
      </div>
      
      {progressData.programs && progressData.programs.length > 0 ? (
        <div className="programs-progress-list">
          {progressData.programs.map(program => (
            <div key={program.id} className="program-progress-card">
              <div className="program-header">
                <div className="program-info">
                  <div className="program-icon">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="program-title">{program.title}</h3>
                </div>
                <div className="program-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${program.completion_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-percentage">{program.completion_percentage || 0}%</span>
                </div>
                <div className="program-status">
                  {getStatusBadge(program.completion_status)}
                </div>
                <button 
                  className="toggle-details-btn"
                  onClick={() => toggleProgramExpansion(program.id)}
                  aria-expanded={expandedPrograms[program.id]}
                >
                  {expandedPrograms[program.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              {expandedPrograms[program.id] && (
                <div className="program-details">
                  <div className="program-metadata">
                    <div className="metadata-item">
                      <span className="metadata-label">Enrollment Date:</span>
                      <span className="metadata-value">{formatDate(program.enrollment_date)}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Type:</span>
                      <span className="metadata-value">{program.type || 'Regular'}</span>
                    </div>
                    {program.completion_status === 'completed' && program.completion_date && (
                      <div className="metadata-item">
                        <span className="metadata-label">Completion Date:</span>
                        <span className="metadata-value">{formatDate(program.completion_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Milestones */}
                  {program.milestones && program.milestones.length > 0 && (
                    <div className="program-component-section">
                      <h4 className="component-title">
                        <Flag size={16} />
                        <span>Milestones</span>
                      </h4>
                      <div className="milestones-list">
                        {program.milestones.map((milestone, index) => (
                          <div key={index} className="milestone-item">
                            <div className="milestone-status">
                              {milestone.status === 'completed' && <CheckCircle size={16} className="completed-icon" />}
                              {milestone.status === 'in_progress' && <Clock size={16} className="in-progress-icon" />}
                              {milestone.status === 'not_started' && <AlertTriangle size={16} className="not-started-icon" />}
                            </div>
                            <div className="milestone-info">
                              <span className="milestone-title">{milestone.title}</span>
                              <span className="milestone-date">
                                {milestone.status === 'completed' 
                                  ? `Completed on ${formatDate(milestone.completion_date)}` 
                                  : `Due ${formatDate(milestone.due_date)}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Quizzes */}
                  {program.quizzes && program.quizzes.length > 0 && (
                    <div className="program-component-section">
                      <h4 className="component-title">
                        <ClipboardList size={16} />
                        <span>Quizzes</span>
                      </h4>
                      <div className="quizzes-list">
                        {program.quizzes.map((quiz, index) => (
                          <div key={index} className="quiz-item">
                            <div className="quiz-info">
                              <span className="quiz-title">{quiz.title}</span>
                              <div className="quiz-attempts">
                                {quiz.attempts?.length > 0 ? (
                                  <div className="quiz-score">
                                    <span className={`score ${quiz.attempts[0].score >= (quiz.passing_score || 70) ? 'pass' : 'fail'}`}>
                                      {quiz.attempts[0].score.toFixed(1)}%
                                    </span>
                                    <span className="attempts-count">
                                      {quiz.attempts.length} {quiz.attempts.length === 1 ? 'attempt' : 'attempts'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="no-attempts">Not attempted</span>
                                )}
                              </div>
                            </div>
                            <div className="quiz-status">
                              {quiz.attempts?.length > 0 && quiz.attempts[0].score >= (quiz.passing_score || 70) && (
                                <div className="quiz-badge passed">
                                  <CheckCircle size={14} />
                                  <span>Passed</span>
                                </div>
                              )}
                              {quiz.attempts?.length > 0 && quiz.attempts[0].score < (quiz.passing_score || 70) && (
                                <div className="quiz-badge failed">
                                  <AlertTriangle size={14} />
                                  <span>Failed</span>
                                </div>
                              )}
                              {(!quiz.attempts || quiz.attempts.length === 0) && (
                                <div className="quiz-badge pending">
                                  <Clock size={14} />
                                  <span>Pending</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-programs-message">
          <BookOpen size={48} />
          <p>This trainee is not enrolled in any programs</p>
        </div>
      )}
    </div>
  );
};

export default TraineeProgress;