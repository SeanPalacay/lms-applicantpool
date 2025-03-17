import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  HelpCircle, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Edit,
  Eye,
  Users,
  BarChart2,
  Calendar,
  ArrowLeft,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/QuizDetails.css';

const QuizDetails = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [quiz, setQuiz] = useState({
    id: '',
    title: '',
    description: '',
    program_id: '',
    program_title: '',
    time_limit: 0,
    passing_score: 0,
    questions: [],
    stats: {
      total_attempts: 0,
      pass_rate: 0,
      average_score: 0
    },
    created_at: '',
    created_by: '',
    created_by_name: ''
  });

  useEffect(() => {
    const fetchQuizDetails = async () => {
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
        
        // Fetch quiz data
        const quizData = await trainerService.getQuizById(quizId);
        setQuiz(quizData);
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        setError('Failed to load quiz details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [navigate, quizId]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      await trainerService.deleteQuiz(quizId);
      setSuccess('Quiz deleted successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/trainer/quizzes', { state: { message: 'Quiz deleted successfully.' } });
      }, 2000);
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz. Please try again.');
      setDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  const handleEdit = () => {
    navigate(`/trainer/quizzes/edit/${quizId}`);
  };

  const goBack = () => {
    navigate('/trainer/quizzes');
  };

  const getCorrectAnswer = (question) => {
    switch (question.correct_answer) {
      case 'a': return question.option_a;
      case 'b': return question.option_b;
      case 'c': return question.option_c;
      case 'd': return question.option_d;
      default: return 'Not specified';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="quiz-details-container">
      <div className="section-header">
        <h1>Quiz Details</h1>
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
        <span>Back to Quizzes</span>
      </div>
      
      <div className="quiz-header">
        <div className="quiz-title-section">
          <h2>{quiz.title}</h2>
        </div>
        
        <div className="quiz-actions">
          {deleteConfirm ? (
            <div className="confirm-delete">
              <span>Are you sure?</span>
              <button className="confirm-yes" onClick={handleDelete}>Yes</button>
              <button className="confirm-no" onClick={cancelDelete}>No</button>
            </div>
          ) : (
            <>
              <button className="action-button edit" onClick={handleEdit}>
                <Edit size={16} className="icon-inline" /> Edit
              </button>
              <button className="action-button delete" onClick={handleDelete}>
                <Trash2 size={16} className="icon-inline" /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="content-grid">
        <div className="quiz-card info-card">
          <div className="card-header gradient-rose">
            <div className="header-icon">
              <HelpCircle size={20} />
            </div>
            <div className="header-content">
              <h3>Quiz Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            {quiz.description && (
              <div className="quiz-description">
                <h4>Description</h4>
                <p>{quiz.description}</p>
              </div>
            )}
            
            <div className="quiz-meta">
              <div className="meta-item">
                <div className="meta-icon">
                  <BookOpen size={18} />
                </div>
                <div className="meta-content">
                  <div className="meta-label">Program</div>
                  <div className="meta-value">
                    <Link to={`/trainer/programs/${quiz.program_id}`}>
                      {quiz.program_title}
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="meta-item">
                <div className="meta-icon">
                  <Clock size={18} />
                </div>
                <div className="meta-content">
                  <div className="meta-label">Time Limit</div>
                  <div className="meta-value">{quiz.time_limit} minutes</div>
                </div>
              </div>
              
              <div className="meta-item">
                <div className="meta-icon">
                  <CheckSquare size={18} />
                </div>
                <div className="meta-content">
                  <div className="meta-label">Passing Score</div>
                  <div className="meta-value">{quiz.passing_score}%</div>
                </div>
              </div>
              
              <div className="meta-item">
                <div className="meta-icon">
                  <HelpCircle size={18} />
                </div>
                <div className="meta-content">
                  <div className="meta-label">Questions</div>
                  <div className="meta-value">{quiz.questions.length}</div>
                </div>
              </div>
            </div>
            
            <div className="quiz-dates">
              <div className="date-item">
                <Calendar size={14} className="icon-inline" />
                <span>Created: {formatDate(quiz.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="quiz-card stats-card">
          <div className="card-header gradient-blue">
            <div className="header-icon">
              <BarChart2 size={20} />
            </div>
            <div className="header-content">
              <h3>Performance Statistics</h3>
              <Link to={`/trainer/quizzes/${quizId}/results`} className="view-link">
                <Eye size={14} className="icon-inline" /> View Results
              </Link>
            </div>
          </div>
          
          <div className="card-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{quiz.stats?.total_attempts || 0}</div>
                  <div className="stat-label">Total Attempts</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <BarChart2 size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{quiz.stats?.average_score || 'N/A'}</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <CheckSquare size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{quiz.stats?.pass_rate || 0}%</div>
                  <div className="stat-label">Pass Rate</div>
                </div>
              </div>
            </div>
            
            {quiz.stats?.total_attempts > 0 ? (
              <div className="stats-chart">
                <h4>Score Distribution</h4>
                <div className="chart-placeholder">
                  {/* A real chart would be implemented here */}
                  <p className="chart-note">Score distribution visualization would go here.</p>
                </div>
              </div>
            ) : (
              <div className="no-data-message">
                <AlertTriangle size={24} className="warning-icon" />
                <p>No quiz attempts have been recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="questions-section">
        <div className="section-header questions-header">
          <h2>Quiz Questions</h2>
          <div className="questions-count">
            <span>{quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {quiz.questions.length === 0 ? (
          <div className="no-questions-message">
            <AlertTriangle size={36} className="warning-icon" />
            <h3>No Questions</h3>
            <p>This quiz doesn't have any questions yet.</p>
            <button className="action-button primary" onClick={handleEdit}>
              <Edit size={16} className="icon-inline" /> Edit Quiz
            </button>
          </div>
        ) : (
          <div className="questions-accordion">
            {quiz.questions.map((question, index) => (
              <div key={index} className="question-item">
                <div className="question-header">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-text">{question.question_text}</div>
                </div>
                
                <div className="question-options">
                  <div className={`option-item ${question.correct_answer === 'a' ? 'correct' : ''}`}>
                    <div className="option-letter">A</div>
                    <div className="option-text">{question.option_a}</div>
                    {question.correct_answer === 'a' && (
                      <div className="correct-indicator">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                  
                  <div className={`option-item ${question.correct_answer === 'b' ? 'correct' : ''}`}>
                    <div className="option-letter">B</div>
                    <div className="option-text">{question.option_b}</div>
                    {question.correct_answer === 'b' && (
                      <div className="correct-indicator">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                  
                  {question.option_c && (
                    <div className={`option-item ${question.correct_answer === 'c' ? 'correct' : ''}`}>
                      <div className="option-letter">C</div>
                      <div className="option-text">{question.option_c}</div>
                      {question.correct_answer === 'c' && (
                        <div className="correct-indicator">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {question.option_d && (
                    <div className={`option-item ${question.correct_answer === 'd' ? 'correct' : ''}`}>
                      <div className="option-letter">D</div>
                      <div className="option-text">{question.option_d}</div>
                      {question.correct_answer === 'd' && (
                        <div className="correct-indicator">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="question-footer">
                  <div className="correct-answer">
                    <CheckCircle size={14} className="icon-inline" />
                    <span>Correct answer: {question.correct_answer.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="export-section">
        <button className="export-button">
          <FileText size={16} className="icon-inline" /> Export Quiz as PDF
        </button>
      </div>
    </div>
  );
};

export default QuizDetails;