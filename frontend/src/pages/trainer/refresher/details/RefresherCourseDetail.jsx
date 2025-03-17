import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RotateCw, Clock, AlertTriangle, ArrowLeft, Edit, Trash2, Users, Calendar, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

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
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '24px', maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Delete Refresher Course</h3>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#1E293B', marginBottom: '8px' }}>
                Are you sure you want to delete the refresher course <strong>"{course.title}"</strong>?
              </p>
              <p style={{ fontSize: '14px', color: '#E53E3E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                This action cannot be undone.
              </p>
              {course.enrollments && course.enrollments.length > 0 && (
                <p style={{ fontSize: '14px', color: '#E53E3E', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <AlertTriangle size={16} />
                  This course has {course.enrollments.length} enrolled trainees. Deleting it will remove their access.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button 
                style={{ padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                style={{ padding: '8px 16px', backgroundColor: '#E53E3E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease', opacity: deleting ? 0.7 : 1 }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
      <div style={{ marginBottom: '24px' }}>
        <Link 
          to="/trainer/refresher-courses" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Refresher Courses</span>
        </Link>
      </div>
      
      {/* Course Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
            <RotateCw size={24} color="#1E88E5" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', margin: '0' }}>{course.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                <Calendar size={16} />
                Created: {new Date(course.created_at).toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                <CheckCircle size={16} />
                Status: {course.status}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#E3F2FD', color: '#1E88E5', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
              onClick={() => navigate(`/trainer/refresher-courses/edit/${course.id}`)}
            >
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#FEE2E2', color: '#E53E3E', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
              onClick={handleDeleteClick}
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Course description */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Description</h3>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>{course.description || 'No description provided.'}</p>
      </div>
      
      {/* Enrollment stats */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Enrollment Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>{course.stats?.total_enrollments || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Total Enrollments</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>{course.stats?.completed || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Completed</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>{course.stats?.in_progress || 0}</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>In Progress</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>{course.stats?.completion_rate || 0}%</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Completion Rate</div>
          </div>
        </div>
      </div>
      
      {/* Enrolled Trainees */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B' }}>Enrolled Trainees</h3>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
            onClick={() => navigate(`/trainer/refresher-enrollment?courseId=${course.id}`)}
          >
            <Users size={18} />
            <span>Enroll Trainees</span>
          </button>
        </div>
        
        {course.enrollments && course.enrollments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', padding: '8px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontWeight: '500', color: '#64748B' }}>
              <div>Name</div>
              <div>Email</div>
              <div>Status</div>
              <div>Progress</div>
              <div>Enrollment Date</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {course.enrollments.map(enrollment => (
                <div key={enrollment.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#1E293B' }}>{enrollment.full_name}</div>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>{enrollment.email}</div>
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1E293B' }}>
                      {enrollment.completion_status === 'completed' && <CheckCircle size={14} color="#2ECC71" />}
                      {enrollment.completion_status === 'in_progress' && <Clock size={14} color="#F39C12" />}
                      {enrollment.completion_status === 'not_started' && <AlertTriangle size={14} color="#E53E3E" />}
                      <span>{enrollment.completion_status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ height: '100%', backgroundColor: '#1E88E5', width: `${enrollment.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '14px', color: '#64748B' }}>{enrollment.completion_percentage || 0}%</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px', textAlign: 'center' }}>
            <Users size={48} color="#64748B" />
            <p style={{ fontSize: '16px', color: '#64748B' }}>No trainees enrolled in this course yet</p>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
              onClick={() => navigate(`/trainer/refresher-enrollment?courseId=${course.id}`)}
            >
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