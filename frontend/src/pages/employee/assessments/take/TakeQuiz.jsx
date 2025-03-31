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

const handleAnswerSelect = (questionId, answer, questionType) => {
  if (questionType === 'multiple_answer') {
    // For multiple answer questions, toggle the selected answer
    const currentAnswers = answers[questionId] ? answers[questionId].split(',') : [];
    let newAnswers;
    
    if (currentAnswers.includes(answer)) {
      // Remove the answer if it's already selected
      newAnswers = currentAnswers.filter(a => a !== answer);
    } else {
      // Add the answer if it's not selected
      newAnswers = [...currentAnswers, answer];
    }
    
    // Use empty string if no answers selected
    const formattedAnswer = newAnswers.length > 0 ? newAnswers.join(',') : '';
    
    // Update state
    setAnswers({
      ...answers,
      [questionId]: formattedAnswer
    });
    
    console.log(`Multiple answer selection for question ${questionId}: ${formattedAnswer}`);
  } else {
    // For single answer questions
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  }
};

  const handleTextAnswer = (questionId, answer) => {
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
      
      // Format answers based on question type
      const formattedAnswers = Object.keys(answers).map(questionId => {
        const question = questions.find(q => q.id === parseInt(questionId));
        let formattedAnswer = answers[questionId];
        
        // Special handling for matching questions
        if (question.question_type === 'matching' && answers[questionId]) {
          formattedAnswer = answers[questionId]; // Already JSON string
        }
        
        return {
          question_id: questionId,
          answer: formattedAnswer,
          question_type: question.question_type
        };
      });
      
      const response = await traineeService.submitQuiz(quizId, formattedAnswers);
      navigate(`/trainee/assessments/quiz/${quizId}/feedback?attempt=${response.attempt_id}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const isQuestionAnswered = (question) => {
    if (!answers[question.id]) return false;
    
    if (question.question_type === 'multiple_answer') {
      return answers[question.id].length > 0;
    } else if (question.question_type === 'matching') {
      const matchedPairs = JSON.parse(answers[question.id] || '{}');
      return Object.keys(matchedPairs).length === question.matching_pairs?.length;
    } else if (question.question_type === 'identification' || question.question_type === 'essay') {
      return answers[question.id].trim().length > 0;
    }
    
    return true; // For multiple choice and true/false
  };

  const allQuestionsAnswered = () => {
    return questions.every(q => isQuestionAnswered(q));
  };

  // Render the appropriate question UI based on question type
  const renderQuestionContent = (questionData) => {
    switch (questionData.question_type) {
      case 'multiple_choice':
        return renderMultipleChoiceQuestion(questionData);
      case 'multiple_answer':
        return renderMultipleAnswerQuestion(questionData);
      case 'true_false':
        return renderTrueFalseQuestion(questionData);
      case 'identification':
        return renderIdentificationQuestion(questionData);
      case 'matching':
        return renderMatchingQuestion(questionData);
      case 'essay':
        return renderEssayQuestion(questionData);
      default:
        return renderMultipleChoiceQuestion(questionData);
    }
  };

  const renderMultipleChoiceQuestion = (questionData) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {['a', 'b', 'c', 'd'].map(option => 
        questionData[`option_${option}`] && (
          <div 
            key={option}
            onClick={() => handleAnswerSelect(questionData.id, option, 'multiple_choice')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '10px', 
              borderRadius: '4px', 
              background: answers[questionData.id] === option ? '#e6f3ff' : '#f8f9fa',
              cursor: 'pointer',
              border: answers[questionData.id] === option ? '1px solid #007bff' : '1px solid #ddd'
            }}
          >
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: answers[questionData.id] === option ? '#007bff' : '#e0e0e0', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px' 
            }}>
              {option.toUpperCase()}
            </div>
            <div style={{ fontSize: '14px', flex: 1 }}>{questionData[`option_${option}`]}</div>
          </div>
        )
      )}
    </div>
  );

  const renderMultipleAnswerQuestion = (questionData) => {
    const selectedOptions = answers[questionData.id] ? answers[questionData.id].split(',') : [];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
          Select all that apply:
        </div>
        {['a', 'b', 'c', 'd'].map(option => 
          questionData[`option_${option}`] && (
            <div 
              key={option}
              onClick={() => handleAnswerSelect(questionData.id, option, 'multiple_answer')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '10px', 
                borderRadius: '4px', 
                background: selectedOptions.includes(option) ? '#e6f3ff' : '#f8f9fa',
                cursor: 'pointer',
                border: selectedOptions.includes(option) ? '1px solid #007bff' : '1px solid #ddd'
              }}
            >
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '4px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedOptions.includes(option) ? '#007bff' : '#f8f9fa',
                border: selectedOptions.includes(option) ? '1px solid #007bff' : '1px solid #ccc'
              }}>
                {selectedOptions.includes(option) && <CheckCircle size={16} color="#fff" />}
              </div>
              <div style={{ fontSize: '14px', flex: 1 }}>{questionData[`option_${option}`]}</div>
            </div>
          )
        )}
      </div>
    );
  };

  const renderTrueFalseQuestion = (questionData) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div 
        onClick={() => handleAnswerSelect(questionData.id, 'a', 'true_false')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '15px', 
          borderRadius: '4px', 
          background: answers[questionData.id] === 'a' ? '#e6f3ff' : '#f8f9fa',
          cursor: 'pointer',
          border: answers[questionData.id] === 'a' ? '1px solid #007bff' : '1px solid #ddd'
        }}
      >
        <div style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          border: answers[questionData.id] === 'a' ? '0' : '2px solid #ddd',
          background: answers[questionData.id] === 'a' ? '#007bff' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {answers[questionData.id] === 'a' && <CheckCircle size={16} color="#fff" />}
        </div>
        <div style={{ fontSize: '16px' }}>True</div>
      </div>
      
      <div 
        onClick={() => handleAnswerSelect(questionData.id, 'b', 'true_false')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '15px', 
          borderRadius: '4px', 
          background: answers[questionData.id] === 'b' ? '#e6f3ff' : '#f8f9fa',
          cursor: 'pointer',
          border: answers[questionData.id] === 'b' ? '1px solid #007bff' : '1px solid #ddd'
        }}
      >
        <div style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          border: answers[questionData.id] === 'b' ? '0' : '2px solid #ddd',
          background: answers[questionData.id] === 'b' ? '#007bff' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {answers[questionData.id] === 'b' && <CheckCircle size={16} color="#fff" />}
        </div>
        <div style={{ fontSize: '16px' }}>False</div>
      </div>
    </div>
  );

  const renderIdentificationQuestion = (questionData) => (
    <div>
      <input
        type="text"
        value={answers[questionData.id] || ''}
        onChange={(e) => handleTextAnswer(questionData.id, e.target.value)}
        placeholder="Type your answer here"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '10px'
        }}
      />
    </div>
  );

  const renderMatchingQuestion = (questionData) => {
    const currentMatches = answers[questionData.id] ? JSON.parse(answers[questionData.id]) : {};
    
    if (!questionData.matching_pairs || questionData.matching_pairs.length === 0) {
      return <div>No matching pairs available</div>;
    }
    
    return (
      <div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Match items from the left column with the correct items on the right:
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '10px', alignItems: 'center' }}>
          {/* Left column headers */}
          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>Item</div>
          <div></div>
          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>Match</div>
          
          {/* Matching rows */}
          {questionData.matching_pairs.map((pair, index) => (
            <React.Fragment key={index}>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                {pair.left}
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <ArrowRight />
              </div>
              
              <select
                value={currentMatches[pair.key] || ''}
                onChange={(e) => handleAnswerSelect(
                  questionData.id, 
                  `${pair.key}:${e.target.value}`, 
                  'matching'
                )}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: currentMatches[pair.key] ? '#e6f3ff' : 'white'
                }}
              >
                <option value="">Select a match</option>
                {questionData.matching_pairs.map((rightItem, rightIndex) => (
                  <option key={rightIndex} value={rightItem.key}>
                    {rightItem.right}
                  </option>
                ))}
              </select>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderEssayQuestion = (questionData) => (
    <div>
      <textarea
        value={answers[questionData.id] || ''}
        onChange={(e) => handleTextAnswer(questionData.id, e.target.value)}
        placeholder="Write your answer here..."
        rows={8}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '10px',
          resize: 'vertical'
        }}
      />
    </div>
  );

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
            <li>This quiz contains different types of questions including multiple choice, true/false, and more.</li>
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
          marginBottom: '10px', 
          display: 'flex', 
          justifyContent: 'space-between' 
        }}>
          <div>Question {currentQuestion + 1} of {questions.length}</div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            padding: '2px 8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px'
          }}>
            {currentQuestionData.question_type === 'multiple_choice' && 'Multiple Choice'}
            {currentQuestionData.question_type === 'multiple_answer' && 'Multiple Answer'}
            {currentQuestionData.question_type === 'true_false' && 'True/False'}
            {currentQuestionData.question_type === 'identification' && 'Identification'}
            {currentQuestionData.question_type === 'matching' && 'Matching'}
            {currentQuestionData.question_type === 'essay' && 'Essay'}
          </div>
        </div>
        
        <div style={{ fontSize: '16px', marginBottom: '15px' }}>
          {currentQuestionData.question_text}
        </div>
        
        {renderQuestionContent(currentQuestionData)}
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
                         isQuestionAnswered(q) ? '#28a745' : '#ddd',
              cursor: 'pointer'
            }}
            title={`Question ${index + 1} ${isQuestionAnswered(q) ? '(Answered)' : '(Unanswered)'}`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default TakeQuiz;