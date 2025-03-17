import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, AlertCircle, CheckCircle, XCircle, Info, ArrowRight, ArrowLeft
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';
import '../styles/TakeQuiz.css';

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
        setTimeLeft(data.quiz.time_limit * 60); // Convert minutes to seconds
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
      <div className="quiz-loading">
        <div className="spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <AlertCircle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/trainee/assessments')} className="btn-primary">
          Back to Assessments
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="quiz-intro">
        <h1>{quiz.title}</h1>
        <div className="quiz-info">
          <div className="info-item">
            <Clock size={20} />
            <span>Time Limit: {quiz.time_limit} minutes</span>
          </div>
          <div className="info-item">
            <Info size={20} />
            <span>Total Questions: {questions.length}</span>
          </div>
          <div className="info-item">
            <CheckCircle size={20} />
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
        </div>
        
        <div className="quiz-instructions">
          <h2>Instructions</h2>
          <p>{quiz.description || 'Complete all questions within the time limit. Select the best answer for each question.'}</p>
          <ul>
            <li>Once you start, the timer cannot be paused.</li>
            <li>You can navigate between questions using the previous and next buttons.</li>
            <li>Your answers are saved as you go, but not submitted until you finish.</li>
            <li>The quiz will automatically submit when time expires.</li>
          </ul>
        </div>
        
        <button 
          onClick={startQuiz} 
          className="btn-primary start-quiz-btn"
          disabled={loading}
        >
          Start Quiz
        </button>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <div className="quiz-timer">
          <Clock size={20} />
          <span className={timeLeft < 60 ? 'time-critical' : ''}>
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      <div className="quiz-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {Object.keys(answers).length} of {questions.length} questions answered
        </span>
      </div>
      
      <div className="question-container">
        <div className="question-number">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        
        <div className="question-text">
          {currentQuestionData.question_text}
        </div>
        
        <div className="answer-options">
          <div 
            className={`answer-option ${answers[currentQuestionData.id] === 'a' ? 'selected' : ''}`} 
            onClick={() => handleAnswerSelect(currentQuestionData.id, 'a')}
          >
            <div className="option-letter">A</div>
            <div className="option-text">{currentQuestionData.option_a}</div>
          </div>
          
          <div 
            className={`answer-option ${answers[currentQuestionData.id] === 'b' ? 'selected' : ''}`} 
            onClick={() => handleAnswerSelect(currentQuestionData.id, 'b')}
          >
            <div className="option-letter">B</div>
            <div className="option-text">{currentQuestionData.option_b}</div>
          </div>
          
          {currentQuestionData.option_c && (
            <div 
              className={`answer-option ${answers[currentQuestionData.id] === 'c' ? 'selected' : ''}`} 
              onClick={() => handleAnswerSelect(currentQuestionData.id, 'c')}
            >
              <div className="option-letter">C</div>
              <div className="option-text">{currentQuestionData.option_c}</div>
            </div>
          )}
          
          {currentQuestionData.option_d && (
            <div 
              className={`answer-option ${answers[currentQuestionData.id] === 'd' ? 'selected' : ''}`} 
              onClick={() => handleAnswerSelect(currentQuestionData.id, 'd')}
            >
              <div className="option-letter">D</div>
              <div className="option-text">{currentQuestionData.option_d}</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="quiz-navigation">
        <button 
          className="btn-secondary nav-btn"
          onClick={goToPreviousQuestion}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        
        {currentQuestion < questions.length - 1 ? (
          <button 
            className="btn-primary nav-btn"
            onClick={goToNextQuestion}
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            className="btn-success nav-btn submit-btn"
            onClick={submitQuiz}
            disabled={submitting || !allQuestionsAnswered()}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
      
      <div className="question-dots">
        {questions.map((q, index) => (
          <div 
            key={index}
            className={`question-dot ${index === currentQuestion ? 'current' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(index)}
            title={`Question ${index + 1} ${answers[q.id] !== undefined ? '(Answered)' : '(Unanswered)'}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default TakeQuiz;