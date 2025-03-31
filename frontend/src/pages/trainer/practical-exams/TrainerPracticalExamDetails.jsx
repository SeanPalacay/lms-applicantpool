import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Award, Trash2, Clipboard, 
  BarChart2, Users, Calendar 
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const TrainerPracticalExamDetails = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching exam details for ID:', examId);
        const examData = await trainerService.getPracticalExamById(examId);
        console.log('Exam data received:', examData);
        setExam(examData);
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError('Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this practical exam?')) {
      return;
    }
    
    try {
      await trainerService.deletePracticalExam(examId);
      setSuccess('Practical exam deleted successfully');
      
      // Navigate back after 2 seconds
      setTimeout(() => navigate('/trainer/practical-exams'), 2000);
    } catch (err) {
      console.error('Error deleting practical exam:', err);
      setError('Failed to delete practical exam. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
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
          onClick={() => navigate('/trainer/practical-exams')}
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
              onClick={() => navigate('/trainer/practical-exams')}
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
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to={`/trainer/practical-exams/${examId}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </Link>
            <Link
              to={`/trainer/practical-exams/${examId}/grade`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              <Award size={16} />
              <span>Grade</span>
            </Link>
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 15px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
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
              Exam Information
            </h2>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Description:</div>
              <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', minHeight: '50px' }}>
                {exam.description || 'No description provided.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Maximum Score:</div>
                <div style={{ fontWeight: '500' }}>{exam.max_score}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Created:</div>
                <div>{formatDate(exam.created_at)}</div>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px' }}>
              Grading Instructions
            </h2>
            <p>
              When grading this practical exam, trainers should consider the following criteria:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Correctness of approach and implementation</li>
              <li>Efficiency of solution</li>
              <li>Clarity and organization</li>
              <li>Completeness of submission</li>
            </ul>
            <p>
              Provide detailed feedback to help trainees understand their strengths and areas for improvement.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link
                to={`/trainer/practical-exams/${examId}/grade`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                <Award size={18} />
                <span>Grade Submissions</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={20} />
              <span>Statistics</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                  {exam.stats?.total_attempts || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Submissions</div>
              </div>
              <div style={{ borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                  {exam.stats?.average_score ? Number(exam.stats.average_score).toFixed(1) : 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Average Score</div>
              </div>
              <div style={{ borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                  {exam.stats?.min_score !== null ? Number(exam.stats.min_score).toFixed(1) : 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Lowest Score</div>
              </div>
              <div style={{ borderRadius: '8px', padding: '15px', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                  {exam.stats?.max_score !== null ? Number(exam.stats.max_score).toFixed(1) : 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Highest Score</div>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: '0', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clipboard size={20} />
              <span>Quick Links</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to={`/trainer/practical-exams/${examId}/grade`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 15px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                <Award size={18} color="#007bff" />
                <div>
                  <div style={{ fontWeight: '500' }}>Grade Submissions</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Review and grade trainee submissions</div>
                </div>
              </Link>
              <Link
                to={`/trainer/practical-exams/${examId}/edit`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 15px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                <Edit2 size={18} color="#6c757d" />
                <div>
                  <div style={{ fontWeight: '500' }}>Edit Exam</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Modify exam details</div>
                </div>
              </Link>
              <Link
                to={`/trainer/programs/${exam.program_id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 15px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                <Clipboard size={18} color="#28a745" />
                <div>
                  <div style={{ fontWeight: '500' }}>View Program</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>See program details</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerPracticalExamDetails;