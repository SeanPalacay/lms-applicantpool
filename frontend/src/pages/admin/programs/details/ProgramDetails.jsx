// src/pages/admin/programs/details/ProgramDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  User,
  Clock,
  Edit,
  ArrowLeft,
  Trash2,
  Flag,
  CheckSquare,
  HelpCircle,
  GraduationCap,
  BarChart2
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';
import '../styles/ProgramDetails.css';

const ProgramDetails = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [program, setProgram] = useState({
    id: '',
    title: '',
    description: '',
    type: '',
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
    }
  });

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
        
        // Fetch program data
const data = await adminService.getProgramDetails(programId);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEdit = () => {
    navigate(`/admin/programs/edit/${programId}`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      await adminService.deleteProgram(programId);
      navigate('/admin/programs', { state: { message: 'Program deleted successfully.' } });
    } catch (err) {
      console.error('Error deleting program:', err);
      setError(err.message || 'Failed to delete program. Please try again.');
      setDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  const goBack = () => {
    navigate('/admin/programs');
  };

  const getProgramTypeBadgeClass = (type) => {
    return type === 'regular' ? 'badge-primary' : 'badge-warning';
  };

  const getEnrollmentStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-info';
      default: return 'badge-secondary';
    }
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
      
      <div className="back-link" onClick={goBack}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Programs</span>
      </div>
      
      <div className="program-header">
        <div className="program-title-section">
          <h2>{program.title}</h2>
          <span className={`program-type-badge ${getProgramTypeBadgeClass(program.type)}`}>
            {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
          </span>
        </div>
        
        <div className="program-actions">
          <button className="action-button secondary" onClick={handleEdit}>
            <Edit size={16} className="icon-inline" /> Edit
          </button>
          
          {deleteConfirm ? (
            <div className="delete-confirmation">
              <span>Confirm deletion?</span>
              <button className="confirm-yes" onClick={handleDelete}>Yes</button>
              <button className="confirm-no" onClick={cancelDelete}>No</button>
            </div>
          ) : (
            <button className="action-button danger" onClick={handleDelete}>
              <Trash2 size={16} className="icon-inline" /> Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="program-content">
        <div className="program-card">
          <div className="card-header gradient-purple">
            <div className="header-icon">
              <BookOpen size={20} />
            </div>
            <div className="header-content">
              <h3>Program Overview</h3>
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
                  <div className="meta-label">Type</div>
                  <div className="meta-value">{program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}</div>
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
              
              <div className="meta-item">
                <div className="meta-icon">
                  <Clock size={16} />
                </div>
                <div className="meta-content">
                  <div className="meta-label">Created Date</div>
                  <div className="meta-value">{formatDate(program.created_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="program-card">
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
        <div className="stat-value">{program.stats?.totalEnrollments || 0}</div>
        <div className="stat-label">Total Enrollments</div>
      </div>
    </div>
    
    <div className="stat-card">
      <div className="stat-icon">
        <CheckSquare size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{program.stats?.completionRate || 0}%</div>
        <div className="stat-label">Completion Rate</div>
      </div>
    </div>
    
    <div className="stat-card">
      <div className="stat-icon">
        <HelpCircle size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{program.stats?.averageScore || 'N/A'}</div>
        <div className="stat-label">Average Quiz Score</div>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>
      
      <div className="program-details-grid">
        <div className="program-card">
          <div className="card-header gradient-amber">
            <div className="header-icon">
              <GraduationCap size={20} />
            </div>
            <div className="header-content">
              <h3>Enrolled Trainees</h3>
            </div>
          </div>
          
          <div className="card-content">
            {program.enrollments && program.enrollments.length > 0 ? (
              <div className="enrollments-list">
                {program.enrollments.map((enrollment, index) => (
                  <div key={index} className="enrollment-item">
                    <div className="enrollment-user">
                      <div className="user-avatar">
                        {enrollment.trainee_name.charAt(0)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{enrollment.trainee_name}</div>
                        <div className="enrollment-date">
                          Enrolled: {formatDate(enrollment.enrollment_date)}
                        </div>
                      </div>
                    </div>
                    <div className="enrollment-status">
                      <span className={`status-badge ${getEnrollmentStatusClass(enrollment.completion_status)}`}>
                        {enrollment.completion_status === 'not_started' ? 'Not Started' : 
                         enrollment.completion_status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </span>
                      <div className="completion-percentage">
                        {enrollment.completion_percentage}% complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No trainees are currently enrolled in this program.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="program-card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Flag size={20} />
            </div>
            <div className="header-content">
              <h3>Milestones</h3>
              <Link to={`/admin/milestones/create?programId=${programId}`} className="card-action-link">
                Add Milestone
              </Link>
            </div>
          </div>
          
          <div className="card-content">
            {program.milestones && program.milestones.length > 0 ? (
              <div className="milestones-list">
                {program.milestones.map((milestone, index) => (
                  <div key={index} className="milestone-item">
                    <div className="milestone-marker">
                      <div className="milestone-number">{index + 1}</div>
                    </div>
                    <div className="milestone-content">
                      <div className="milestone-title">{milestone.title}</div>
                      <div className="milestone-description">{milestone.description}</div>
                      <div className="milestone-due-date">
                        <Calendar size={14} className="icon-inline" />
                        Due: {formatDate(milestone.due_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No milestones have been added to this program.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="program-card">
          <div className="card-header gradient-rose">
            <div className="header-icon">
              <HelpCircle size={20} />
            </div>
            <div className="header-content">
              <h3>Quizzes</h3>
              <Link to={`/admin/quizzes/create?programId=${programId}`} className="card-action-link">
                Add Quiz
              </Link>
            </div>
          </div>
          
          <div className="card-content">
            {program.quizzes && program.quizzes.length > 0 ? (
              <div className="quizzes-list">
                {program.quizzes.map((quiz, index) => (
                  <div key={index} className="quiz-item">
                    <div className="quiz-content">
                      <div className="quiz-title">{quiz.title}</div>
                      <div className="quiz-description">{quiz.description}</div>
                      <div className="quiz-meta">
                        <span className="quiz-meta-item">
                          <Clock size={14} className="icon-inline" />
                          {quiz.time_limit} minutes
                        </span>
                        <span className="quiz-meta-item">
                          <CheckSquare size={14} className="icon-inline" />
                          Passing score: {quiz.passing_score}%
                        </span>
                      </div>
                    </div>
                    <div className="quiz-questions">
                      <span className="question-count">{quiz.question_count} Questions</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No quizzes have been added to this program.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetails;