import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, AlertCircle, CheckCircle, XCircle, Info, ArrowRight, ArrowLeft
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await traineeService.getQuizDetails(quizId);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setTimeLeft(data.quiz.time_limit * 60);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err.message || 'Failed to load quiz. Please try again later.');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quizStarted || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        question_id: questionId,
        answer: answers[questionId]
      }));
      
      const response = await traineeService.submitQuiz(quizId, formattedAnswers);
      navigate(`/trainee/assessments/quiz/${quizId}/feedback?attempt=${response.attempt_id}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const allQuestionsAnswered = () => {
    return questions.every(q => answers[q.id] !== undefined);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: '15px' 
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #007bff', 
          borderTop: '4px solid transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>Loading quiz...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: '15px',
        textAlign: 'center'
      }}>
        <AlertCircle size={48} style={{ color: '#dc3545' }} />
        <h2 style={{ fontSize: '24px', margin: 0 }}>Error</h2>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>{error}</p>
        <button 
          onClick={() => navigate('/trainee/assessments')} 
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '14px' 
          }}
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>{quiz.title}</h1>
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: '#007bff' }} />
              <span style={{ fontSize: '14px' }}>Time Limit: {quiz.time_limit} minutes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={20} style={{ color: '#007bff' }} />
              <span style={{ fontSize: '14px' }}>Total Questions: {questions.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} style={{ color: '#007bff' }} />
              <span style={{ fontSize: '14px' }}>Passing Score: {quiz.passing_score}%</span>
            </div>
          </div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Instructions</h2>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>
            {quiz.description || 'Complete all questions within the time limit. Select the best answer for each question.'}
          </p>
          <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px', margin: 0 }}>
            <li>Once you start, the timer cannot be paused.</li>
            <li>You can navigate between questions using the previous and next buttons.</li>
            <li>Your answers are saved as you go, but not submitted until you finish.</li>
            <li>The quiz will automatically submit when time expires.</li>
          </ul>
        </div>
        
        <button 
          onClick={startQuiz} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '16px', 
            width: '100%',
            opacity: loading ? 0.7 : 1
          }}
        >
          Start Quiz
        </button>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto' 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '15px' 
      }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{quiz.title}</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          fontSize: '16px' 
        }}>
          <Clock size={20} style={{ color: '#007bff' }} />
          <span style={{ color: timeLeft < 60 ? '#dc3545' : '#333' }}>
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          background: '#eee', 
          borderRadius: '3px', 
          overflow: 'hidden', 
          marginBottom: '5px' 
        }}>
          <div style={{ 
            width: `${(Object.keys(answers).length / questions.length) * 100}%`, 
            height: '100%', 
            background: '#007bff', 
            transition: 'width 0.3s ease' 
          }}></div>
        </div>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {Object.keys(answers).length} of {questions.length} questions answered
        </span>
      </div>
      
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        padding: '15px' 
      }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '10px' 
        }}>
          Question {currentQuestion + 1} of {questions.length}
        </div>
        
        <div style={{ fontSize: '16px', marginBottom: '15px' }}>
          {currentQuestionData.question_text}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['a', 'b', 'c', 'd'].map(option => 
            currentQuestionData[`option_${option}`] && (
              <div 
                key={option}
                onClick={() => handleAnswerSelect(currentQuestionData.id, option)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  background: answers[currentQuestionData.id] === option ? '#e6f3ff' : '#f8f9fa',
                  cursor: 'pointer',
                  border: answers[currentQuestionData.id] === option ? '1px solid #007bff' : '1px solid #ddd',
                  ':hover': { background: '#f1f3f5' }
                }}
              >
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: '#007bff', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px' 
                }}>
                  {option.toUpperCase()}
                </div>
                <div style={{ fontSize: '14px', flex: 1 }}>{currentQuestionData[`option_${option}`]}</div>
              </div>
            )
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '20px', 
        flexWrap: 'wrap', 
        gap: '15px' 
      }}>
        <button 
          onClick={goToPreviousQuestion}
          disabled={currentQuestion === 0}
          style={{ 
            padding: '10px 15px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            fontSize: '14px',
            opacity: currentQuestion === 0 ? 0.7 : 1
          }}
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        
        {currentQuestion < questions.length - 1 ? (
          <button 
            onClick={goToNextQuestion}
            style={{ 
              padding: '10px 15px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              fontSize: '14px' 
            }}
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            onClick={submitQuiz}
            disabled={submitting || !allQuestionsAnswered()}
            style={{ 
              padding: '10px 15px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: (submitting || !allQuestionsAnswered()) ? 'not-allowed' : 'pointer', 
              fontSize: '14px',
              opacity: (submitting || !allQuestionsAnswered()) ? 0.7 : 1
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        marginTop: '20px', 
        flexWrap: 'wrap' 
      }}>
        {questions.map((q, index) => (
          <div 
            key={index}
            onClick={() => setCurrentQuestion(index)}
            style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: index === currentQuestion ? '#007bff' : 
                         answers[q.id] !== undefined ? '#28a745' : '#ddd',
              cursor: 'pointer',
              ':hover': { opacity: 0.8 }
            }}
            title={`Question ${index + 1} ${answers[q.id] !== undefined ? '(Answered)' : '(Unanswered)'}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default TakeQuiz;