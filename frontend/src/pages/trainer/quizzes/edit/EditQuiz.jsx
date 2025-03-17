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
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/EditQuiz.css';

const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    program_id: '',
    time_limit: 30,
    passing_score: 70,
    status: 'draft',
    questions: []
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
      const formData = {
        ...quizData,
        time_limit: parseInt(quizData.time_limit),
        passing_score: parseFloat(quizData.passing_score)
      };
      
      await trainerService.updateQuiz(quizId, formData);
      
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
    <div className="edit-quiz-container">
      <div className="section-header">
        <h1>Edit Quiz</h1>
        <div className="header-line"></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div className="back-link" onClick={handleCancel}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Quiz</span>
      </div>
      
      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="quiz-card">
          <div className="card-header gradient-rose">
            <div className="header-icon">
              <HelpCircle size={20} />
            </div>
            <div className="header-content">
              <h3>Quiz Information</h3>
              <div className="quiz-status">
                <span className={`status-badge ${quizData.status === 'active' ? 'status-active' : 'status-draft'}`}>
                  {quizData.status === 'active' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-content">
            <div className="form-row">
              <div className="form-group full">
                <label htmlFor="title">Quiz Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={quizData.title}
                  onChange={handleInputChange}
                  placeholder="Enter quiz title"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={quizData.description}
                  onChange={handleInputChange}
                  placeholder="Enter quiz description"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="program_id">Program</label>
                <div className="select-with-icon">
                  <BookOpen size={18} className="select-icon" />
                  <select
                    id="program_id"
                    name="program_id"
                    value={quizData.program_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {quizData.program_id && (
                  <div className="selected-program">
                    <BookOpen size={14} className="icon-inline" />
                    <span>{getProgramName(quizData.program_id)}</span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="time_limit">Time Limit (minutes)</label>
                <div className="input-with-icon">
                  <Clock size={18} className="input-icon" />
                  <input
                    type="number"
                    id="time_limit"
                    name="time_limit"
                    value={quizData.time_limit}
                    onChange={handleInputChange}
                    min="1"
                    max="180"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="passing_score">Passing Score (%)</label>
                <div className="input-with-icon">
                  <CheckSquare size={18} className="input-icon" />
                  <input
                    type="number"
                    id="passing_score"
                    name="passing_score"
                    value={quizData.passing_score}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="questions-section">
          <div className="questions-header">
            <h2>Quiz Questions</h2>
            <div className="questions-count">
              <span>{quizData.questions.length} Question{quizData.questions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {quizData.questions.length === 0 ? (
            <div className="no-questions-message">
              <AlertTriangle size={24} className="warning-icon" />
              <p>No questions added yet. Click "Add Question" to begin creating this quiz.</p>
            </div>
          ) : (
            <div className="questions-list">
              {quizData.questions.map((question, index) => (
                <div key={index} className="question-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                    <button 
                      type="button" 
                      className="remove-question" 
                      onClick={() => removeQuestion(index)}
                      disabled={quizData.questions.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="question-content">
                    <div className="form-group full">
                      <label htmlFor={`question_${index}`}>Question Text</label>
                      <textarea
                        id={`question_${index}`}
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                        placeholder="Enter your question here"
                        rows="2"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="options-grid">
                      <div className="form-group">
                        <div className="option-label">
                          <input 
                            type="radio"
                            name={`correct_answer_${index}`}
                            value="a"
                            checked={question.correct_answer === 'a'}
                            onChange={() => handleQuestionChange(index, 'correct_answer', 'a')}
                          />
                          <label htmlFor={`option_a_${index}`}>Option A</label>
                        </div>
                        <input
                          id={`option_a_${index}`}
                          value={question.option_a}
                          onChange={(e) => handleQuestionChange(index, 'option_a', e.target.value)}
                          placeholder="Enter option A"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <div className="option-label">
                          <input 
                            type="radio"
                            name={`correct_answer_${index}`}
                            value="b"
                            checked={question.correct_answer === 'b'}
                            onChange={() => handleQuestionChange(index, 'correct_answer', 'b')}
                          />
                          <label htmlFor={`option_b_${index}`}>Option B</label>
                        </div>
                        <input
                          id={`option_b_${index}`}
                          value={question.option_b}
                          onChange={(e) => handleQuestionChange(index, 'option_b', e.target.value)}
                          placeholder="Enter option B"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <div className="option-label">
                          <input 
                            type="radio"
                            name={`correct_answer_${index}`}
                            value="c"
                            checked={question.correct_answer === 'c'}
                            onChange={() => handleQuestionChange(index, 'correct_answer', 'c')}
                          />
                          <label htmlFor={`option_c_${index}`}>Option C</label>
                        </div>
                        <input
                          id={`option_c_${index}`}
                          value={question.option_c}
                          onChange={(e) => handleQuestionChange(index, 'option_c', e.target.value)}
                          placeholder="Enter option C (optional)"
                        />
                      </div>
                      
                      <div className="form-group">
                        <div className="option-label">
                          <input 
                            type="radio"
                            name={`correct_answer_${index}`}
                            value="d"
                            checked={question.correct_answer === 'd'}
                            onChange={() => handleQuestionChange(index, 'correct_answer', 'd')}
                          />
                          <label htmlFor={`option_d_${index}`}>Option D</label>
                        </div>
                        <input
                          id={`option_d_${index}`}
                          value={question.option_d}
                          onChange={(e) => handleQuestionChange(index, 'option_d', e.target.value)}
                          placeholder="Enter option D (optional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="add-question-container">
            <button 
              type="button" 
              className="add-question-button"
              onClick={addQuestion}
            >
              <Plus size={16} className="icon-inline" /> Add Question
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="action-button secondary" onClick={handleCancel}>
            <XCircle size={16} className="icon-inline" /> Cancel
          </button>
          
          <div className="primary-actions">
            <button 
              type="submit" 
              className="action-button primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="icon-inline spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="icon-inline" /> Save Changes
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className={`action-button ${quizData.status === 'active' ? 'unpublish' : 'publish'}`}
              onClick={toggleStatus}
              disabled={saving}
            >
              <CheckSquare size={16} className="icon-inline" />
              {quizData.status === 'active' ? ' Unpublish' : ' Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;