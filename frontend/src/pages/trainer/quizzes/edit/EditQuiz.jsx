import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  CheckSquare,
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
import TrainerService from '../../../../services/trainerService'; // Adjust path to match your structure

const emptyQuestion = {
  id: null,
  question_text: '',
  question_type: 'multiple_choice',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'a',
  correct_answers: [],
  answer_text: '',
  matching_pairs: [],
  is_true: true
};

const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
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

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate authentication (replace with actual auth logic)
        const mockToken = btoa(`2:${Math.floor(Date.now() / 1000)}`); // Trainer ID 2
        const mockUserRole = 'trainer';

        if (!mockToken) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (mockUserRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${mockUserRole}-dashboard`), 2000);
          return;
        }

        // Mock programs (replace with API call if available)
        const programsData = [
          { id: '14', title: 'Accounting' } // Matches program_id=14 from schema
        ];
        setPrograms(programsData);

        // Fetch quiz data from backend
        const quizResponse = await TrainerService.getQuizById(quizId);
        if (!quizResponse) {
          throw new Error('Quiz not found or you do not have access.');
        }

        // Map backend response to component's expected format
        const formattedQuestions = quizResponse.questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type === 'multiple_answer' ? 'multiple_answer' : 'multiple_choice', // Adjust as needed
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_answer: q.correct_answer || 'a',
          correct_answers: q.question_type === 'multiple_answer' && q.correct_answer ? q.correct_answer.split(',') : [],
          answer_text: '',
          matching_pairs: [],
          is_true: q.correct_answer === 'a'
        }));

        setQuizData({
          id: quizResponse.id,
          title: quizResponse.title || '',
          description: quizResponse.description || '',
          program_id: quizResponse.program_id?.toString() || '',
          time_limit: quizResponse.time_limit || 30,
          passing_score: parseFloat(quizResponse.passing_score) || 70,
          status: quizResponse.status || 'draft',
          questions: formattedQuestions.length > 0 ? formattedQuestions : [{ ...emptyQuestion }],
          created_at: quizResponse.created_at,
          created_by: quizResponse.created_by?.toString(),
          created_by_name: quizResponse.created_by_name || ''
        });

        setGradingSettings({
          grading_type: quizResponse.grading_type || 'standard',
          passing_score: parseFloat(quizResponse.passing_score) || 70,
          auto_feedback: !!quizResponse.auto_feedback,
          question_weights: quizResponse.question_weights.length > 0
            ? quizResponse.question_weights
            : formattedQuestions.map(q => ({ question_id: q.id, weight: 1.0 })),
          feedback_templates: quizResponse.feedback_templates.length > 0
            ? quizResponse.feedback_templates
            : [
                { min_score: 0, max_score: 60, template: 'You need to review the material and try again.' },
                { min_score: 60, max_score: 80, template: 'Good job! You\'ve passed but there\'s still room for improvement.' },
                { min_score: 80, max_score: 100, template: 'Excellent work! You\'ve mastered this content.' }
              ]
        });
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Failed to load quiz. Please try again.');
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
          correct_answers: []
        };
      } else if (newType === 'identification') {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          question_type: newType,
          answer_text: ''
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
          question_type: newType
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
      const [prefix, pairIndex, side] = field.split('_');
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

      if (question.question_type === 'multiple_choice' || question.question_type === 'multiple_answer') {
        if (!question.option_a.trim() || !question.option_b.trim()) {
          setError(`Question ${i + 1}: Please provide at least options A and B.`);
          return false;
        }

        if (question.question_type === 'multiple_answer' && (!question.correct_answers || question.correct_answers.length === 0)) {
          setError(`Question ${i + 1}: Please select at least one correct answer for multiple answer question.`);
          return false;
        }
      } else if (question.question_type === 'identification') {
        if (!question.answer_text || !question.answer_text.trim()) {
          setError(`Question ${i + 1}: Please provide a correct answer for identification question.`);
          return false;
        }
      } else if (question.question_type === 'matching') {
        if (!question.matching_pairs || question.matching_pairs.length < 2) {
          setError(`Question ${i + 1}: Matching questions require at least 2 pairs.`);
          return false;
        }

        for (let j = 0; j < question.matching_pairs.length; j++) {
          const pair = question.matching_pairs[j];
          if (!pair.left.trim() || !pair.right.trim()) {
            setError(`Question ${i + 1}, Pair ${j + 1}: Both left and right items must be provided.`);
            return false;
          }
        }
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
      // Simulate API call to update quiz (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Quiz updated successfully.');
      setTimeout(() => {
        navigate(`/trainer/quizzes/${quizId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError('Failed to update quiz. Please try again.');
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

    setQuizData({ ...quizData, status: newStatus });

    try {
      // Simulate API call to update status (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess(`Quiz ${newStatus === 'active' ? 'published' : 'unpublished'} successfully.`);
    } catch (err) {
      console.error('Error updating quiz status:', err);
      setError('Failed to update quiz status. Please try again.');
      setQuizData({ ...quizData, status: originalStatus });
    }
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
        <option value="matching">Matching</option>
        <option value="essay">Essay/Short Answer</option>
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

  const IdentificationQuestion = ({ question, index, onQuestionChange }) => (
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
          placeholder="Enter your identification question here"
          required
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Correct Answer</label>
        <input
          value={question.answer_text || ''}
          onChange={(e) => onQuestionChange(index, 'answer_text', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          placeholder="Enter the correct answer"
          required
        />
      </div>
    </div>
  );

  const MatchingQuestion = ({ question, index, onQuestionChange }) => {
    const addMatchingPair = () => {
      const pairs = [...(question.matching_pairs || [])];
      const newKey = String.fromCharCode(97 + pairs.length);
      pairs.push({ left: '', right: '', key: newKey });
      onQuestionChange(index, 'matching_pairs', pairs);
    };

    const removeMatchingPair = (pairIndex) => {
      const pairs = [...(question.matching_pairs || [])];
      pairs.splice(pairIndex, 1);
      onQuestionChange(index, 'matching_pairs', pairs);
    };

    return (
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
            placeholder="Enter instructions for the matching question"
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>Matching Pairs</label>

          {(question.matching_pairs || []).map((pair, pairIndex) => (
            <div key={pairIndex} style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  value={pair.left}
                  onChange={(e) => onQuestionChange(index, `matching_${pairIndex}_left`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="Left item"
                  required
                />
              </div>
              <div style={{ flex: '1' }}>
                <input
                  value={pair.right}
                  onChange={(e) => onQuestionChange(index, `matching_${pairIndex}_right`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="Right item"
                  required
                />
              </div>
              {question.matching_pairs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMatchingPair(pairIndex)}
                  style={{
                    padding: '8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addMatchingPair}
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
            <Plus size={16} /> Add Pair
          </button>
        </div>
      </div>
    );
  };

  const EssayQuestion = ({ question, index, onQuestionChange }) => (
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
          placeholder="Enter your essay/short answer question here"
          required
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Model Answer (For Trainer Reference)</label>
        <textarea
          value={question.answer_text || ''}
          onChange={(e) => onQuestionChange(index, 'answer_text', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '100px'
          }}
          placeholder="Enter a model answer for reference (optional)"
        />
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!quizData.id) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <AlertBanner message="Quiz not found." type="error" />
      </div>
    );
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
                  minHeight: '100px'
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
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Time Limit (minutes)</label>
                <input
                  type="number"
                  name="time_limit"
                  value={quizData.time_limit}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  min="1"
                  required
                />
              </div>
              <div style={{ flex: 1, marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Passing Score (%)</label>
                <input
                  type="number"
                  name="passing_score"
                  value={quizData.passing_score}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
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
                <p style={{ margin: '10px 0 0' }}>No questions added yet. Click "Add Question" to begin editing this quiz.</p>
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

                    {question.question_type === 'matching' && (
                      <MatchingQuestion
                        question={question}
                        index={index}
                        onQuestionChange={handleQuestionChange}
                      />
                    )}

                    {question.question_type === 'essay' && (
                      <EssayQuestion
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
              {quizData.status === 'active' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;