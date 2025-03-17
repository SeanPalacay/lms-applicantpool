// src/pages/trainer/quizzes/edit/EditQuiz.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HelpCircle, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Plus, 
  Trash2,
  ArrowLeft,
  Save,
  RefreshCw,
  XCircle,
  AlertTriangle,
  BarChart2
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import QuizGradingSettings from '../QuizGradingSettings';
import trainerService from '../../../../services/trainerService';

const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'grading'
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    program_id: '',
    time_limit: 30,
    passing_score: 70,
    status: 'draft',
    questions: []
  });
  
  const [gradingSettings, setGradingSettings] = useState({
    grading_type: 'standard',
    passing_score: 70,
    auto_feedback: false,
    question_weights: [],
    feedback_templates: [
      { min_score: 0, max_score: 60, template: 'You need to review the material and try again.' },
      { min_score: 60, max_score: 80, template: 'Good job! You\'ve passed but there\'s still room for improvement.' },
      { min_score: 80, max_score: 100, template: 'Excellent work! You\'ve mastered this content.' }
    ]
  });
  
  // Question template
  const emptyQuestion = {
    id: null,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a'
  };

  useEffect(() => {
    const fetchQuizData = async () => {
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
        
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
        
        const quizResponse = await trainerService.getQuizById(quizId);
        if (!quizResponse.questions || quizResponse.questions.length === 0) {
          quizResponse.questions = [{ ...emptyQuestion }];
        }
        
        setQuizData(quizResponse);
        
        // Initialize grading settings
        setGradingSettings({
          grading_type: quizResponse.grading_type || 'standard',
          passing_score: quizResponse.passing_score || 70,
          auto_feedback: quizResponse.auto_feedback || false,
          question_weights: quizResponse.question_weights || 
            quizResponse.questions.map(q => ({ question_id: q.id, weight: 1.0 })),
          feedback_templates: quizResponse.feedback_templates || [
            { min_score: 0, max_score: 60, template: 'You need to review the material and try again.' },
            { min_score: 60, max_score: 80, template: 'Good job! You\'ve passed but there\'s still room for improvement.' },
            { min_score: 80, max_score: 100, template: 'Excellent work! You\'ve mastered this content.' }
          ]
        });
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [navigate, quizId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuizData({
      ...quizData,
      [name]: value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;
    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, { ...emptyQuestion }]
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions.splice(index, 1);
    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
  };
  
  const handleGradingSettingsChange = (newSettings) => {
    setGradingSettings(newSettings);
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    
    if (!quizData.title.trim()) {
      setError('Please enter a quiz title.');
      return false;
    }
    
    if (!quizData.program_id) {
      setError('Please select a program for this quiz.');
      return false;
    }
    
    if (quizData.time_limit <= 0) {
      setError('Time limit must be greater than 0 minutes.');
      return false;
    }
    
    if (quizData.passing_score < 0 || quizData.passing_score > 100) {
      setError('Passing score must be between 0 and 100.');
      return false;
    }
    
    if (quizData.questions.length === 0) {
      setError('Please add at least one question to the quiz.');
      return false;
    }
    
    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      if (!question.question_text.trim()) {
        setError(`Question ${i + 1}: Please enter the question text.`);
        return false;
      }
      if (!question.option_a.trim() || !question.option_b.trim()) {
        setError(`Question ${i + 1}: Please provide at least options A and B.`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // First, update the quiz data
      const formData = {
        ...quizData,
        time_limit: parseInt(quizData.time_limit),
        passing_score: parseFloat(quizData.passing_score)
      };
      
      await trainerService.updateQuiz(quizId, formData);
      
      // Then, update the grading configuration
      const gradingData = {
        ...gradingSettings,
        passing_score: parseFloat(gradingSettings.passing_score)
      };
      
      await trainerService.configureQuizGrading(quizId, gradingData);
      
      setSuccess('Quiz updated successfully.');
      setTimeout(() => {
        navigate(`/trainer/quizzes/${quizId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError(err.message || 'Failed to update quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/trainer/quizzes/${quizId}`);
  };

  const toggleStatus = async () => {
    const originalStatus = quizData.status;
    const newStatus = quizData.status === 'active' ? 'draft' : 'active';
    
    // Optimistically update UI
    setQuizData({ ...quizData, status: newStatus });
    
    try {
      await trainerService.updateQuizStatus(quizId, newStatus);
      setSuccess(`Quiz ${newStatus === 'active' ? 'published' : 'unpublished'} successfully.`);
    } catch (err) {
      console.error('Error updating quiz status:', err);
      setError('Failed to update quiz status. Please try again.');
      // Revert on failure
      setQuizData({ ...quizData, status: originalStatus });
    }
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.id.toString() === programId.toString());
    return program ? program.title : '';
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
          <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Edit Quiz</h1>
          <div style={{ height: '2px', background: '#ddd' }}></div>
        </div>
  
        {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
        {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}
  
        <div 
          onClick={handleCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '20px',
            color: '#007bff'
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: '5px' }} />
          <span>Back to Quiz</span>
        </div>
  
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '8px 15px',
              background: activeTab === 'questions' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'questions' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <HelpCircle size={16} /> Questions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            style={{
              padding: '8px 15px',
              background: activeTab === 'grading' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'grading' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <BarChart2 size={16} /> Grading
          </button>
        </div>
  
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HelpCircle size={20} style={{ marginRight: '10px' }} />
                <h3 style={{ margin: 0 }}>Quiz Information</h3>
              </div>
              <span style={{
                padding: '4px 8px',
                background: quizData.status === 'active' ? '#28a745' : '#ffc107',
                color: 'white',
                borderRadius: '4px'
              }}>
                {quizData.status === 'active' ? 'Published' : 'Draft'}
              </span>
            </div>
            <div style={{ padding: '15px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Quiz Title</label>
                <input
                  type="text"
                  name="title"
                  value={quizData.title}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="Enter quiz title"
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea
                  name="description"
                  value={quizData.description}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    minHeight: '80px'
                  }}
                  placeholder="Enter quiz description"
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Program</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={18} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                    <select
                      name="program_id"
                      value={quizData.program_id}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 30px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.title}</option>
                      ))}
                    </select>
                  </div>
                  {quizData.program_id && (
                    <div style={{ 
                      marginTop: '5px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <BookOpen size={14} />
                      <span>{getProgramName(quizData.program_id)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Time Limit (minutes)</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={18} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="number"
                      name="time_limit"
                      value={quizData.time_limit}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 30px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                      min="1"
                      max="180"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Passing Score (%)</label>
                  <div style={{ position: 'relative' }}>
                    <CheckSquare size={18} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="number"
                      name="passing_score"
                      value={quizData.passing_score}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 30px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {activeTab === 'questions' ? (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h2 style={{ fontSize: '20px', margin: 0 }}>Quiz Questions</h2>
                <span>{quizData.questions.length} Question{quizData.questions.length !== 1 ? 's' : ''}</span>
              </div>
  
              {quizData.questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '8px'
                }}>
                  <AlertTriangle size={24} style={{ color: '#ffc107' }} />
                  <p style={{ margin: '10px 0 0' }}>No questions added yet. Click "Add Question" to begin creating this quiz.</p>
                </div>
              ) : (
                <div>
                  {quizData.questions.map((question, index) => (
                    <div key={index} style={{
                      background: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      marginBottom: '15px',
                      padding: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <h3 style={{ margin: 0 }}>Question {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          disabled={quizData.questions.length === 1}
                          style={{
                            padding: '5px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: quizData.questions.length === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minHeight: '60px'
                          }}
                          placeholder="Enter your question here"
                          required
                        />
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '15px'
                      }}>
                        {['a', 'b', 'c', 'd'].map((option) => (
                          <div key={option}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                              <input
                                type="radio"
                                name={`correct_answer_${index}`}
                                value={option}
                                checked={question.correct_answer === option}
                                onChange={() => handleQuestionChange(index, 'correct_answer', option)}
                              />
                              <label>Option {option.toUpperCase()}</label>
                            </div>
                            <input
                              value={question[`option_${option}`]}
                              onChange={(e) => handleQuestionChange(index, `option_${option}`, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                              placeholder={`Enter option ${option.toUpperCase()} ${option <= 'b' ? '' : '(optional)'}`}
                              required={option <= 'b'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
  
              <div style={{ marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    padding: '8px 15px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>
            </div>
          ) : (
            <QuizGradingSettings 
              quizData={quizData} 
              questions={quizData.questions} 
              onChange={handleGradingSettingsChange} 
            />
          )}
  
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '8px 15px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <XCircle size={16} /> Cancel
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '8px 15px',
                  background: saving ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={toggleStatus}
                disabled={saving}
                style={{
                  padding: '8px 15px',
                  background: saving ? '#6c757d' : (quizData.status === 'active' ? '#ffc107' : '#28a745'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <CheckSquare size={16} />
                {quizData.status === 'active' ? ' Unpublish' : ' Publish'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

export default EditQuiz;