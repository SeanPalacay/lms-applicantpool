import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Send, Calendar,
  AlertCircle, BookOpen, BarChart2 
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const TraineeTakeExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch exam details
        const examData = await traineeService.getPracticalExamById(examId);
        setExam(examData);
        
        // Check if there are any existing attempts
        const attemptsData = await traineeService.getPracticalExamAttempts(examId);
        
        if (attemptsData && attemptsData.length > 0) {
          const latestAttempt = attemptsData[0]; // Assuming the latest attempt is first
          
          if (latestAttempt.graded_at) {
            // If already graded, redirect to the results page
            navigate(`/trainee/practical-exams/${examId}/results/${latestAttempt.id}`);
            return;
          } else {
            // If submitted but not graded, redirect to the pending page
            navigate(`/trainee/practical-exams/${examId}/pending`);
            return;
          }
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submissionText.trim()) {
      setError('Please enter your answer before submitting.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit the exam
      await traineeService.submitPracticalExam(examId, submissionText);
      
      // Redirect to the pending page
      navigate(`/trainee/practical-exams/${examId}/pending`);
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit your answer. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Exam Not Found</h2>
        <p>The practical exam you are looking for does not exist or you don't have permission to view it.</p>
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
              Take Exam: {exam.title}
            </h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Program: {exam.program_title}
            </div>
          </div>
        </div>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#007bff', marginTop: '5px', marginLeft: '52px' }}></div>
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
          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
                Your Answer
              </h2>
              
              <textarea
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                placeholder="Enter your answer here..."
                style={{ 
                  width: '100%',
                  minHeight: '300px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                required
              />
              
              <button 
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </form>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              Exam Description
            </h2>
            <div style={{ 
              padding: '15px', 
              border: '1px solid #eee', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              {exam.description || 'No description provided.'}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="#666" />
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Maximum Score:</div>
                  <div style={{ fontWeight: '500' }}>{exam.max_score}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#e2f0fd', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              Instructions
            </h2>
            <ul style={{ 
              color: '#0056b3', 
              paddingLeft: '20px',
              margin: '0'
            }}>
              <li style={{ marginBottom: '8px' }}>
                Read the exam description carefully before answering.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your answer will be reviewed by a trainer.
              </li>
              <li style={{ marginBottom: '8px' }}>
                You can only submit once, so double-check your work.
              </li>
              <li>
                After submission, you'll be able to see your answer but not edit it.
              </li>
            </ul>
            
            <div style={{ 
              marginTop: '15px',
              padding: '10px', 
              borderRadius: '4px', 
              backgroundColor: 'rgba(0, 86, 179, 0.1)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <AlertCircle size={18} color="#0056b3" />
              <span style={{ color: '#0056b3', fontSize: '14px' }}>
                Your work will be evaluated based on completeness, accuracy, and detail.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeTakeExam;