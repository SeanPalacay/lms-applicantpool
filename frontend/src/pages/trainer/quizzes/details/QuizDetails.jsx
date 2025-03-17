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
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Quiz Details</h1>
          <div style={{ height: '2px', background: '#ddd' }}></div>
        </div>
  
        {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
        {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}
  
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
          <span>Back to Quizzes</span>
        </div>
  
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', margin: 0 }}>{quiz.title}</h2>
          <div>
            {deleteConfirm ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>Are you sure?</span>
                <button 
                  onClick={handleDelete}
                  style={{
                    padding: '5px 10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Yes
                </button>
                <button 
                  onClick={cancelDelete}
                  style={{
                    padding: '5px 10px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleEdit}
                  style={{
                    padding: '8px 15px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Edit size={16} /> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  style={{
                    padding: '8px 15px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
  
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <HelpCircle size={20} style={{ marginRight: '10px' }} />
              <h3 style={{ margin: 0 }}>Quiz Information</h3>
            </div>
            <div style={{ padding: '15px' }}>
              {quiz.description && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>Description</h4>
                  <p style={{ margin: 0 }}>{quiz.description}</p>
                </div>
              )}
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <BookOpen size={18} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Program</div>
                    <Link 
                      to={`/trainer/programs/${quiz.program_id}`}
                      style={{ color: '#007bff', textDecoration: 'none' }}
                    >
                      {quiz.program_title}
                    </Link>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Clock size={18} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Time Limit</div>
                    <div>{quiz.time_limit} minutes</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <CheckSquare size={18} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Passing Score</div>
                    <div>{quiz.passing_score}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <HelpCircle size={18} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Questions</div>
                    <div>{quiz.questions.length}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '5px' }}>
                <Calendar size={14} />
                <span>Created: {formatDate(quiz.created_at)}</span>
              </div>
            </div>
          </div>
  
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #007bff, #00b7ff)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BarChart2 size={20} style={{ marginRight: '10px' }} />
                <h3 style={{ margin: 0 }}>Performance Statistics</h3>
              </div>
              <Link 
                to={`/trainer/quizzes/${quizId}/results`}
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Eye size={14} /> View Results
              </Link>
            </div>
            <div style={{ padding: '15px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Users size={24} style={{ marginBottom: '5px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{quiz.stats?.total_attempts || 0}</div>
                  <div>Total Attempts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <BarChart2 size={24} style={{ marginBottom: '5px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{quiz.stats?.average_score || 'N/A'}</div>
                  <div>Average Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <CheckSquare size={24} style={{ marginBottom: '5px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{quiz.stats?.pass_rate || 0}%</div>
                  <div>Pass Rate</div>
                </div>
              </div>
              {quiz.stats?.total_attempts > 0 ? (
                <div>
                  <h4 style={{ margin: '0 0 10px 0' }}>Score Distribution</h4>
                  <div style={{
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0 }}>Score distribution visualization would go here.</p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <AlertTriangle size={24} style={{ color: '#ffc107', marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>No quiz attempts have been recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
  
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Quiz Questions</h2>
            <span>{quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}</span>
          </div>
  
          {quiz.questions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <AlertTriangle size={36} style={{ color: '#ffc107', marginBottom: '10px' }} />
              <h3 style={{ margin: '0 0 10px 0' }}>No Questions</h3>
              <p style={{ margin: '0 0 15px 0' }}>This quiz doesn't have any questions yet.</p>
              <button 
                onClick={handleEdit}
                style={{
                  padding: '8px 15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Edit size={16} /> Edit Quiz
              </button>
            </div>
          ) : (
            <div>
              {quiz.questions.map((question, index) => (
                <div key={index} style={{
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>Q{index + 1}</div>
                    <div>{question.question_text}</div>
                  </div>
                  <div style={{ padding: '15px' }}>
                    {['a', 'b', 'c', 'd'].map(option => question[`option_${option}`] && (
                      <div 
                        key={option}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px',
                          background: question.correct_answer === option ? '#e6ffe6' : 'transparent',
                          marginBottom: '5px',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ width: '20px', fontWeight: 'bold' }}>{option.toUpperCase()}</div>
                        <div style={{ flex: 1 }}>{question[`option_${option}`]}</div>
                        {question.correct_answer === option && (
                          <CheckCircle size={16} style={{ color: '#28a745' }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    padding: '10px 15px',
                    background: '#f8f9fa',
                    borderRadius: '0 0 8px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <CheckCircle size={14} style={{ color: '#28a745' }} />
                    <span>Correct answer: {question.correct_answer.toUpperCase()}</span>
                  </div>
                </div>
              ))}
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
            <FileText size={16} /> Export Quiz as PDF
          </button>
        </div>
      </div>
    );
  };

export default QuizDetails;