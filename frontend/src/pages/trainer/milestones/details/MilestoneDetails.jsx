import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Flag, Edit, Trash2, ArrowLeft, Calendar, Book, Clock, 
  Users, CheckCircle, XCircle, AlertTriangle, User, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/MilestoneDetails.css';

/**
 * MilestoneDetails Component
 * Displays detailed information about a specific milestone
 */
const MilestoneDetails = () => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch milestone data on component mount
  useEffect(() => {
    const fetchMilestoneData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Check if user is logged in and has correct role
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
        
        // Fetch milestone details using service
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

  const handleEdit = () => {
    navigate(`/trainer/milestones/edit/${milestoneId}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await trainerService.deleteMilestone(milestoneId);
      
      // Redirect to milestones list
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
    switch(status) {
      case 'not_started': return 'status-not-started';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!milestone) {
    return <AlertBanner message="Milestone not found" type="error" />;
  }

  return (
    <div className="milestone-details-container">
      {/* Back navigation */}
      <div className="back-navigation">
        <Link to="/trainer/milestones" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Milestones</span>
        </Link>
      </div>
      
      {/* Header card */}
      <div className="card milestone-header-card">
        <div className="milestone-header">
          <div className="milestone-icon gradient-purple">
            <Flag size={24} />
          </div>
          <div className="milestone-title">
            <h2>{milestone.title}</h2>
            <div className="milestone-subtitle">
              <span className="milestone-program">
                <Book size={16} />
                {milestone.program?.title || 'Program'}
              </span>
              <span className="milestone-due-date">
                <Calendar size={16} />
                Due {formatDate(milestone.due_date)}
              </span>
            </div>
          </div>
          <div className="milestone-actions">
            <button onClick={handleEdit} className="btn-edit" title="Edit Milestone">
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button onClick={handleDeleteClick} className="btn-delete" title="Delete Milestone">
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>Confirm Deletion</h3>
            </div>
            <p>Are you sure you want to delete this milestone?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="delete-confirmation-actions">
              <button onClick={handleCancelDelete} className="btn-cancel" disabled={deleting}>
                <XCircle size={18} />
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="btn-confirm-delete" disabled={deleting}>
                {deleting ? (
                  <>
                    <Clock size={18} className="icon-spin" />
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
      
      {/* Main content */}
      <div className="milestone-details-grid">
        {/* Description Card */}
        <div className="card milestone-description-card">
          <div className="card-header gradient-indigo">
            <div className="header-icon">
              <FileText size={20} />
            </div>
            <div className="header-content">
              <h3>Description</h3>
            </div>
          </div>
          <div className="card-content">
            {milestone.description ? (
              <p className="milestone-description">{milestone.description}</p>
            ) : (
              <p className="milestone-no-description">No description provided</p>
            )}
          </div>
        </div>
        
        {/* Trainees Card */}
        <div className="card milestone-trainees-card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Users size={20} />
            </div>
            <div className="header-content">
              <h3>Assigned Trainees</h3>
            </div>
          </div>
          <div className="card-content">
            {milestone.trainees && milestone.trainees.length > 0 ? (
              <div className="trainees-list">
                {milestone.trainees.map((trainee) => (
                  <div key={trainee.id} className="trainee-item">
                    <div className="trainee-avatar">
                      <User size={20} />
                    </div>
                    <div className="trainee-info">
                      <Link to={`/trainer/trainees/${trainee.id}`} className="trainee-name">
                        {trainee.full_name}
                      </Link>
                      {trainee.progress && (
                        <div className={`trainee-status ${getStatusColor(trainee.progress.status)}`}>
                          {getStatusLabel(trainee.progress.status)}
                        </div>
                      )}
                    </div>
                    <div className="trainee-completion">
                      {trainee.progress && trainee.progress.status === 'completed' ? (
                        <div className="completion-badge">
                          <CheckCircle size={18} />
                          <span>
                            {trainee.progress.completion_date ? 
                              formatDate(trainee.progress.completion_date) : 'Completed'}
                          </span>
                        </div>
                      ) : (
                        <div className="status-badge">
                          {trainee.progress?.status === 'in_progress' ? (
                            <Clock size={18} />
                          ) : (
                            <AlertTriangle size={18} />
                          )}
                          <span>
                            {trainee.progress?.status === 'in_progress' ? 
                              'In Progress' : 'Not Started'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-trainees-message">
                <Users size={24} />
                <p>No trainees assigned to this milestone</p>
                <button onClick={handleEdit} className="btn-assign">
                  <Users size={16} />
                  Assign Trainees
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Summary Card */}
        <div className="card milestone-progress-card">
          <div className="card-header gradient-amber">
            <div className="header-icon">
              <Chart size={20} />
            </div>
            <div className="header-content">
              <h3>Progress Summary</h3>
            </div>
          </div>
          <div className="card-content">
            {milestone.trainees && milestone.trainees.length > 0 ? (
              <div className="progress-summary">
                <div className="progress-metrics">
                  <div className="progress-metric">
                    <div className="metric-value">
                      {milestone.trainees.length}
                    </div>
                    <div className="metric-label">
                      Total Assigned
                    </div>
                  </div>
                  
                  <div className="progress-metric">
                    <div className="metric-value">
                      {milestone.trainees.filter(t => 
                        t.progress && t.progress.status === 'completed').length}
                    </div>
                    <div className="metric-label">
                      Completed
                    </div>
                  </div>
                  
                  <div className="progress-metric">
                    <div className="metric-value">
                      {milestone.trainees.filter(t => 
                        t.progress && t.progress.status === 'in_progress').length}
                    </div>
                    <div className="metric-label">
                      In Progress
                    </div>
                  </div>
                  
                  <div className="progress-metric">
                    <div className="metric-value">
                      {milestone.trainees.filter(t => 
                        !t.progress || t.progress.status === 'not_started').length}
                    </div>
                    <div className="metric-label">
                      Not Started
                    </div>
                  </div>
                </div>
                
                <div className="progress-chart">
                  <div className="chart-title">Completion Rate</div>
                  <div className="chart-container">
                    <div className="chart-donut">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path 
                          className="circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path 
                          className="circle"
                          strokeDasharray={`${Math.round(
                            (milestone.trainees.filter(t => 
                              t.progress && t.progress.status === 'completed').length / 
                              milestone.trainees.length) * 100)}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">
                          {Math.round(
                            (milestone.trainees.filter(t => 
                              t.progress && t.progress.status === 'completed').length / 
                              milestone.trainees.length) * 100)}%
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-progress-data">
                <AlertTriangle size={24} />
                <p>No trainees assigned to track progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Adding Chart component since it was referenced but not imported
const Chart = ({ size, ...props }) => {
  return (
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
};

export default MilestoneDetails;