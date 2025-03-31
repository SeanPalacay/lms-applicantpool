import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertTriangle, Award, ArrowLeft, RefreshCw, Download, Printer
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';

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
  console.log('Attempt ID from URL:', attemptId);

  useEffect(() => {
    const fetchQuizAttempt = async () => {
      try {
        setLoading(true);
        const data = await traineeService.getQuizFeedback(quizId, attemptId);
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
        <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>Loading quiz results...</p>
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
        <AlertTriangle size={48} style={{ color: '#dc3545' }} />
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
        <h1 style={{ fontSize: '24px', margin: 0 }}>Quiz Results: {quiz?.title}</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '6px 12px', 
          borderRadius: '16px', 
          background: isPassed() ? '#d4edda' : '#f8d7da', 
          color: isPassed() ? '#155724' : '#721c24',
          fontSize: '16px'
        }}>
          {isPassed() ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: quizAttempt?.score >= quiz?.passing_score ? '#28a745' : '#dc3545' 
          }}>
            {quizAttempt?.score !== undefined && quizAttempt?.score !== null 
              ? quizAttempt.score.toFixed(2) 
              : 'N/A'}%
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Your Score</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{quiz?.passing_score}%</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Passing Score</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{quizAttempt?.correct_answers} / {questions.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Correct Answers</div>
        </div>
        
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {new Date(quizAttempt?.attempt_date).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Attempt Date</div>
        </div>
      </div>
      
      {quizAttempt?.feedback && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Feedback</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{quizAttempt.feedback}</p>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        flexWrap: 'wrap' 
      }}>
        <button 
          onClick={toggleShowCorrectAnswers}
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
          <RefreshCw size={16} />
          {showCorrectAnswers ? "Hide Correct Answers" : "Show Correct Answers"}
        </button>
        
        <button 
          onClick={printResults}
          style={{ 
            padding: '10px 15px', 
            background: '#6c757d', 
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
          <Printer size={16} />
          Print Results
        </button>
        
        <button 
          onClick={downloadResults}
          style={{ 
            padding: '10px 15px', 
            background: '#6c757d', 
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
          <Download size={16} />
          Download PDF
        </button>
      </div>
      
      {showCorrectAnswers && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Question Review</h3>
          
          {questions.map((question, index) => {
            const userAnswer = quizAttempt.answers?.find(a => a.question_id === question.id)?.answer;
            const isCorrect = userAnswer === question.correct_answer;
            
            return (
              <div 
                key={question.id} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < questions.length - 1 ? '1px solid #eee' : 'none' 
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Question {index + 1}
                </div>
                
                <div style={{ fontSize: '14px', marginBottom: '15px' }}>{question.question_text}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['a', 'b', 'c', 'd'].map(option => 
                    question[`option_${option}`] && (
                      <div 
                        key={option}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px', 
                          borderRadius: '4px', 
                          background: userAnswer === option ? (isCorrect ? '#d4edda' : '#f8d7da') : 
                                    (question.correct_answer === option && showCorrectAnswers ? '#e6f3ff' : '#f8f9fa')
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
                        <div style={{ flex: 1, fontSize: '14px' }}>{question[`option_${option}`]}</div>
                        {userAnswer === option && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            color: isCorrect ? '#28a745' : '#dc3545',
                            fontSize: '12px'
                          }}>
                            Your Answer {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                
                {showCorrectAnswers && !isCorrect && (
                  <div style={{ 
                    marginTop: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    color: '#856404', 
                    fontSize: '14px' 
                  }}>
                    <AlertTriangle size={16} />
                    Correct answer: Option {question.correct_answer.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '15px' 
      }}>
        {isPassed() ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            color: '#28a745' 
          }}>
            <Award size={32} />
            <p style={{ margin: 0, fontSize: '16px' }}>Congratulations! You have successfully passed this quiz.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            color: '#dc3545' 
          }}>
            <AlertTriangle size={32} />
            <p style={{ margin: 0, fontSize: '16px' }}>You did not meet the passing score. Review the material and try again.</p>
          </div>
        )}
        
        <button 
          onClick={() => navigate('/trainee/assessments')}
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
          <ArrowLeft size={16} />
          Back to Assessments
        </button>
      </div>
    </div>
  );
};

export default QuizFeedback;