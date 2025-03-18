import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Flag, ArrowLeft, Calendar, Book, Clock, 
  CheckCircle, XCircle, AlertTriangle, FileText,
  BookOpen, Award
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import traineeService from '../../../services/traineeService';

const TraineeMilestoneDetails = () => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    const fetchMilestoneData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainee') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }

        const milestoneData = await traineeService.getMilestoneDetails(milestoneId);
        setMilestone(milestoneData);
      } catch (err) {
        console.error('Error fetching milestone data:', err);
        setError('Failed to load milestone details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMilestoneData();
  }, [milestoneId, navigate]);

  const handleUpdateStatus = async (newStatus) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      // Check if we're updating an existing progress or creating a new one
      const progressId = milestone.progress?.id;
      await traineeService.updateMilestoneProgress(progressId || milestoneId, newStatus);
      
      // Update the local state to reflect the change
      setMilestone(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          id: progressId, // Keep the same ID if it exists
          status: newStatus,
          completion_date: newStatus === 'completed' ? new Date().toISOString() : null
        }
      }));
    } catch (err) {
      console.error('Error updating milestone status:', err);
      setError('Failed to update milestone status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return '#64748b';
      case 'in_progress': return '#f39c12';
      case 'completed': return '#2ecc71';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertBanner message={error} type="error" />;
  if (!milestone) return <AlertBanner message="Milestone not found" type="error" />;

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/trainee/milestones"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1E88E5',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.color = '#1565C0')}
          onMouseOut={(e) => (e.target.style.color = '#1E88E5')}
        >
          <ArrowLeft size={18} />
          <span>Back to Milestones</span>
        </Link>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1E88E5, #1565C0)',
            borderRadius: '8px',
            padding: '12px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flag size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
              {milestone.title}
            </h2>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Book size={16} />
                {milestone.program?.title || 'Program'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={16} />
                Due {formatDate(milestone.due_date)}
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: getStatusColor(milestone.progress?.status || 'not_started'),
                fontWeight: 500
              }}>
                {milestone.progress?.status === 'completed' ? (
                  <CheckCircle size={16} />
                ) : milestone.progress?.status === 'in_progress' ? (
                  <Clock size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                {getStatusLabel(milestone.progress?.status || 'not_started')}
              </span>
            </div>
          </div>
          
          {/* Action buttons for trainee to update milestone status */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {milestone.progress?.status !== 'completed' && (
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: updating ? '#cbd5e1' : '#dcfce7',
                  border: 'none',
                  color: updating ? '#64748b' : '#16a34a',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseOver={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#16a34a';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseOut={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#dcfce7';
                    e.target.style.color = '#16a34a';
                  }
                }}
              >
                <CheckCircle size={18} />
                <span>Mark as Completed</span>
              </button>
            )}
            
            {milestone.progress?.status !== 'in_progress' && milestone.progress?.status !== 'completed' && (
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: updating ? '#cbd5e1' : '#fef3c7',
                  border: 'none',
                  color: updating ? '#64748b' : '#d97706',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseOver={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#d97706';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseOut={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#fef3c7';
                    e.target.style.color = '#d97706';
                  }
                }}
              >
                <Clock size={18} />
                <span>Mark as In Progress</span>
              </button>
            )}
            
            {(milestone.progress?.status === 'in_progress' || milestone.progress?.status === 'completed') && (
              <button
                onClick={() => handleUpdateStatus('not_started')}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: updating ? '#cbd5e1' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: updating ? '#94a3b8' : '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseOver={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseOut={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <XCircle size={18} />
                <span>Reset Status</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3498db, #2980b9)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ color: '#ffffff' }}>
              <FileText size={20} />
            </div>
            <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Description</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {milestone.description ? (
              <p style={{ fontSize: '14px', color: '#1e293b', margin: 0 }}>
                {milestone.description}
              </p>
            ) : (
              <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                No description provided
              </p>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2ec4b6, #27a69a)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ color: '#ffffff' }}>
              <BookOpen size={20} />
            </div>
            <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Learning Resources</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {milestone.resources && milestone.resources.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {milestone.resources.map((resource, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#E3F2FD')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #1E88E5, #1565C0)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BookOpen size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#1E88E5',
                          textDecoration: 'none',
                          transition: 'color 0.3s ease',
                        }}
                        onMouseOver={(e) => (e.target.style.color = '#1565C0')}
                        onMouseOut={(e) => (e.target.style.color = '#1E88E5')}
                      >
                        {resource.title}
                      </a>
                      {resource.description && (
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: '4px 0 0 0',
                        }}>
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '24px',
                color: '#64748b',
              }}>
                <BookOpen size={24} />
                <p style={{ fontSize: '14px', margin: 0 }}>No learning resources available for this milestone</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional section for related quizzes if any */}
      {milestone.quizzes && milestone.quizzes.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginTop: '24px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ color: '#ffffff' }}>
              <Award size={20} />
            </div>
            <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Related Assessments</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {milestone.quizzes.map((quiz) => (
                <div key={quiz.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#E3F2FD')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Award size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/trainee/assessments/quiz/${quiz.id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1E88E5',
                        textDecoration: 'none',
                        transition: 'color 0.3s ease',
                      }}
                      onMouseOver={(e) => (e.target.style.color = '#1565C0')}
                      onMouseOut={(e) => (e.target.style.color = '#1E88E5')}
                    >
                      {quiz.title}
                    </Link>
                    {quiz.description && (
                      <p style={{
                        fontSize: '12px',
                        color: '#64748b',
                        margin: '4px 0 0 0',
                      }}>
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/trainee/assessments/quiz/${quiz.id}`}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#E3F2FD',
                        color: '#1E88E5',
                        fontSize: '14px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#1E88E5';
                        e.target.style.color = '#ffffff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#E3F2FD';
                        e.target.style.color = '#1E88E5';
                      }}
                    >
                      Take Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeMilestoneDetails;