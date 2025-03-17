import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RotateCw, Clock, AlertTriangle, ArrowLeft, Edit, Trash2, Users, Calendar, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/RefresherCourseDetail.css';

const RefresherCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
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
        
        const courseData = await trainerService.getRefresherCourseDetails(courseId);
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, navigate]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    
    try {
      await trainerService.deleteRefresherCourse(courseId);
      // Redirect to courses list on successful deletion
      navigate('/trainer/refresher-courses', { 
        state: { message: 'Refresher course deleted successfully.' } 
      });
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. ' + (err.message || 'Please try again later.'));
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!course) {
    return <AlertBanner message="Refresher course not found" type="error" />;
  }

  return (
    <div className="refresher-course-detail-container">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <Trash2 size={24} />
              <h3>Delete Refresher Course</h3>
            </div>
            <div className="delete-modal-content">
              <p>Are you sure you want to delete the refresher course <strong>"{course.title}"</strong>?</p>
              <p className="warning-text">
                <AlertTriangle size={16} />
                This action cannot be undone.
              </p>
              {course.enrollments && course.enrollments.length > 0 && (
                <p className="error-text">
                  <AlertTriangle size={16} />
                  This course has {course.enrollments.length} enrolled trainees. Deleting it will remove their access.
                </p>
              )}
            </div>
            <div className="delete-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Clock size={16} className="icon-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back navigation */}
      <div className="back-navigation">
        <Link to="/trainer/refresher-courses" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Refresher Courses</span>
        </Link>
      </div>
      
      {/* Course Header */}
      <div className="course-header-card">
        <div className="course-header">
          <div className="course-icon">
            <RotateCw size={24} />
          </div>
          <div className="course-title-container">
            <h2>{course.title}</h2>
            <div className="course-meta">
              <span className="course-created">
                <Calendar size={16} />
                Created: {new Date(course.created_at).toLocaleDateString()}
              </span>
              <span className="course-status">
                <CheckCircle size={16} />
                Status: {course.status}
              </span>
            </div>
          </div>
          <div className="course-actions">
            <button className="btn-edit" onClick={() => navigate(`/trainer/refresher-courses/edit/${course.id}`)}>
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button className="btn-delete" onClick={handleDeleteClick}>
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Course description */}
      <div className="course-description-card">
        <h3>Description</h3>
        <p>{course.description || 'No description provided.'}</p>
      </div>
      
      {/* Enrollment stats */}
      <div className="enrollment-stats-card">
        <h3>Enrollment Statistics</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{course.stats?.total_enrollments || 0}</div>
            <div className="stat-label">Total Enrollments</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{course.stats?.completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{course.stats?.in_progress || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{course.stats?.completion_rate || 0}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>
      
      {/* Enrolled Trainees */}
      <div className="enrolled-trainees-card">
        <div className="card-header">
          <h3>Enrolled Trainees</h3>
          <button className="btn-enroll" onClick={() => navigate(`/trainer/refresher-enrollment?courseId=${course.id}`)}>
            <Users size={18} />
            <span>Enroll Trainees</span>
          </button>
        </div>
        
        {course.enrollments && course.enrollments.length > 0 ? (
          <div className="trainees-table">
            <div className="table-header">
              <div className="name-col">Name</div>
              <div className="email-col">Email</div>
              <div className="status-col">Status</div>
              <div className="progress-col">Progress</div>
              <div className="date-col">Enrollment Date</div>
            </div>
            <div className="table-body">
              {course.enrollments.map(enrollment => (
                <div className="table-row" key={enrollment.id}>
                  <div className="name-col">{enrollment.full_name}</div>
                  <div className="email-col">{enrollment.email}</div>
                  <div className="status-col">
                    <span className={`status-badge status-${enrollment.completion_status}`}>
                      {enrollment.completion_status === 'completed' && <CheckCircle size={14} />}
                      {enrollment.completion_status === 'in_progress' && <Clock size={14} />}
                      {enrollment.completion_status === 'not_started' && <AlertTriangle size={14} />}
                      <span>{enrollment.completion_status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <div className="progress-col">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${enrollment.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span>{enrollment.completion_percentage || 0}%</span>
                  </div>
                  <div className="date-col">
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-trainees-message">
            <Users size={48} />
            <p>No trainees enrolled in this course yet</p>
            <button className="btn-enroll-large" onClick={() => navigate(`/trainer/refresher-enrollment?courseId=${course.id}`)}>
              <Users size={18} />
              <span>Enroll Trainees</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefresherCourseDetail;