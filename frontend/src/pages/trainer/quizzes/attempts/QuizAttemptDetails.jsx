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
    return parseFloat(attempt.score) >= parseFloat(attempt.passing_score);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Quiz Attempt Details</h1>
        <div style={{ height: '2px', background: '#ddd' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}

      <div 
        onClick={goBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '20px',
          color: '#007bff'
        }}
      >
        <ArrowLeft size={16} style={{ marginRight: '5px' }} />
        <span>Back to Results</span>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>{attempt.quiz_title}</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <User size={16} style={{ marginRight: '5px' }} />
            <span>{attempt.trainee_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Clock size={16} style={{ marginRight: '5px' }} />
            <span>{formatDate(attempt.attempt_date)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: getPassStatus() ? '#28a745' : '#dc3545'
          }}>
            <span>Score: {attempt.score}%</span>
            {getPassStatus() ? (
              <CheckCircle size={14} style={{ marginLeft: '5px' }} />
            ) : (
              <XCircle size={14} style={{ marginLeft: '5px' }} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(to right, #007bff, #00b7ff)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <HelpCircle size={20} style={{ marginRight: '10px' }} />
          <h3 style={{ margin: 0 }}>Attempt Overview</h3>
        </div>
        <div style={{ padding: '15px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>Passing Score:</span>
              <span style={{ marginLeft: '5px' }}>{attempt.passing_score}%</span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Time Taken:</span>
              <span style={{ marginLeft: '5px' }}>{attempt.time_taken ? `${attempt.time_taken} min` : 'N/A'}</span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Status:</span>
              <span style={{ 
                marginLeft: '5px',
                color: getPassStatus() ? '#28a745' : '#dc3545'
              }}>
                {getPassStatus() ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Answers</h2>
        {attempt.answers.length > 0 ? (
          <div>
            {attempt.answers.map((answer, index) => (
              <div key={index} style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '15px',
                padding: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    marginRight: '10px' 
                  }}>Q{index + 1}</span>
                  <span>{answer.question_text}</span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Selected Answer:</span>
                    <span style={{ marginLeft: '5px' }}>{answer.selected_answer || 'Not answered'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Correct Answer:</span>
                    <span style={{ marginLeft: '5px' }}>{answer.correct_answer}</span>
                  </div>
                  <div style={{ 
                    color: answer.is_correct ? '#28a745' : '#dc3545',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Result:</span>
                    <span style={{ marginLeft: '5px' }}>
                      {answer.is_correct ? (
                        <CheckCircle size={14} style={{ marginRight: '5px' }} />
                      ) : (
                        <XCircle size={14} style={{ marginRight: '5px' }} />
                      )}
                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: '#fff',
            borderRadius: '8px'
          }}>
            <AlertTriangle size={36} style={{ color: '#ffc107' }} />
            <p style={{ margin: '10px 0 0' }}>No answer details available for this attempt.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button style={{
          padding: '8px 15px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <FileText size={16} /> Export Attempt Details
        </button>
      </div>
    </div>
  );
};

export default QuizAttemptDetails;