import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const CreateQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const programIdParam = queryParams.get('programId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programs, setPrograms] = useState([]); // List of available programs
  const [activeTab, setActiveTab] = useState('questions');
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    program_id: programIdParam || '',
    time_limit: 30,
    passing_score: 70,
    status: 'draft',
    questions: [],
    auto_grade: true,
    grade_on_submission: true,
    show_correct_answers: false,
    show_grade_immediately: true,
    grade_weighting: 'equal'
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
  
  const emptyQuestion = {
    question_text: '',
    question_type: 'multiple_choice',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a',
    answer_text: '',
    alternative_answers: '',
    case_sensitive: false,
    matching_pairs: [],
    is_true: true
  };

  useEffect(() => {
    const initializeQuiz = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch all programs
        const programData = await trainerService.getPrograms();
        if (!programData || programData.length === 0) {
          setError('No programs available. Please create a program first.');
          setTimeout(() => navigate('/trainer/programs'), 2000);
          return;
        }
        setPrograms(programData);
        
        // Validate programIdParam
        if (programIdParam) {
          const selectedProgram = programData.find(p => p.id === programIdParam);
          if (!selectedProgram) {
            setError('Invalid or inaccessible program selected. Please choose a valid program.');
            setTimeout(() => navigate('/trainer/programs'), 2000);
            return;
          }
        }
        
        setQuizData(prev => ({
          ...prev,
          questions: [{ ...emptyQuestion }],
          program_id: programIdParam || programData[0]?.id || '' // Default to first program if no programIdParam
        }));
      } catch (err) {
        console.error('Error initializing quiz:', err);
        setError('Failed to load program details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [navigate, programIdParam]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuizData({
      ...quizData,
      [name]: value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    
    if (field === 'question_type') {
      const newType = value;
      if (newType === 'true_false') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          option_a: 'True',
          option_b: 'False',
          option_c: '',
          option_d: '',
          correct_answer: 'a',
          is_true: true
        };
      } else if (newType === 'multiple_answer') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          option_a: updatedQuestions[index].option_a || '',
          option_b: updatedQuestions[index].option_b || '',
          option_c: updatedQuestions[index].option_c || '',
          option_d: updatedQuestions[index].option_d || '',
          correct_answers: []
        };
      } else if (newType === 'identification') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          answer_text: '',
          alternative_answers: '',
          case_sensitive: false
        };
      } else if (newType === 'matching') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          matching_pairs: [
            { left: '', right: '', key: 'a' },
            { left: '', right: '', key: 'b' }
          ]
        };
      } else {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          option_a: updatedQuestions[index].option_a || '',
          option_b: updatedQuestions[index].option_b || '',
          option_c: updatedQuestions[index].option_c || '',
          option_d: updatedQuestions[index].option_d || '',
          correct_answer: updatedQuestions[index].correct_answer || 'a'
        };
      }
    } else if (field === 'is_true') {
      updatedQuestions[index].is_true = value;
      updatedQuestions[index].correct_answer = value ? 'a' : 'b';
    } else if (field === 'correct_answers') {
      const currentAnswers = updatedQuestions[index].correct_answers || [];
      if (currentAnswers.includes(value)) {
        updatedQuestions[index].correct_answers = currentAnswers.filter(a => a !== value);
      } else {
        updatedQuestions[index].correct_answers = [...currentAnswers, value];
      }
    } else if (field.startsWith('matching_')) {
      const [_, pairIndex, side] = field.split('_');
      const pairs = [...updatedQuestions[index].matching_pairs];
      pairs[parseInt(pairIndex)][side] = value;
      updatedQuestions[index].matching_pairs = pairs;
    } else {
      updatedQuestions[index][field] = value;
    }
    
    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
  };

  const handleGradingSettingsChange = (newSettings) => {
    setGradingSettings(newSettings);
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
      setError('Please select a program.');
      return false;
    }
    
    if (!programs.some(p => p.id === quizData.program_id)) {
      setError('Selected program is invalid or inaccessible.');
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
      
      switch (question.question_type) {
        case 'multiple_choice':
          if (!question.option_a.trim() || !question.option_b.trim()) {
            setError(`Question ${i + 1}: Please provide at least options A and B.`);
            return false;
          }
          if (!question.correct_answer) {
            setError(`Question ${i + 1}: Please select the correct answer.`);
            return false;
          }
          break;
          
        case 'multiple_answer':
          if (!question.option_a.trim() || !question.option_b.trim()) {
            setError(`Question ${i + 1}: Please provide at least options A and B.`);
            return false;
          }
          if (!question.correct_answers || question.correct_answers.length === 0) {
            setError(`Question ${i + 1}: Please select at least one correct answer.`);
            return false;
          }
          break;
          
        case 'identification':
          if (!question.answer_text || !question.answer_text.trim()) {
            setError(`Question ${i + 1}: Please provide the correct answer.`);
            return false;
          }
          break;
          
        case 'matching':
          if (!question.matching_pairs || question.matching_pairs.length < 2) {
            setError(`Question ${i + 1}: Please provide at least two matching pairs.`);
            return false;
          }
          for (let j = 0; j < question.matching_pairs.length; j++) {
            const pair = question.matching_pairs[j];
            if (!pair.left || !pair.left.trim() || !pair.right || !pair.right.trim()) {
              setError(`Question ${i + 1}: Please complete both sides of all matching pairs.`);
              return false;
            }
          }
          break;
          
        case 'true_false':
          break;
          
        default:
          setError(`Question ${i + 1}: Unknown question type.`);
          return false;
      }
    }
    
    if (gradingSettings.grading_type === 'weighted') {
      let totalWeight = 0;
      for (let i = 0; i < gradingSettings.question_weights.length; i++) {
        const weight = gradingSettings.question_weights[i].weight;
        if (weight < 0) {
          setError(`Question weight for question ${i + 1} cannot be negative.`);
          return false;
        }
        totalWeight += parseFloat(weight);
      }
    }
    
    if (quizData.auto_grade && gradingSettings.auto_feedback) {
      if (!gradingSettings.feedback_templates || gradingSettings.feedback_templates.length === 0) {
        setError('Please add at least one feedback template for auto-grading.');
        return false;
      }
      for (const template of gradingSettings.feedback_templates) {
        if (!template.template || !template.template.trim()) {
          setError('All feedback templates must have content.');
          return false;
        }
        if (template.min_score < 0 || template.min_score > 100 || 
            template.max_score < 0 || template.max_score > 100) {
          setError('Feedback template score ranges must be between 0 and 100.');
          return false;
        }
        if (template.min_score >= template.max_score) {
          setError('Each feedback template\'s minimum score must be less than its maximum score.');
          return false;
        }
      }
    }
    
    return true;
  };

  const QuestionTypeSelector = ({ questionType, onChange }) => (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>Question Type</label>
      <select
        value={questionType}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      >
        <option value="multiple_choice">Multiple Choice</option>
        <option value="multiple_answer">Multiple Answer</option>
        <option value="true_false">True/False</option>
        <option value="identification">Identification</option>
      </select>
    </div>
  );

  const MultipleChoiceQuestion = ({ question, index, onQuestionChange }) => (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
        <textarea
          value={question.question_text}
          onChange={(e) => onQuestionChange(index, 'question_text', e.target.value)}
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
                onChange={() => onQuestionChange(index, 'correct_answer', option)}
              />
              <label>Option {option.toUpperCase()}</label>
            </div>
            <input
              value={question[`option_${option}`]}
              onChange={(e) => onQuestionChange(index, `option_${option}`, e.target.value)}
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
  );

  const MultipleAnswerQuestion = ({ question, index, onQuestionChange }) => (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
        <textarea
          value={question.question_text}
          onChange={(e) => onQuestionChange(index, 'question_text', e.target.value)}
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
                type="checkbox"
                checked={question.correct_answers?.includes(option) || false}
                onChange={() => onQuestionChange(index, 'correct_answers', option)}
              />
              <label>Option {option.toUpperCase()}</label>
            </div>
            <input
              value={question[`option_${option}`]}
              onChange={(e) => onQuestionChange(index, `option_${option}`, e.target.value)}
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
  );

  const TrueFalseQuestion = ({ question, index, onQuestionChange }) => (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
        <textarea
          value={question.question_text}
          onChange={(e) => onQuestionChange(index, 'question_text', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '60px'
          }}
          placeholder="Enter your true/false statement here"
          required
        />
      </div>
      <div style={{ display: 'flex', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <input
              type="radio"
              name={`is_true_${index}`}
              checked={question.is_true === true}
              onChange={() => onQuestionChange(index, 'is_true', true)}
            />
            <label>True</label>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <input
              type="radio"
              name={`is_true_${index}`}
              checked={question.is_true === false}
              onChange={() => onQuestionChange(index, 'is_true', false)}
            />
            <label>False</label>
          </div>
        </div>
      </div>
    </div>
  );

  const IdentificationQuestion = ({ question, index, onQuestionChange }) => {
    React.useEffect(() => {
      if (question.answer_text === undefined) {
        onQuestionChange(index, 'answer_text', '');
      }
      if (question.alternative_answers === undefined) {
        onQuestionChange(index, 'alternative_answers', '');
      }
      if (question.case_sensitive === undefined) {
        onQuestionChange(index, 'case_sensitive', false);
      }
    }, [question, index, onQuestionChange]);

    const handleAnswerChange = (e) => {
      onQuestionChange(index, 'answer_text', e.target.value);
    };

    const handleAlternativeAnswersChange = (e) => {
      onQuestionChange(index, 'alternative_answers', e.target.value);
    };

    const handleCaseSensitiveChange = (e) => {
      onQuestionChange(index, 'case_sensitive', e.target.checked);
    };

    return (
      <div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Question Text</label>
          <textarea
            value={question.question_text || ''}
            onChange={(e) => onQuestionChange(index, 'question_text', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minHeight: '60px'
            }}
            placeholder="Enter your identification question here"
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <span style={{ color: '#dc3545', marginRight: '4px' }}>*</span>
            Correct Answer
          </label>
          <input
            value={question.answer_text || ''}
            onChange={handleAnswerChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            placeholder="Enter the correct answer (required)"
            required
          />
          <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
            This is the answer trainees must provide to get this question correct.
          </small>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Alternative Answers (Optional)
          </label>
          <textarea
            value={question.alternative_answers || ''}
            onChange={handleAlternativeAnswersChange}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minHeight: '60px'
            }}
            placeholder="Enter alternative acceptable answers, one per line (optional)"
          />
          <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
            If there are multiple acceptable answers, list them here (one per line).
          </small>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px' 
        }}>
          <input
            type="checkbox"
            id={`case_sensitive_${index}`}
            checked={question.case_sensitive || false}
            onChange={handleCaseSensitiveChange}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor={`case_sensitive_${index}`}>
            Case-sensitive answer checking
          </label>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const preparedQuizData = JSON.parse(JSON.stringify(quizData));
      
      preparedQuizData.questions = preparedQuizData.questions.map(question => {
        const questionType = question.question_type;
        
        const baseQuestion = {
          question_type: questionType,
          question_text: question.question_text
        };
        
        switch (questionType) {
          case 'multiple_choice':
            return {
              ...baseQuestion,
              option_a: question.option_a || '',
              option_b: question.option_b || '',
              option_c: question.option_c || '',
              option_d: question.option_d || '',
              correct_answer: question.correct_answer || 'a'
            };
            
          case 'multiple_answer':
            return {
              ...baseQuestion,
              option_a: question.option_a || '',
              option_b: question.option_b || '',
              option_c: question.option_c || '',
              option_d: question.option_d || '',
              correct_answers: Array.isArray(question.correct_answers) ? question.correct_answers : []
            };
            
          case 'true_false':
            return {
              ...baseQuestion,
              is_true: question.is_true === true
            };
            
          case 'identification':
            return {
              ...baseQuestion,
              answer_text: (question.answer_text || '').trim(),
              alternative_answers: (question.alternative_answers || '').trim(),
              case_sensitive: question.case_sensitive === true
            };
            
          default:
            return baseQuestion;
        }
      });
      
      const mappedQuizData = {
        ...preparedQuizData,
        time_limit: parseInt(preparedQuizData.time_limit) || 30,
        passing_score: parseFloat(preparedQuizData.passing_score) || 70,
        grade_weighting: gradingSettings.grading_type === 'weighted' ? 'custom' : 'equal',
        auto_feedback: !!gradingSettings.auto_feedback
      };
      
      if (gradingSettings.grading_type === 'weighted') {
        mappedQuizData.question_weights = gradingSettings.question_weights;
      }
      
      if (gradingSettings.auto_feedback) {
        mappedQuizData.feedback_templates = gradingSettings.feedback_templates;
      }
      
      console.log("Sending quiz data:", JSON.stringify(mappedQuizData));
      
      const response = await trainerService.createQuiz(mappedQuizData);
      
      if (response && response.quizId) {
        const gradingData = {
          ...gradingSettings,
          passing_score: parseFloat(gradingSettings.passing_score)
        };
        
        try {
          await trainerService.configureQuizGrading(response.quizId, gradingData);
        } catch (gradingError) {
          console.error("Error configuring grading settings:", gradingError);
        }
        
        setSuccess('Quiz created successfully.');
        
        setTimeout(() => {
          navigate(`/trainer/quizzes?programId=${quizData.program_id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err.message || 'Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(programIdParam ? `/trainer/quizzes?programId=${programIdParam}` : '/trainer/quizzes');
  };

  const handlePublish = () => {
    setQuizData({
      ...quizData,
      status: 'active'
    });
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
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Create New Quiz</h1>
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
        <span>Back to Quizzes</span>
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
            alignItems: 'center'
          }}>
            <HelpCircle size={20} style={{ marginRight: '10px' }} />
            <h3 style={{ margin: 0 }}>Quiz Information</h3>
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
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Program</label>
              <select
                name="program_id"
                value={quizData.program_id}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
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
                    
                    <QuestionTypeSelector 
                      questionType={question.question_type} 
                      onChange={(value) => handleQuestionChange(index, 'question_type', value)} 
                    />
                    
                    {question.question_type === 'multiple_choice' && (
                      <MultipleChoiceQuestion 
                        question={question} 
                        index={index} 
                        onQuestionChange={handleQuestionChange} 
                      />
                    )}
                    
                    {question.question_type === 'multiple_answer' && (
                      <MultipleAnswerQuestion 
                        question={question} 
                        index={index} 
                        onQuestionChange={handleQuestionChange} 
                      />
                    )}
                    
                    {question.question_type === 'true_false' && (
                      <TrueFalseQuestion 
                        question={question} 
                        index={index} 
                        onQuestionChange={handleQuestionChange} 
                      />
                    )}
                    
                    {question.question_type === 'identification' && (
                      <IdentificationQuestion 
                        question={question} 
                        index={index} 
                        onQuestionChange={handleQuestionChange} 
                      />
                    )}
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
                  <Save size={16} /> Save as Draft
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              style={{
                padding: '8px 15px',
                background: saving ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <CheckSquare size={16} /> Save & Publish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;