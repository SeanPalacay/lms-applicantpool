import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Flag, Edit, Trash2, ArrowLeft, Calendar, Book, Clock, 
  Users, CheckCircle, XCircle, AlertTriangle, User, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const MilestoneDetails = () => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }

        const milestoneData = await trainerService.getMilestoneDetails(milestoneId);
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

  const handleEdit = () => navigate(`/trainer/milestones/edit/${milestoneId}`);
  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleCancelDelete = () => setShowDeleteConfirm(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await trainerService.deleteMilestone(milestoneId);
      navigate('/trainer/milestones');
    } catch (err) {
      console.error('Error deleting milestone:', err);
      setError('Failed to delete milestone. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
          to="/trainer/milestones"
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
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleEdit}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#E3F2FD',
                border: 'none',
                color: '#1E88E5',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeleteClick}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e74c3c',
                color: '#e74c3c',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                e.target.style.color = '#e74c3c';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#e74c3c';
              }}
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 800,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            width: '400px',
            maxWidth: '90%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle size={24} style={{ color: '#f39c12' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                Confirm Deletion
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}>
              Are you sure you want to delete this milestone?
            </p>
            <p style={{ fontSize: '12px', color: '#e74c3c', marginBottom: '16px' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => !deleting && (e.target.style.backgroundColor = '#f8fafc')}
                onMouseOut={(e) => !deleting && (e.target.style.backgroundColor = '#ffffff')}
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: deleting ? '#64748b' : '#e74c3c',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => !deleting && (e.target.style.backgroundColor = '#c0392b')}
                onMouseOut={(e) => !deleting && (e.target.style.backgroundColor = '#e74c3c')}
              >
                {deleting ? (
                  <>
                    <Clock size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Milestone
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <Users size={20} />
            </div>
            <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Assigned Trainees</h3>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            {milestone.trainees && milestone.trainees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {milestone.trainees.map((trainee) => (
                  <div key={trainee.id} style={{
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
                      <User size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link
                        to={`/trainer/trainees/${trainee.id}`}
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
                        {trainee.full_name}
                      </Link>
                      {trainee.progress && (
                        <div style={{
                          fontSize: '12px',
                          color: getStatusColor(trainee.progress.status),
                          marginTop: '4px',
                        }}>
                          {getStatusLabel(trainee.progress.status)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {trainee.progress && trainee.progress.status === 'completed' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#2ecc71',
                          fontSize: '12px',
                        }}>
                          <CheckCircle size={18} />
                          <span>{trainee.progress.completion_date ? formatDate(trainee.progress.completion_date) : 'Completed'}</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: trainee.progress?.status === 'in_progress' ? '#f39c12' : '#64748b',
                          fontSize: '12px',
                        }}>
                          {trainee.progress?.status === 'in_progress' ? <Clock size={18} /> : <AlertTriangle size={18} />}
                          <span>{trainee.progress?.status === 'in_progress' ? 'In Progress' : 'Not Started'}</span>
                        </div>
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
                <Users size={24} />
                <p style={{ fontSize: '14px', margin: 0 }}>No trainees assigned to this milestone</p>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#E3F2FD',
                    border: 'none',
                    color: '#1E88E5',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
                  <Users size={16} />
                  Assign Trainees
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chart = ({ size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

export default MilestoneDetails;