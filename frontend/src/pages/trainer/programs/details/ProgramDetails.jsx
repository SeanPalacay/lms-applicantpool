// src/pages/trainer/programs/details/ProgramDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  ArrowLeft,
  GraduationCap,
  BarChart2,
  Flag,
  HelpCircle,
  Clock,
  Plus,
  User,
  CheckSquare,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/ProgramDetails.css';

const ProgramDetails = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [program, setProgram] = useState({
    id: '',
    title: '',
    description: '',
    type: '',
    status: '',
    created_by: '',
    created_at: '',
    createdByName: '',
    enrollments: [],
    milestones: [],
    quizzes: [],
    stats: {
      totalEnrollments: 0,
      completionRate: 0,
      averageScore: 0
    },
    progressData: []
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProgramDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Check if user has trainer role
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch program data
        const data = await trainerService.getProgramDetails(programId);
        setProgram(data);
      } catch (err) {
        console.error('Error fetching program details:', err);
        setError('Failed to load program details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [programId, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  const getProgramTypeClass = (type) => {
    return type === 'regular' ? 'type-regular' : 'type-refresher';
  };

  const getEnrollmentStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-success';
      case 'in_progress': return 'status-info';
      default: return 'status-secondary';
    }
  };

  const goBack = () => {
    navigate('/trainer/programs');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="program-details-container">
      <div className="section-header">
        <h1>Program Details</h1>
        <div className="header-line"></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div className="back-link" onClick={goBack}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Programs</span>
      </div>
      
      <div className="program-header">
        <div className="program-title-section">
          <h2>{program.title}</h2>
          <div className="program-badges">
            <span className={`program-type ${getProgramTypeClass(program.type)}`}>
              {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
            </span>
            <span className={`program-status ${getStatusClass(program.status)}`}>
              {program.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="program-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`} 
          onClick={() => handleTabChange('overview')}
        >
          <BookOpen size={16} className="tab-icon" />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'trainees' ? 'active' : ''}`} 
          onClick={() => handleTabChange('trainees')}
        >
          <Users size={16} className="tab-icon" />
          Trainees ({program.enrollments ? program.enrollments.length : 0})
        </button>
        <button 
          className={`tab ${activeTab === 'milestones' ? 'active' : ''}`} 
          onClick={() => handleTabChange('milestones')}
        >
          <Flag size={16} className="tab-icon" />
          Milestones ({program.milestones ? program.milestones.length : 0})
        </button>
        <button 
          className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} 
          onClick={() => handleTabChange('quizzes')}
        >
          <HelpCircle size={16} className="tab-icon" />
          Quizzes ({program.quizzes ? program.quizzes.length : 0})
        </button>
      </div>
      
      <div className="program-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="overview-grid">
              <div className="program-card description-card">
                <div className="card-header gradient-purple">
                  <div className="header-icon">
                    <BookOpen size={20} />
                  </div>
                  <div className="header-content">
                    <h3>Program Description</h3>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="program-description">
                    <p>{program.description}</p>
                  </div>
                  
                  <div className="program-meta">
                    <div className="meta-item">
                      <div className="meta-icon">
                        <Calendar size={16} />
                      </div>
                      <div className="meta-content">
                        <div className="meta-label">Created Date</div>
                        <div className="meta-value">{formatDate(program.created_at)}</div>
                      </div>
                    </div>
                    
                    <div className="meta-item">
                      <div className="meta-icon">
                        <User size={16} />
                      </div>
                      <div className="meta-content">
                        <div className="meta-label">Created By</div>
                        <div className="meta-value">{program.createdByName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="program-card stats-card">
                <div className="card-header gradient-blue">
                  <div className="header-icon">
                    <BarChart2 size={20} />
                  </div>
                  <div className="header-content">
                    <h3>Program Statistics</h3>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <Users size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.stats.totalEnrollments}</div>
                        <div className="stat-label">Total Enrollments</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">
                        <CheckSquare size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.stats.completionRate}%</div>
                        <div className="stat-label">Completion Rate</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">
                        <HelpCircle size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.stats.averageScore || 'N/A'}</div>
                        <div className="stat-label">Average Quiz Score</div>
                      </div>
                    </div>
                  </div>
                  
                  {program.progressData && program.progressData.length > 0 && (
                    <div className="progress-chart">
                      <h4>Completion Progress Over Time</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={program.progressData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Completion Rate']}
                            labelFormatter={(date) => new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="completionRate" 
                            stroke="#4361ee" 
                            strokeWidth={2} 
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
              <div className="program-card activity-card">
                <div className="card-header gradient-teal">
                  <div className="header-icon">
                    <Activity size={20} />
                  </div>
                  <div className="header-content">
                    <h3>Recent Activity</h3>
                  </div>
                </div>
                
                <div className="card-content">
                  {program.recentActivity && program.recentActivity.length > 0 ? (
                    <div className="activity-list">
                      {program.recentActivity.map((activity, index) => (
                        <div key={index} className="activity-item">
                          <div className={`activity-icon ${activity.type}`}>
                            {activity.type === 'enrollment' && <Users size={16} />}
                            {activity.type === 'quiz' && <HelpCircle size={16} />}
                            {activity.type === 'milestone' && <Flag size={16} />}
                            {activity.type === 'completion' && <CheckSquare size={16} />}
                          </div>
                          <div className="activity-content">
                            <div className="activity-text">{activity.message}</div>
                            <div className="activity-time">
                              <Clock size={14} className="icon-inline" />
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data-message">
                      <p>No recent activity to display.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'trainees' && (
          <div className="tab-content">
            <div className="program-card">
              <div className="card-header gradient-amber">
                <div className="header-icon">
                  <Users size={20} />
                </div>
                <div className="header-content">
                  <h3>Enrolled Trainees</h3>
                </div>
              </div>
              
              <div className="card-content">
                {program.enrollments && program.enrollments.length > 0 ? (
                  <div className="trainees-container">
                    <div className="table-responsive">
                      <table className="trainees-table">
                        <thead>
                          <tr>
                            <th>Trainee</th>
                            <th>Enrollment Date</th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {program.enrollments.map((enrollment) => (
                            <tr key={enrollment.id}>
                              <td>
                                <div className="trainee-info">
                                  <div className="trainee-avatar">
                                    {enrollment.trainee_name.charAt(0)}
                                  </div>
                                  <div className="trainee-details">
                                    <div className="trainee-name">{enrollment.trainee_name}</div>
                                    <div className="trainee-email">{enrollment.trainee_email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{formatDate(enrollment.enrollment_date)}</td>
                              <td>
                                <div className="progress-container">
                                  <div className="progress-bar">
                                    <div 
                                      className="progress-fill" 
                                      style={{ width: `${enrollment.completion_percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="progress-text">{enrollment.completion_percentage}%</span>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${getEnrollmentStatusClass(enrollment.completion_status)}`}>
                                  {enrollment.completion_status === 'not_started' ? 'Not Started' : 
                                   enrollment.completion_status === 'in_progress' ? 'In Progress' : 'Completed'}
                                </span>
                              </td>
                              <td>
                                <div className="trainee-actions">
                                  <Link to={`/trainer/trainees/${enrollment.user_id}`} className="action-link">
                                    View Details
                                  </Link>
                                  <Link to={`/trainer/trainees/${enrollment.user_id}/progress`} className="action-link">
                                    Track Progress
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="no-data-message">
                    <p>No trainees are currently enrolled in this program.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'milestones' && (
          <div className="tab-content">
            <div className="program-card">
              <div className="card-header gradient-indigo">
                <div className="header-icon">
                  <Flag size={20} />
                </div>
                <div className="header-content">
                  <h3>Program Milestones</h3>
                  <Link to={`/trainer/milestones/create?programId=${program.id}`} className="action-button small">
                    <Plus size={14} /> Add Milestone
                  </Link>
                </div>
              </div>
              
              <div className="card-content">
                {program.milestones && program.milestones.length > 0 ? (
                  <div className="milestones-list">
                    {program.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="milestone-item">
                        <div className="milestone-number">
                          <span>{index + 1}</span>
                        </div>
                        <div className="milestone-content">
                          <div className="milestone-header">
                            <h4>{milestone.title}</h4>
                            <div className="milestone-actions">
                              <Link to={`/trainer/milestones/${milestone.id}`} className="action-link">
                                View
                              </Link>
                              <Link to={`/trainer/milestones/edit/${milestone.id}`} className="action-link">
                                Edit
                              </Link>
                            </div>
                          </div>
                          <div className="milestone-description">
                            <p>{milestone.description}</p>
                          </div>
                          <div className="milestone-meta">
                            <div className="meta-item">
                              <Calendar size={14} className="icon-inline" />
                              <span>Due: {formatDate(milestone.due_date)}</span>
                            </div>
                            <div className="meta-item">
                              <Users size={14} className="icon-inline" />
                              <span>
                                Completion: {milestone.completionCount || 0}/{program.stats.totalEnrollments} trainees
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <p>No milestones have been added to this program yet.</p>
                    <Link to={`/trainer/milestones/create?programId=${program.id}`} className="action-button primary">
                      <Plus size={16} className="icon-inline" /> Add First Milestone
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'quizzes' && (
          <div className="tab-content">
            <div className="program-card">
              <div className="card-header gradient-rose">
                <div className="header-icon">
                  <HelpCircle size={20} />
                </div>
                <div className="header-content">
                  <h3>Program Quizzes</h3>
                  <Link to={`/trainer/quizzes/create?programId=${program.id}`} className="action-button small">
                    <Plus size={14} /> Add Quiz
                  </Link>
                </div>
              </div>
              
              <div className="card-content">
                {program.quizzes && program.quizzes.length > 0 ? (
                  <div className="quizzes-grid">
                    {program.quizzes.map((quiz) => (
                      <div key={quiz.id} className="quiz-card">
                        <div className="quiz-title">
                          <h4>{quiz.title}</h4>
                        </div>
                        <div className="quiz-description">
                          <p>{quiz.description}</p>
                        </div>
                        <div className="quiz-meta">
                          <div className="meta-item">
                            <Clock size={14} className="icon-inline" />
                            <span>{quiz.time_limit} minutes</span>
                          </div>
                          <div className="meta-item">
                            <HelpCircle size={14} className="icon-inline" />
                            <span>{quiz.question_count} questions</span>
                          </div>
                          <div className="meta-item">
                            <CheckSquare size={14} className="icon-inline" />
                            <span>Pass: {quiz.passing_score}%</span>
                          </div>
                        </div>
                        <div className="quiz-stats">
                          <div className="stat-item">
                            <div className="stat-label">Avg. Score:</div>
                            <div className="stat-value">{quiz.average_score || 'N/A'}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">Pass Rate:</div>
                            <div className="stat-value">{quiz.pass_rate || 0}%</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-label">Attempts:</div>
                            <div className="stat-value">{quiz.attempt_count || 0}</div>
                          </div>
                        </div>
                        <div className="quiz-actions">
                          <Link to={`/trainer/quizzes/${quiz.id}`} className="action-link">
                            View Quiz
                          </Link>
                          <Link to={`/trainer/quizzes/${quiz.id}/results`} className="action-link">
                            View Results
                          </Link>
                          <Link to={`/trainer/quizzes/edit/${quiz.id}`} className="action-link">
                            Edit Quiz
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <p>No quizzes have been added to this program yet.</p>
                    <Link to={`/trainer/quizzes/create?programId=${program.id}`} className="action-button primary">
                      <Plus size={16} className="icon-inline" /> Create First Quiz
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramDetails;