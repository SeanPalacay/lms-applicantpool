import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  PlusCircle, Clipboard, Edit2, Trash2, 
  Eye, Award, BarChart2, 
  Grid, List // Added these icons for the toggle
} from 'lucide-react';
import trainerService from '../../../services/trainerService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const TrainerPracticalExams = () => {
  const navigate = useNavigate();
  const { programId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programName, setProgramName] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // Add view mode state

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        
        // If we have a programId, fetch program details for the title
        if (programId) {
          try {
            const programData = await trainerService.getProgramById(programId);
            setProgramName(programData.title || 'Program');
          } catch (err) {
            console.error('Error fetching program details:', err);
          }
        }
        
        // Fetch all practical exams for this program, or all if no programId
        const examsData = await trainerService.getPracticalExams(programId);
        setExams(examsData);
        
      } catch (err) {
        console.error('Error fetching practical exams:', err);
        setError('Failed to load practical exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [programId]);

  // Toggle view mode function
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'table' : 'grid');
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this practical exam?')) {
      return;
    }
    
    try {
      await trainerService.deletePracticalExam(examId);
      
      // Update the UI by removing the deleted exam
      setExams(exams.filter(exam => exam.id !== examId));
      setSuccess('Practical exam deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error deleting practical exam:', err);
      setError('Failed to delete practical exam. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
          {programId ? `Practical Exams for ${programName}` : 'All Practical Exams'}
        </h1>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#007bff' }}></div>
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {programId && (
            <Link 
              to={`/trainer/programs/${programId}`} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                color: '#333', 
                textDecoration: 'none' 
              }}
            >
              ← Back to Program
            </Link>
          )}
          
          {/* Add view mode toggle button */}
          <button 
            onClick={toggleViewMode}
            style={{
              padding: '8px 15px',
              background: '#f8f9fa',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginLeft: programId ? '10px' : '0'
            }}
            title={viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            <span>{viewMode === 'grid' ? 'Table View' : 'Grid View'}</span>
          </button>
        </div>
        
        <Link 
          to={programId ? `/trainer/practical-exams/create?programId=${programId}` : '/trainer/practical-exams/create'} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '8px 15px', 
            borderRadius: '4px', 
            textDecoration: 'none' 
          }}
        >
          <PlusCircle size={18} />
          <span>Create Practical Exam</span>
        </Link>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {exams.length > 0 ? (
          viewMode === 'grid' ? (
            // Grid View
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {exams.map(exam => (
                <div key={exam.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>{exam.title}</h3>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link 
                        to={`/trainer/practical-exams/${exam.id}/grade`}
                        style={{ color: '#007bff', textDecoration: 'none' }}
                        title="Grade submissions"
                      >
                        <Award size={20} />
                      </Link>
                      <Link 
                        to={`/trainer/practical-exams/${exam.id}`}
                        style={{ color: '#333', textDecoration: 'none' }}
                        title="View details"
                      >
                        <Eye size={20} />
                      </Link>
                      <Link 
                        to={`/trainer/practical-exams/${exam.id}/edit`}
                        style={{ color: '#666', textDecoration: 'none' }}
                        title="Edit"
                      >
                        <Edit2 size={20} />
                      </Link>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          color: '#dc3545', 
                          padding: '0' 
                        }}
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666', 
                    marginBottom: '15px',
                    minHeight: '40px' 
                  }}>
                    {exam.description || 'No description provided.'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clipboard size={18} color="#666" />
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                            {exam.program_title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>Program</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BarChart2 size={18} color="#666" />
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                            {exam.max_score || 100}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>Max Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/trainer/practical-exams/${exam.id}/grade`} 
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: '#e6f0ff', 
                      color: '#007bff', 
                      textDecoration: 'none' 
                    }}
                  >
                    Grade Submissions
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            // Table View
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                textAlign: 'left',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Program</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Max Score</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Submissions</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Avg. Score</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => (
                    <tr key={exam.id} style={{ 
                      borderBottom: '1px solid #dee2e6' 
                    }}>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ fontWeight: '600' }}>{exam.title}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {exam.description && exam.description.length > 60 
                            ? `${exam.description.substring(0, 60)}...` 
                            : exam.description || 'No description'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>{exam.program_title}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>{exam.max_score || 100}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>{exam.attempt_count || 0}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        {exam.average_score ? parseFloat(exam.average_score).toFixed(1) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <Link 
                            to={`/trainer/practical-exams/${exam.id}/grade`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                            title="Grade submissions"
                          >
                            <Award size={18} />
                          </Link>
                          <Link 
                            to={`/trainer/practical-exams/${exam.id}`}
                            style={{ color: '#333', textDecoration: 'none' }}
                            title="View details"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link 
                            to={`/trainer/practical-exams/${exam.id}/edit`}
                            style={{ color: '#666', textDecoration: 'none' }}
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: '#dc3545', 
                              padding: '0' 
                            }}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            <Clipboard size={48} style={{ marginBottom: '15px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
              No Practical Exams Found
            </h3>

            <p>
              {programId 
                ? 'No practical exams have been created for this program yet.'
                : 'No practical exams have been created yet.'}
            </p>
            <Link 
              to={programId ? `/trainer/practical-exams/create?programId=${programId}` : '/trainer/practical-exams/create'} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                padding: '8px 15px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                marginTop: '15px'
              }}
            >
              <PlusCircle size={18} />
              <span>Create Practical Exam</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerPracticalExams;