import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertTriangle, Award, ArrowLeft, RefreshCw, Download, Printer
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';
import '../styles/QuizFeedback.css';

const QuizFeedback = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  
  const queryParams = new URLSearchParams(location.search);
  const attemptId = queryParams.get('attempt');
  console.log('Attempt ID from URL:', attemptId); // Debug log

  useEffect(() => {
    const fetchQuizAttempt = async () => {
      try {
        setLoading(true);
        const data = await traineeService.getQuizFeedback(quizId, attemptId);
        // Ensure score is a number
        if (data.attempt && typeof data.attempt.score === 'string') {
          data.attempt.score = parseFloat(data.attempt.score);
        }
        setQuizAttempt(data.attempt);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz attempt:', err);
        setError(err.message || 'Failed to load quiz results. Please try again later.');
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchQuizAttempt();
    } else {
      setError('No quiz attempt specified.');
      setLoading(false);
    }
  }, [attemptId, quizId]);

  const toggleShowCorrectAnswers = () => {
    setShowCorrectAnswers(!showCorrectAnswers);
  };

  const isPassed = () => {
    return quizAttempt && quiz && quizAttempt.score >= quiz.passing_score;
  };

  const getStatusText = () => {
    if (!quizAttempt || !quiz) return '';
    return quizAttempt.score >= quiz.passing_score ? 'Passed' : 'Failed';
  };

  const printResults = () => {
    window.print();
  };

  const downloadResults = async () => {
    try {
      const blob = await traineeService.downloadQuizFeedbackPDF(quizId, attemptId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quiz_Results_${quizId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading results:', err);
      alert('Failed to download results. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="quiz-feedback-loading">
        <div className="spinner"></div>
        <p>Loading quiz results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-feedback-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/trainee/assessments')} className="btn-primary">
          Back to Assessments
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-feedback-container">
      <div className="quiz-feedback-header">
        <h1>Quiz Results: {quiz?.title}</h1>
        <div className={`quiz-status ${isPassed() ? 'passed' : 'failed'}`}>
          {isPassed() ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      <div className="quiz-feedback-summary">
        <div className="summary-card">
          <div className="summary-value">
            {quizAttempt?.score !== undefined && quizAttempt?.score !== null 
              ? quizAttempt.score.toFixed(2) 
              : 'N/A'}%
          </div>
          <div className="summary-label">Your Score</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-value">{quiz?.passing_score}%</div>
          <div className="summary-label">Passing Score</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-value">
            {quizAttempt?.correct_answers} / {questions.length}
          </div>
          <div className="summary-label">Correct Answers</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-value">
            {new Date(quizAttempt?.attempt_date).toLocaleString()}
          </div>
          <div className="summary-label">Attempt Date</div>
        </div>
      </div>
      
      {quizAttempt?.feedback && (
        <div className="quiz-feedback-message">
          <h3>Feedback</h3>
          <p>{quizAttempt.feedback}</p>
        </div>
      )}
      
      <div className="quiz-feedback-actions">
        <button 
          className="btn-primary toggle-answers-btn" 
          onClick={toggleShowCorrectAnswers}
        >
          <RefreshCw size={16} />
          {showCorrectAnswers ? "Hide Correct Answers" : "Show Correct Answers"}
        </button>
        
        <button className="btn-secondary" onClick={printResults}>
          <Printer size={16} />
          Print Results
        </button>
        
        <button className="btn-secondary" onClick={downloadResults}>
          <Download size={16} />
          Download PDF
        </button>
      </div>
      
      {showCorrectAnswers && (
        <div className="quiz-questions-review">
          <h3>Question Review</h3>
          
          {questions.map((question, index) => {
            const userAnswer = quizAttempt.answers?.find(a => a.question_id === question.id)?.answer;
            const isCorrect = userAnswer === question.correct_answer;
            
            return (
              <div key={question.id} className="question-review-item">
                <div className="question-number">Question {index + 1}</div>
                
                <div className="question-text">{question.question_text}</div>
                
                <div className="answer-options-review">
                  <div className={`answer-option ${userAnswer === 'a' ? (isCorrect ? 'correct' : 'incorrect') : ''} ${question.correct_answer === 'a' && showCorrectAnswers ? 'correct-answer' : ''}`}>
                    <div className="option-letter">A</div>
                    <div className="option-text">{question.option_a}</div>
                    {userAnswer === 'a' && (
                      <div className="user-selection-indicator">
                        Your Answer {isCorrect ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="incorrect-icon" />}
                      </div>
                    )}
                  </div>
                  
                  <div className={`answer-option ${userAnswer === 'b' ? (isCorrect ? 'correct' : 'incorrect') : ''} ${question.correct_answer === 'b' && showCorrectAnswers ? 'correct-answer' : ''}`}>
                    <div className="option-letter">B</div>
                    <div className="option-text">{question.option_b}</div>
                    {userAnswer === 'b' && (
                      <div className="user-selection-indicator">
                        Your Answer {isCorrect ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="incorrect-icon" />}
                      </div>
                    )}
                  </div>
                  
                  {question.option_c && (
                    <div className={`answer-option ${userAnswer === 'c' ? (isCorrect ? 'correct' : 'incorrect') : ''} ${question.correct_answer === 'c' && showCorrectAnswers ? 'correct-answer' : ''}`}>
                      <div className="option-letter">C</div>
                      <div className="option-text">{question.option_c}</div>
                      {userAnswer === 'c' && (
                        <div className="user-selection-indicator">
                          Your Answer {isCorrect ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="incorrect-icon" />}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {question.option_d && (
                    <div className={`answer-option ${userAnswer === 'd' ? (isCorrect ? 'correct' : 'incorrect') : ''} ${question.correct_answer === 'd' && showCorrectAnswers ? 'correct-answer' : ''}`}>
                      <div className="option-letter">D</div>
                      <div className="option-text">{question.option_d}</div>
                      {userAnswer === 'd' && (
                        <div className="user-selection-indicator">
                          Your Answer {isCorrect ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="incorrect-icon" />}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {showCorrectAnswers && !isCorrect && (
                  <div className="correct-answer-text">
                    <AlertTriangle size={16} className="alert-icon" />
                    Correct answer: Option {question.correct_answer.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="quiz-feedback-footer">
        {isPassed() ? (
          <div className="congrats-message">
            <Award size={32} className="award-icon" />
            <p>Congratulations! You have successfully passed this quiz.</p>
          </div>
        ) : (
          <div className="retry-message">
            <AlertTriangle size={32} className="alert-icon" />
            <p>You did not meet the passing score. Review the material and try again.</p>
          </div>
        )}
        
        <button 
          className="btn-primary back-button"
          onClick={() => navigate('/trainee/assessments')}
        >
          <ArrowLeft size={16} />
          Back to Assessments
        </button>
      </div>
    </div>
  );
};

export default QuizFeedback;