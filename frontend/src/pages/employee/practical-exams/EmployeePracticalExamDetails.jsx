import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Send, Save, BookOpen, BarChart2, 
  AlertCircle, HelpCircle, Info 
} from 'lucide-react';
import traineeService from '../../../services/traineeService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const TraineePracticalExamDetails = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching exam details for ID:', examId);
        const examData = await traineeService.getPracticalExamById(examId);
        console.log('Exam data received:', examData);
        
        // Check if the trainee has already attempted this exam
        const attemptsData = await traineeService.getPracticalExamAttempts(examId);
        
        if (attemptsData && attemptsData.length > 0) {
          // Redirect to the appropriate page based on attempt status
          const attempt = attemptsData[0]; // Most recent attempt
          
          if (attempt.graded_at) {
            // Redirect to results page
            navigate(`/trainee/practical-exams/${examId}/results/${attempt.id}`);
            return;
          } else {
            // Redirect to pending page
            navigate(`/trainee/practical-exams/${examId}/pending`);
            return;
          }
        }
        
        setExam(examData);
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError('Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId, navigate]);

  // Update character count when submission changes
  useEffect(() => {
    setCharCount(submission.length);
  }, [submission]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (submission.trim() && !submitting) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [submission, submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submission.trim()) {
      setError('Please provide a submission before submitting.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await traineeService.submitPracticalExam(examId, submission);
      
      setSuccess('Exam submitted successfully!');
      
      // Redirect to pending page after 2 seconds
      setTimeout(() => {
        navigate(`/trainee/practical-exams/${examId}/pending`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting practical exam:', err);
      setError(err.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save to local storage
    localStorage.setItem(`practicalExamDraft_${examId}`, submission);
    setSuccess('Draft saved!');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };
  
  const handleAutoSave = () => {
    // Show auto-saving indicator
    setIsAutoSaving(true);
    
    // Save to local storage
    localStorage.setItem(`practicalExamDraft_${examId}`, submission);
    
    // Hide auto-saving indicator after 2 seconds
    setTimeout(() => setIsAutoSaving(false), 2000);
  };
  
  // Load draft from local storage when component mounts
  useEffect(() => {
    const savedDraft = localStorage.getItem(`practicalExamDraft_${examId}`);
    if (savedDraft) {
      setSubmission(savedDraft);
    }
  }, [examId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Exam Not Found</h2>
        <p>The practical exam you are looking for does not exist or you don't have permission to access it.</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {exam.title}
              </h1>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Program: {exam.program_title}
              </div>
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
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              Exam Description
            </h2>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                {exam.description || 'No description provided.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Maximum Score:</div>
                <div style={{ fontWeight: '500' }}>{exam.max_score}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Program:</div>
                <div>{exam.program_title}</div>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} />
              <span>Your Submission</span>
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="submission" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Enter your submission:
                </label>
                <textarea
                  id="submission"
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
              
              {/* Character Count and Auto-save Indicator */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '15px',
                fontSize: '14px',
                color: '#666'
              }}>
                <div>Characters: {charCount}</div>
                {isAutoSaving && (
                  <div style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Auto-saving...</span>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '10px 15px',
                    backgroundColor: 'white',
                    color: '#6c757d',
                    border: '1px solid #6c757d',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Save size={18} />
                  <span>Save Draft</span>
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  <Send size={18} />
                  <span>{submitting ? 'Submitting...' : 'Submit Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} />
              <span>Submission Guidelines</span>
            </h2>
            <ul style={{ paddingLeft: '20px', color: '#555' }}>
              <li style={{ marginBottom: '8px' }}>Read the exam description carefully before beginning.</li>
              <li style={{ marginBottom: '8px' }}>Your submission should be clear, concise, and well-structured.</li>
              <li style={{ marginBottom: '8px' }}>If the exam requires code, ensure it's properly formatted and commented.</li>
              <li style={{ marginBottom: '8px' }}>You can save your work as a draft at any time.</li>
              <li style={{ marginBottom: '8px' }}>Once submitted, you cannot edit your answers.</li>
              <li style={{ marginBottom: '8px' }}>Your submission will be graded by a trainer.</li>
            </ul>
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={18} />
              <span>Need Help?</span>
            </h2>
            <p style={{ color: '#555', marginBottom: '15px' }}>
              If you have questions about this practical exam, please contact your trainer for clarification.
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
                Your work is automatically saved as you type, but we recommend using the "Save Draft" button regularly.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineePracticalExamDetails;