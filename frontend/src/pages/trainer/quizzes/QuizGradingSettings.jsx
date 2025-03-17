import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  CheckSquare, 
  MessageSquare, 
  Percent,
  Info,
  AlertTriangle
} from 'lucide-react';

const QuizGradingSettings = ({ quizData, questions, onChange }) => {
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
    const initialSettings = {
      grading_type: quizData.grading_type || 'standard',
      passing_score: quizData.passing_score || 70,
      auto_feedback: quizData.auto_feedback || false,
      question_weights: [],
      feedback_templates: quizData.feedback_templates || [
        { min_score: 0, max_score: 60, template: 'You need to review the material and try again.' },
        { min_score: 60, max_score: 80, template: 'Good job! You\'ve passed but there\'s still room for improvement.' },
        { min_score: 80, max_score: 100, template: 'Excellent work! You\'ve mastered this content.' }
      ]
    };

    if (questions && questions.length > 0) {
      initialSettings.question_weights = questions.map(question => ({
        question_id: question.id,
        weight: question.weight || 1.0
      }));
    }

    setGradingSettings(initialSettings);
  }, [quizData, questions]);

  useEffect(() => {
    onChange(gradingSettings);
  }, [gradingSettings, onChange]);

  const handleGradingTypeChange = (e) => {
    setGradingSettings({
      ...gradingSettings,
      grading_type: e.target.value
    });
  };

  const handlePassingScoreChange = (e) => {
    setGradingSettings({
      ...gradingSettings,
      passing_score: parseFloat(e.target.value)
    });
  };

  const handleAutoFeedbackChange = (e) => {
    setGradingSettings({
      ...gradingSettings,
      auto_feedback: e.target.checked
    });
  };

  const handleQuestionWeightChange = (questionId, weight) => {
    setGradingSettings({
      ...gradingSettings,
      question_weights: gradingSettings.question_weights.map(qw => 
        qw.question_id === questionId ? { ...qw, weight: parseFloat(weight) } : qw
      )
    });
  };

  const handleFeedbackTemplateChange = (index, field, value) => {
    const updatedTemplates = [...gradingSettings.feedback_templates];
    updatedTemplates[index] = {
      ...updatedTemplates[index],
      [field]: field === 'min_score' || field === 'max_score' ? parseFloat(value) : value
    };
    
    setGradingSettings({
      ...gradingSettings,
      feedback_templates: updatedTemplates
    });
  };

  const addFeedbackTemplate = () => {
    setGradingSettings({
      ...gradingSettings,
      feedback_templates: [
        ...gradingSettings.feedback_templates,
        { min_score: 0, max_score: 100, template: '' }
      ]
    });
  };

  const removeFeedbackTemplate = (index) => {
    const updatedTemplates = [...gradingSettings.feedback_templates];
    updatedTemplates.splice(index, 1);
    
    setGradingSettings({
      ...gradingSettings,
      feedback_templates: updatedTemplates
    });
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(to right, #4B0082, #8A2BE2)', // Indigo gradient
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <BarChart2 size={20} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Grading Configuration</h3>
      </div>
      
      <div style={{ padding: '15px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ minWidth: '250px', flex: '1' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: 'bold',
              fontSize: '14px'
            }} htmlFor="grading_type">Grading Method</label>
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Percent size={18} style={{ 
                position: 'absolute', 
                left: '10px', 
                color: '#666' 
              }} />
              <select
                id="grading_type"
                value={gradingSettings.grading_type}
                onChange={handleGradingTypeChange}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 35px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="standard">Standard (Equal Weight)</option>
                <option value="weighted">Weighted Questions</option>
                <option value="custom">Custom Calculation</option>
              </select>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              marginTop: '5px',
              fontSize: '12px',
              color: '#666'
            }}>
              <Info size={14} />
              <span>Choose how quiz questions are scored</span>
            </div>
          </div>
          
          <div style={{ minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: 'bold',
              fontSize: '14px'
            }} htmlFor="passing_score">Passing Score (%)</label>
            <div style={{ position: 'relative' }}>
              <CheckSquare size={18} style={{ 
                position: 'absolute', 
                left: '10px', 
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }} />
              <input
                type="number"
                id="passing_score"
                value={gradingSettings.passing_score}
                onChange={handlePassingScoreChange}
                min="0"
                max="100"
                step="1"
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 35px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          <div style={{ minWidth: '250px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '5px'
            }}>
              <input
                type="checkbox"
                id="auto_feedback"
                checked={gradingSettings.auto_feedback}
                onChange={handleAutoFeedbackChange}
                style={{ margin: 0 }}
              />
              <label style={{ 
                fontWeight: 'bold',
                fontSize: '14px'
              }} htmlFor="auto_feedback">Provide Automatic Feedback</label>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              fontSize: '12px',
              color: '#666'
            }}>
              <Info size={14} />
              <span>Automatically generate feedback for trainees based on their scores</span>
            </div>
          </div>
        </div>
        
        {gradingSettings.grading_type === 'weighted' && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              margin: '0 0 5px 0' 
            }}>Question Weights</h4>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              margin: '0 0 15px 0' 
            }}>
              Assign different weights to each question. Higher weights make questions worth more points.
            </p>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {questions.map((question, index) => {
                const questionWeight = gradingSettings.question_weights.find(qw => qw.question_id === question.id);
                const weight = questionWeight ? questionWeight.weight : 1.0;
                
                return (
                  <div 
                    key={question.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        marginRight: '5px' 
                      }}>Q{index + 1}:</span>
                      <span style={{ 
                        wordBreak: 'break-word' 
                      }}>{question.question_text}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => handleQuestionWeightChange(question.id, e.target.value)}
                        min="0.1"
                        max="10"
                        step="0.1"
                        style={{
                          width: '80px',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>×</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              marginTop: '10px',
              fontSize: '12px',
              color: '#666'
            }}>
              <AlertTriangle size={14} style={{ color: '#ffc107' }} />
              <span>Total score will be normalized to 100%</span>
            </div>
          </div>
        )}
        
        {gradingSettings.auto_feedback && (
          <div>
            <h4 style={{ 
              fontSize: '16px', 
              margin: '0 0 5px 0' 
            }}>Feedback Templates</h4>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              margin: '0 0 15px 0' 
            }}>
              Configure feedback templates based on score ranges
            </p>
            
            <div style={{ marginBottom: '15px' }}>
              {gradingSettings.feedback_templates.map((template, index) => (
                <div 
                  key={index}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px' 
                    }}>
                      <input
                        type="number"
                        value={template.min_score}
                        onChange={(e) => handleFeedbackTemplateChange(index, 'min_score', e.target.value)}
                        min="0"
                        max="100"
                        step="1"
                        style={{
                          width: '80px',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>to</span>
                      <input
                        type="number"
                        value={template.max_score}
                        onChange={(e) => handleFeedbackTemplateChange(index, 'max_score', e.target.value)}
                        min="0"
                        max="100"
                        step="1"
                        style={{
                          width: '80px',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>%</span>
                    </div>
                    
                      <button 
                        type="button"
                        onClick={() => removeFeedbackTemplate(index)}
                        disabled={gradingSettings.feedback_templates.length <= 1}
                        style={{
                          padding: '5px',
                          background: gradingSettings.feedback_templates.length <= 1 ? '#ccc' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: gradingSettings.feedback_templates.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px' 
                  }}>
                    <MessageSquare size={16} style={{ 
                      color: '#666', 
                      flexShrink: 0,
                      marginTop: '8px'
                    }} />
                    <textarea
                      value={template.template}
                      onChange={(e) => handleFeedbackTemplateChange(index, 'template', e.target.value)}
                      placeholder="Enter feedback template for this score range..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="button"
              onClick={addFeedbackTemplate}
              style={{
                padding: '8px 15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              + Add Feedback Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGradingSettings;