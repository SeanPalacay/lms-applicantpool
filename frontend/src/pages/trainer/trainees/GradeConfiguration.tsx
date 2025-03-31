import React, { useState, useEffect, JSX } from 'react';
import { Sliders, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import trainerService from '../../../services/trainerService';

// Define interfaces for props and state
interface GradeConfigType {
  quiz_weight: number;
  practical_exam_weight: number;
  passing_grade: number;
}

const GradeConfiguration: React.FC = () => {
  const [config, setConfig] = useState<GradeConfigType>({
    quiz_weight: 0.6,
    practical_exam_weight: 0.4,
    passing_grade: 70
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    const fetchGradeConfig = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await trainerService.getGradeConfiguration();
        
        if (response.success) {
          setConfig({
            quiz_weight: parseFloat(response.config.quiz_weight),
            practical_exam_weight: parseFloat(response.config.practical_exam_weight),
            passing_grade: parseFloat(response.config.passing_grade)
          });
        } else {
          setError(response.error || 'Failed to load grade configuration');
        }
      } catch (err) {
        console.error('Error fetching grade configuration:', err);
        setError('Could not load grade configuration. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGradeConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update the config state
    const updatedConfig = {
      ...config,
      [name]: parseFloat(value)
    };
    
    // If changing one weight, auto-adjust the other to maintain total of 1.0
    if (name === 'quiz_weight') {
      updatedConfig.practical_exam_weight = parseFloat((1 - parseFloat(value)).toFixed(2));
    } else if (name === 'practical_exam_weight') {
      updatedConfig.quiz_weight = parseFloat((1 - parseFloat(value)).toFixed(2));
    }
    
    setConfig(updatedConfig);
    setIsDirty(true);
  };

  const handleReset = () => {
    setConfig({
      quiz_weight: 0.6,
      practical_exam_weight: 0.4,
      passing_grade: 70
    });
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      const response = await trainerService.saveGradeConfiguration(config);
      
      if (response.success) {
        setSuccess('Grade configuration saved successfully');
        setIsDirty(false);
      } else {
        setError(response.error || 'Failed to save grade configuration');
      }
    } catch (err) {
      console.error('Error saving grade configuration:', err);
      setError('Could not save grade configuration. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    // Pass the string directly to LoadingSpinner
    return LoadingSpinner("Loading grade configuration...") as JSX.Element;
  }

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        <Sliders size={24} />
        <h2 style={{ margin: 0, fontSize: '24px' }}>Grade Configuration</h2>
      </div>
      
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Component Weights</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Set the weight for each assessment component. The total must equal 100%.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '25px'
          }}>
            <div>
              <label 
                htmlFor="quiz_weight" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}
              >
                <span>Quiz Weight</span>
                <span>{(config.quiz_weight * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                id="quiz_weight"
                name="quiz_weight"
                min="0"
                max="1"
                step="0.05"
                value={config.quiz_weight}
                onChange={handleInputChange}
                style={{ width: '100%' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label 
                htmlFor="practical_exam_weight" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontWeight: 'bold'
                }}
              >
                <span>Practical Exam Weight</span>
                <span>{(config.practical_exam_weight * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                id="practical_exam_weight"
                name="practical_exam_weight"
                min="0"
                max="1"
                step="0.05"
                value={config.practical_exam_weight}
                onChange={handleInputChange}
                style={{ width: '100%' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f8f9fa',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <span style={{ 
                fontWeight: 'bold', 
                color: Math.abs((config.quiz_weight + config.practical_exam_weight) - 1) > 0.01 ? '#dc3545' : '#28a745' 
              }}>
                Σ
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>Total: {((config.quiz_weight + config.practical_exam_weight) * 100).toFixed(0)}%</div>
              {Math.abs((config.quiz_weight + config.practical_exam_weight) - 1) > 0.01 && (
                <div style={{ color: '#dc3545', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                  <AlertTriangle size={14} />
                  <span>Total must equal 100%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Passing Grade</h3>
          
          <div>
            <label 
              htmlFor="passing_grade" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}
            >
              <span>Minimum Passing Grade</span>
              <span>{config.passing_grade.toFixed(0)}%</span>
            </label>
            <input
              type="range"
              id="passing_grade"
              name="passing_grade"
              min="50"
              max="95"
              step="5"
              value={config.passing_grade}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#666'
            }}>
              <span>50%</span>
              <span>75%</span>
              <span>95%</span>
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '15px',
          marginTop: '30px'
        }}>
          <button
            type="button"
            onClick={handleReset}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 20px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={16} />
            <span>Reset to Default</span>
          </button>
          
          <button
            type="submit"
            disabled={saving || !isDirty || Math.abs((config.quiz_weight + config.practical_exam_weight) - 1) > 0.01}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '10px 20px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: saving || !isDirty || Math.abs((config.quiz_weight + config.practical_exam_weight) - 1) > 0.01 ? 'not-allowed' : 'pointer',
              opacity: saving || !isDirty || Math.abs((config.quiz_weight + config.practical_exam_weight) - 1) > 0.01 ? 0.7 : 1
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeConfiguration;