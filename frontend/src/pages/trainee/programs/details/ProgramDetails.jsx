import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, ArrowLeft, Calendar, Clock, Flag, 
  CheckCircle, AlertTriangle, ClipboardList, FileText, 
  Award, BarChart2, TrendingUp
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import traineeService from '../../../../services/traineeService';
import '../styles/ProgramDetails.css';

const ProgramDetails = () => {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      setError('');

      try {
        const programData = await traineeService.getProgramDetails(programId);
        setProgram(programData);

        const milestonesData = await traineeService.getProgramMilestones(programId);
        setMilestones(milestonesData);

        const quizzesData = await traineeService.getProgramQuizzes(programId);
        setQuizzes(quizzesData);
      } catch (err) {
        console.error('Error fetching program data:', err);
        setError(err.message || 'Failed to load program details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [programId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!program) {
    return <AlertBanner message="Program not found" type="error" />;
  }

  return (
    <div className="program-details-container">
      <div className="back-navigation">
        <Link to="/trainee/programs" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Programs</span>
        </Link>
      </div>
      
      <div className="program-header-card">
        <div className="program-header">
          <div className="program-icon">
            <BookOpen size={32} />
          </div>
          <div className="program-info">
            <h1 className="program-title">{program.title}</h1>
            <div className="program-meta">
              <div className="meta-item">
                <Calendar size={16} className="meta-icon" />
                <span>Enrolled: {formatDate(program.enrollment_date)}</span>
              </div>
              <div className="meta-item">
                <span className="program-type">{program.type || 'Regular'}</span>
              </div>
              {getStatusBadge(program.completion_status)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="progress-card">
        <div className="progress-header">
          <div className="progress-info">
            <h3>Your Progress</h3>
            <div className="progress-percentage">{program.completion_percentage || 0}%</div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${program.completion_percentage || 0}%` }}
            ></div>
          </div>
        </div>
        
        {program.completion_status === 'completed' && program.completion_date && (
          <div className="completion-info">
            <CheckCircle size={18} className="completion-icon" />
            <span>Completed on {formatDate(program.completion_date)}</span>
          </div>
        )}
      </div>
      
      {program.description && (
        <div className="description-card card">
          <div className="card-header gradient-blue">
            <div className="header-icon">
              <FileText size={20} />
            </div>
            <div className="header-content">
              <h3>Description</h3>
            </div>
          </div>
          <div className="card-content">
            <p className="program-description">{program.description}</p>
          </div>
        </div>
      )}
      
      <div className="program-grid">
        <div className="milestones-card card">
          <div className="card-header gradient-purple">
            <div className="header-icon">
              <Flag size={20} />
            </div>
            <div className="header-content">
              <h3>Milestones</h3>
            </div>
          </div>
          <div className="card-content">
            {milestones.length > 0 ? (
              <div className="milestones-list">
                {milestones.map(milestone => (
                  <div key={milestone.id} className="milestone-item">
                    <div className="milestone-status">
                      {milestone.status === 'completed' && <CheckCircle size={20} className="completed-icon" />}
                      {milestone.status === 'in_progress' && <Clock size={20} className="in-progress-icon" />}
                      {milestone.status === 'not_started' && <AlertTriangle size={20} className="not-started-icon" />}
                    </div>
                    <div className="milestone-content">
                      <h4 className="milestone-title">{milestone.title}</h4>
                      <div className="milestone-meta">
                        <span className="milestone-due-date">
                          <Calendar size={14} />
                          Due: {formatDate(milestone.due_date)}
                        </span>
                        {milestone.status === 'completed' && milestone.completion_date && (
                          <span className="milestone-completion-date">
                            <CheckCircle size={14} />
                            Completed: {formatDate(milestone.completion_date)}
                          </span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="milestone-description">{milestone.description}</p>
                      )}
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-items-message">
                <Flag size={32} />
                <p>No milestones have been set for this program</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="quizzes-card card">
          <div className="card-header gradient-amber">
            <div className="header-icon">
              <ClipboardList size={20} />
            </div>
            <div className="header-content">
              <h3>Quizzes & Assessments</h3>
            </div>
          </div>
          <div className="card-content">
            {quizzes.length > 0 ? (
              <div className="quizzes-list">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-item">
                    <div className="quiz-icon">
                      <ClipboardList size={24} />
                    </div>
                    <div className="quiz-content">
                      <h4 className="quiz-title">{quiz.title}</h4>
                      {quiz.description && (
                        <p className="quiz-description">{quiz.description}</p>
                      )}
                      <div className="quiz-meta">
                        <span className="quiz-info">
                          <Clock size={14} />
                          {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No time limit'}
                        </span>
                        <span className="quiz-info">
                          <BarChart2 size={14} />
                          Passing Score: {quiz.passing_score || 70}%
                        </span>
                      </div>
                    </div>
                    <div className="quiz-actions">
                      {quiz.attempts && quiz.attempts.length > 0 ? (
                        quiz.attempts[0].score >= (quiz.passing_score || 70) ? (
                          <div className="quiz-result passed">
                            <CheckCircle size={18} />
                            <span>Passed ({quiz.attempts[0].score}%)</span>
                          </div>
                        ) : (
                          <div className="quiz-result failed">
                            <AlertTriangle size={18} />
                            <span>Failed ({quiz.attempts[0].score}%)</span>
                          </div>
                        )
                      ) : (
                        <Link to={`/trainee/assessments/quiz/${quiz.id}`} className="take-quiz-btn">
                          <ClipboardList size={16} />
                          <span>Take Quiz</span>
                        </Link>
                      )}
                      
                      {quiz.attempts && quiz.attempts.length > 0 && (
                        <Link 
                          to={`/trainee/assessments/quiz/${quiz.id}/feedback?attempt=${quiz.attempts[0].id}`} 
                          className="view-feedback-btn"
                        >
                          <FileText size={16} />
                          <span>View Feedback</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-items-message">
                <ClipboardList size={32} />
                <p>No quizzes are available for this program</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {program.completion_status === 'completed' && program.certificate && (
        <div className="certificate-card card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Award size={20} />
            </div>
            <div className="header-content">
              <h3>Certificate of Completion</h3>
            </div>
          </div>
          <div className="card-content certificate-content">
            <div className="certificate-icon">
              <Award size={48} />
            </div>
            <div className="certificate-info">
              <h4 className="certificate-title">{program.certificate.title || `${program.title} Certificate`}</h4>
              <p className="certificate-description">
                Congratulations on completing this program! Your certificate is now available.
              </p>
            </div>
            <Link to={`/trainee/certificates/${program.certificate.id}`} className="view-certificate-btn">
              <Award size={16} />
              <span>View Certificate</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDetails;