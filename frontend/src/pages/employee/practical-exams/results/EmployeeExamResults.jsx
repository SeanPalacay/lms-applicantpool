import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Award, FileText, Calendar,
  MessageSquare, BookOpen, BarChart2, AlertCircle
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const TraineeExamResults = () => {
  const navigate = useNavigate();
  const { examId, attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch exam details
        const examData = await traineeService.getPracticalExamById(examId);
        setExam(examData);
        
        // Fetch attempt details using specific attempt ID
        const attemptData = await traineeService.getPracticalExamAttemptById(attemptId);
        
        if (!attemptData || !attemptData.graded_at) {
          // If not yet graded, redirect to the pending page
          navigate(`/trainee/practical-exams/${examId}/pending`);
          return;
        }
        
        setAttempt(attemptData);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, attemptId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // Calculate score percentage
  const calculatePercentage = () => {
    if (!attempt || !exam) return 0;
    return Math.round((attempt.score / exam.max_score) * 100);
  };

  // Determine score color based on percentage
  const getScoreColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 80) return '#28a745'; // Green
    if (percentage >= 60) return '#17a2b8'; // Blue
    if (percentage >= 40) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam || !attempt) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Results Not Found</h2>
        <p>The practical exam results you are looking for do not exist or you don't have permission to view them.</p>
        <button 
          onClick={() => navigate('/trainee/practical-exams')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Practical Exams
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate('/trainee/practical-exams')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: '0' }}>
              Results: {exam.title}
            </h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Program: {exam.program_title}
            </div>
          </div>
        </div>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#28a745', marginTop: '5px', marginLeft: '52px' }}></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} />
              <span>Your Score</span>
            </h2>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: '700', 
                  color: getScoreColor(),
                  lineHeight: '1'
                }}>
                  {attempt.score}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  of {exam.max_score} points
                </div>
              </div>
              
              <div style={{ width: '1px', height: '60px', backgroundColor: '#dee2e6' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: '700', 
                  color: getScoreColor(),
                  lineHeight: '1'
                }}>
                  {calculatePercentage()}%
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Percentage
                </div>
              </div>
              
              <div style={{ width: '1px', height: '60px', backgroundColor: '#dee2e6' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '5px'
                }}>
                  Graded On
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {formatDate(attempt.graded_at)}
                </div>
              </div>
            </div>
            
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} />
              <span>Trainer Feedback</span>
            </h3>
            
            <div style={{ 
              padding: '15px', 
              border: '1px solid #eee', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              minHeight: '100px',
              marginBottom: '15px'
            }}>
              {attempt.feedback || 'No specific feedback provided.'}
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} />
              <span>Your Submission</span>
            </h2>
            
            <div style={{ 
              padding: '15px', 
              border: '1px solid #eee', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              minHeight: '200px'
            }}>
              {attempt.submission_text}
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} />
              <span>Submitted on: {formatDate(attempt.submitted_at)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              Exam Information
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <BookOpen size={18} color="#666" />
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Program:</div>
                  <div style={{ fontWeight: '500' }}>{exam.program_title}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <BarChart2 size={18} color="#666" />
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Maximum Score:</div>
                  <div style={{ fontWeight: '500' }}>{exam.max_score}</div>
                </div>
              </div>
            </div>
            
            <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#333', marginBottom: '10px' }}>Description:</h3>
            <div style={{ 
              padding: '10px', 
              border: '1px solid #eee', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
              fontSize: '14px'
            }}>
              {exam.description || 'No description provided.'}
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              What's Next?
            </h2>
            <p style={{ color: '#555', marginBottom: '15px' }}>
              Review your feedback carefully and use it to improve your skills. If you have questions about your score or feedback, contact your trainer.
            </p>
            <div style={{ 
              backgroundColor: '#e2f0fd', 
              borderRadius: '4px', 
              padding: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <AlertCircle size={18} color="#0056b3" />
              <span style={{ color: '#0056b3', fontSize: '14px' }}>
                Your performance on practical exams contributes to your overall program assessment.
              </span>
            </div>
            
            <Link 
              to="/trainee/practical-exams" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Practical Exams</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeExamResults;