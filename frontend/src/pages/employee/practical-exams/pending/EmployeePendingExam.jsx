import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, FileText, Calendar,
  AlertCircle, BookOpen, BarChart2 
} from 'lucide-react';
import traineeService from '../../../../services/traineeService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const TraineePendingExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
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
        
        // Fetch attempt details
        const attemptsData = await traineeService.getPracticalExamAttempts(examId);
        
        if (!attemptsData || attemptsData.length === 0) {
          // If no attempt found, redirect to the exam page
          navigate(`/trainee/practical-exams/${examId}`);
          return;
        }
        
        const latestAttempt = attemptsData[0]; // Assuming the latest attempt is first
        
        if (latestAttempt.graded_at) {
          // If already graded, redirect to the results page
          navigate(`/trainee/practical-exams/${examId}/results/${latestAttempt.id}`);
          return;
        }
        
        setAttempt(latestAttempt);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load submission details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam || !attempt) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Submission Not Found</h2>
        <p>The practical exam submission you are looking for does not exist or you don't have permission to view it.</p>
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
              Pending Submission: {exam.title}
            </h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Program: {exam.program_title}
            </div>
          </div>
        </div>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#ffc107', marginTop: '5px', marginLeft: '52px' }}></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Clock size={24} color="#856404" />
        <div>
          <div style={{ fontWeight: '600', color: '#856404', marginBottom: '4px' }}>
            Submission Pending Review
          </div>
          <div style={{ fontSize: '14px', color: '#856404' }}>
            Your submission is currently awaiting grading by your trainer. You'll be notified when feedback is available.
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
          
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              What's Next?
            </h2>
            <p style={{ color: '#555', marginBottom: '15px' }}>
              After your trainer reviews your submission, you'll receive a notification. Your feedback and score will be available on this page.
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
                Review time may vary depending on trainer availability. Thank you for your patience.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineePendingExam;