// src/pages/trainer/quizzes/attempts/QuizAttemptDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/QuizAttemptDetails.css'; // Create this CSS file

const QuizAttemptDetails = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState({
    id: '',
    trainee_id: '',
    trainee_name: '',
    quiz_title: '',
    score: 0,
    time_taken: null,
    attempt_date: '',
    passing_score: 0,
    answers: [] // Array of { question_text, selected_answer, correct_answer, is_correct }
  });

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      setError(null);

      try {
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

        const attemptData = await trainerService.getQuizAttemptDetails(quizId, attemptId);
        setAttempt(attemptData);
      } catch (err) {
        console.error('Error fetching attempt details:', err);
        setError('Failed to load attempt details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [navigate, quizId, attemptId]);

  const goBack = () => {
    navigate(`/trainer/quizzes/${quizId}/results`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const getPassStatus = () => {
    return attempt.score >= attempt.passing_score;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="quiz-attempt-details-container">
      <div className="section-header">
        <h1>Quiz Attempt Details</h1>
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
        <span>Back to Results</span>
      </div>

      <div className="attempt-header">
        <h2>{attempt.quiz_title}</h2>
        <div className="attempt-meta">
          <div className="meta-item">
            <User size={16} className="icon-inline" />
            <span>{attempt.trainee_name}</span>
          </div>
          <div className="meta-item">
            <Clock size={16} className="icon-inline" />
            <span>{formatDate(attempt.attempt_date)}</span>
          </div>
          <div className="meta-item">
            <span className={`score ${getPassStatus() ? 'passing' : 'failing'}`}>
              Score: {attempt.score}% 
              {getPassStatus() ? (
                <CheckCircle size={14} className="icon-inline" />
              ) : (
                <XCircle size={14} className="icon-inline" />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="attempt-details-card">
        <div className="card-header gradient-blue">
          <div className="header-icon">
            <HelpCircle size={20} />
          </div>
          <div className="header-content">
            <h3>Attempt Overview</h3>
          </div>
        </div>

        <div className="card-content">
          <div className="overview-grid">
            <div className="overview-item">
              <span className="label">Passing Score:</span>
              <span className="value">{attempt.passing_score}%</span>
            </div>
            <div className="overview-item">
              <span className="label">Time Taken:</span>
              <span className="value">{attempt.time_taken ? `${attempt.time_taken} min` : 'N/A'}</span>
            </div>
            <div className="overview-item">
              <span className="label">Status:</span>
              <span className={`value ${getPassStatus() ? 'passed' : 'failed'}`}>
                {getPassStatus() ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="answers-section">
        <h2>Answers</h2>
        {attempt.answers.length > 0 ? (
          <div className="answers-list">
            {attempt.answers.map((answer, index) => (
              <div key={index} className="answer-item">
                <div className="question-header">
                  <span className="question-number">Q{index + 1}</span>
                  <span className="question-text">{answer.question_text}</span>
                </div>
                <div className="answer-details">
                  <div className="answer-row">
                    <span className="label">Selected Answer:</span>
                    <span className="value">{answer.selected_answer || 'Not answered'}</span>
                  </div>
                  <div className="answer-row">
                    <span className="label">Correct Answer:</span>
                    <span className="value">{answer.correct_answer}</span>
                  </div>
                  <div className="answer-row">
                    <span className="label">Result:</span>
                    <span className={`value ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                      {answer.is_correct ? (
                        <CheckCircle size={14} className="icon-inline" />
                      ) : (
                        <XCircle size={14} className="icon-inline" />
                      )}
                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-answers">
            <AlertTriangle size={36} className="warning-icon" />
            <p>No answer details available for this attempt.</p>
          </div>
        )}
      </div>

      <div className="export-section">
        <button className="export-button">
          <FileText size={16} className="icon-inline" /> Export Attempt Details
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptDetails;