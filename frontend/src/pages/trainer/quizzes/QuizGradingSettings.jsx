import React, { useState, useEffect } from 'react';
import { BarChart2, HelpCircle, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';

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
    // Initialize with quiz data if available
    const initialGradingType = quizData.grade_weighting === 'custom' ? 'weighted' : 'standard';
    
    const initialWeights = questions.map((question, index) => ({
      question_id: index,
      weight: 1.0
    }));

    setGradingSettings({
      grading_type: initialGradingType,
      passing_score: quizData.passing_score || 70,
      auto_feedback: quizData.auto_feedback || false,
      question_weights: initialWeights,
      feedback_templates: [
        { min_score: 0, max_score: 60, template: 'You need to review the material and try again.' },
        { min_score: 60, max_score: 80, template: 'Good job! You\'ve passed but there\'s still room for improvement.' },
        { min_score: 80, max_score: 100, template: 'Excellent work! You\'ve mastered this content.' }
      ]
    });
  }, [quizData, questions]);

  useEffect(() => {
    if (onChange) {
      onChange(gradingSettings);
    }
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

  const handleQuestionWeightChange = (index, value) => {
    const updatedWeights = [...gradingSettings.question_weights];
    updatedWeights[index] = {
      ...updatedWeights[index],
      weight: parseFloat(value)
    };
    
    setGradingSettings({
      ...gradingSettings,
      question_weights: updatedWeights
    });
  };

  const handleTemplateChange = (index, field, value) => {
    const updatedTemplates = [...gradingSettings.feedback_templates];
    updatedTemplates[index] = {
      ...updatedTemplates[index],
      [field]: field === 'template' ? value : parseFloat(value)
    };
    
    setGradingSettings({
      ...gradingSettings,
      feedback_templates: updatedTemplates
    });
  };

  const addFeedbackTemplate = () => {
    // Find the highest max score
    const maxScore = Math.max(...gradingSettings.feedback_templates.map(t => t.max_score));
    
    setGradingSettings({
      ...gradingSettings,
      feedback_templates: [
        ...gradingSettings.feedback_templates,
        { min_score: maxScore, max_score: 100, template: 'Excellent performance!' }
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

  // Calculate total weight
  const totalWeight = gradingSettings.question_weights.reduce((total, qw) => total + qw.weight, 0);

  // Function to get question text by index to display in the weight table
  const getQuestionTextByIndex = (index) => {
    const question = questions[index];
    if (!question) return `Question ${index + 1}`;
    
    // Truncate long question text
    const text = question.question_text || '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  };

  // Format the question type for display
  const formatQuestionType = (type) => {
    if (!type) return 'Multiple Choice';
    
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'multiple_answer': return 'Multiple Answer';
      case 'true_false': return 'True/False';
      case 'identification': return 'Identification';
      case 'matching': return 'Matching';
      case 'essay': return 'Essay/Short Answer';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>Quiz Grading Settings</h2>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        padding: '15px'
      }}>
        <div style={{
          background: 'linear-gradient(to right, #4b6cb7, #182848)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px 8px 0 0',
          margin: '-15px -15px 15px -15px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <BarChart2 size={20} style={{ marginRight: '10px' }} />
          <h3 style={{ margin: 0 }}>Grading Configuration</h3>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Grading Type</label>
          <div style={{
            display: 'flex',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                id="standard-grading"
                name="grading_type"
                value="standard"
                checked={gradingSettings.grading_type === 'standard'}
                onChange={handleGradingTypeChange}
              />
              <label htmlFor="standard-grading">Standard (equal weight)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                id="weighted-grading"
                name="grading_type"
                value="weighted"
                checked={gradingSettings.grading_type === 'weighted'}
                onChange={handleGradingTypeChange}
              />
              <label htmlFor="weighted-grading">Weighted (custom weights)</label>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Passing Score (%)</label>
          <input
            type="number"
            value={gradingSettings.passing_score}
            onChange={handlePassingScoreChange}
            min="0"
            max="100"
            style={{
              width: '100px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              id="auto-feedback"
              checked={gradingSettings.auto_feedback}
              onChange={handleAutoFeedbackChange}
            />
            <label htmlFor="auto-feedback">Generate automated feedback based on score</label>
          </div>
        </div>

        {gradingSettings.grading_type === 'weighted' && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Question Weights</h4>
            
            {totalWeight !== 100 && (
              <div style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>Warning:</strong> Total weight is {totalWeight}%. For best results, the sum of all weights should equal 100%.
                </div>
              </div>
            )}
            
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse' 
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f8f9fa', 
                    position: 'sticky', 
                    top: 0 
                  }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Question</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd', width: '120px' }}>Weight (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {gradingSettings.question_weights.map((weight, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{getQuestionTextByIndex(index)}</td>
                      <td style={{ padding: '10px' }}>{formatQuestionType(questions[index]?.question_type)}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={weight.weight}
                          onChange={(e) => handleQuestionWeightChange(index, e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                          style={{
                            width: '70px',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {gradingSettings.auto_feedback && (
          <div>
            <h4 style={{ marginBottom: '10px' }}>Feedback Templates</h4>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              Configure feedback messages based on score ranges. These templates will be used to generate automated feedback for quiz attempts.
            </p>
            
            {gradingSettings.feedback_templates.map((template, index) => (
              <div 
                key={index} 
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontWeight: 'bold' }}>
                    Score Range {index + 1}
                  </div>
                  
                  {gradingSettings.feedback_templates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeedbackTemplate(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#dc3545'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Min Score (%)
                    </label>
                    <input
                      type="number"
                      value={template.min_score}
                      onChange={(e) => handleTemplateChange(index, 'min_score', e.target.value)}
                      min="0"
                      max="100"
                      style={{
                        width: '80px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  
                  <div style={{ padding: '0 5px', marginTop: '20px' }}>to</div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Max Score (%)
                    </label>
                    <input
                      type="number"
                      value={template.max_score}
                      onChange={(e) => handleTemplateChange(index, 'max_score', e.target.value)}
                      min="0"
                      max="100"
                      style={{
                        width: '80px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Feedback Template
                  </label>
                  <textarea
                    value={template.template}
                    onChange={(e) => handleTemplateChange(index, 'template', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      minHeight: '80px'
                    }}
                    placeholder="Enter feedback message for this score range"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addFeedbackTemplate}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 0'
              }}
            >
              <PlusCircle size={16} /> Add Score Range
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGradingSettings;