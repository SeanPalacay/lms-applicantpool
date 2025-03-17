import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, RotateCw, Save, XCircle, Clock, Search, 
  AlertTriangle, UserCheck, Trash2, CheckCircle, Filter,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/RefresherEnrollment.css';

/**
 * RefresherEnrollment Component
 * Allows trainers to enroll trainees in refresher courses
 */
const RefresherEnrollment = () => {
  const navigate = useNavigate();
  const [refresherCourses, setRefresherCourses] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [enrollmentReason, setEnrollmentReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnrolled, setFilterEnrolled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [courseDetails, setCourseDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Fetch available courses and trainees on component mount
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch active refresher courses
        const coursesResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_courses.php?status=active`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!coursesResponse.ok) {
          if (coursesResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await coursesResponse.text();
          throw new Error(`HTTP error: ${coursesResponse.status} - ${errorText}`);
        }

        const coursesData = await coursesResponse.json();
        setRefresherCourses(coursesData);
        
        // Fetch all trainees
        const traineesResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/trainees.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!traineesResponse.ok) {
          if (traineesResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await traineesResponse.text();
          throw new Error(`HTTP error: ${traineesResponse.status} - ${errorText}`);
        }

        const traineesData = await traineesResponse.json();
        setTrainees(traineesData);
        
        // Fetch programs for filtering
        const programsResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!programsResponse.ok) {
          if (programsResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await programsResponse.text();
          throw new Error(`HTTP error: ${programsResponse.status} - ${errorText}`);
        }

        const programsData = await programsResponse.json();
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Fetch course details when a course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setCourseDetails(null);
      return;
    }
    
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_course_details.php?courseId=${selectedCourse}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await response.text();
          throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        setCourseDetails(data);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again.');
      }
    };

    fetchCourseDetails();
  }, [selectedCourse, API_BASE_URL]);

  // Handle course selection change
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedTrainees([]);
  };

  // Handle enrollment reason change
  const handleReasonChange = (e) => {
    setEnrollmentReason(e.target.value);
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle filter for already enrolled trainees
  const handleFilterEnrolledChange = (e) => {
    setFilterEnrolled(e.target.checked);
  };

  // Handle program filter change
  const handleProgramFilterChange = (e) => {
    setSelectedProgramFilter(e.target.value);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Toggle trainee selection
  const toggleTraineeSelection = (traineeId) => {
    if (selectedTrainees.includes(traineeId)) {
      setSelectedTrainees(selectedTrainees.filter(id => id !== traineeId));
    } else {
      setSelectedTrainees([...selectedTrainees, traineeId]);
    }
  };

  // Select all visible trainees
  const selectAllVisible = () => {
    const visibleTrainees = getFilteredTrainees().map(trainee => trainee.id);
    setSelectedTrainees(visibleTrainees);
  };

  // Clear all trainee selections
  const clearAllSelections = () => {
    setSelectedTrainees([]);
  };

  // Check if trainee is already enrolled in the selected course
  const isEnrolled = (traineeId) => {
    if (!courseDetails || !courseDetails.enrollments) {
      return false;
    }
    
    return courseDetails.enrollments.some(enrollment => 
      enrollment.user_id === traineeId
    );
  };

  // Filter trainees based on search, enrollment status, and program
  const getFilteredTrainees = () => {
    return trainees.filter(trainee => {
      // Search filter
      const searchMatch = trainee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trainee.email && trainee.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Enrollment filter
      const enrollmentMatch = !filterEnrolled || !isEnrolled(trainee.id);
      
      // Program filter
      let programMatch = true;
      if (selectedProgramFilter !== 'all') {
        programMatch = trainee.programs?.some(program => 
          program.id.toString() === selectedProgramFilter
        ) || false;
      }
      
      return searchMatch && enrollmentMatch && programMatch;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError('Please select a refresher course');
      return;
    }
    
    if (selectedTrainees.length === 0) {
      setError('Please select at least one trainee to enroll');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setSubmitting(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/enroll_trainees_refresher.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          traineeIds: selectedTrainees,
          reason: enrollmentReason
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll trainees');
      }
      
      const data = await response.json();
      setSuccessMessage(`Successfully enrolled ${data.stats?.newly_enrolled || selectedTrainees.length} trainees in the refresher course.`);
      
      // Reset form
      setSelectedTrainees([]);
      setEnrollmentReason('');
      
      // Refresh course details to update enrollment status
      const courseResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_course_details.php?courseId=${selectedCourse}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!courseResponse.ok) {
        throw new Error('Failed to refresh course details');
      }
      
      const courseData = await courseResponse.json();
      setCourseDetails(courseData);
    } catch (err) {
      console.error('Error enrolling trainees:', err);
      setError(err.message || 'Failed to enroll trainees. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/trainer/refresher-courses');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="refresher-enrollment-container">
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div className="card">
        <div className="card-header gradient-amber">
          <div className="header-icon">
            <Users size={20} />
          </div>
          <div className="header-content">
            <h3>Enroll Trainees in Refresher Course</h3>
          </div>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="enrollment-form">
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="course_id">
                  <span className="required">*</span> Select Refresher Course:
                </label>
                <select 
                  id="course_id" 
                  value={selectedCourse} 
                  onChange={handleCourseChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Select a Course --</option>
                  {refresherCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedCourse && courseDetails && (
                <div className="course-summary">
                  <h4>Course Summary</h4>
                  <div className="course-details">
                    <p className="course-description">{courseDetails.description || 'No description provided'}</p>
                    <div className="course-meta">
                      <div className="meta-item">
                        <span className="meta-label">Course Type:</span>
                        <span className="meta-value">{courseDetails.type}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value">{courseDetails.status}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Current Enrollments:</span>
                        <span className="meta-value">{courseDetails.enrollments?.length || 0} trainees</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="enrollment_reason">Enrollment Reason:</label>
                <textarea 
                  id="enrollment_reason" 
                  value={enrollmentReason} 
                  onChange={handleReasonChange}
                  className="form-textarea"
                  placeholder="Explain why these trainees need this refresher course..."
                  rows={3}
                />
              </div>
            </div>
            
            {selectedCourse && (
              <div className="form-section trainees-section">
                <div className="section-header">
                  <h4>Select Trainees to Enroll</h4>
                  <div className="selection-actions">
                    <button 
                      type="button" 
                      className="btn-select-all"
                      onClick={selectAllVisible}
                    >
                      <UserCheck size={14} />
                      Select All Visible
                    </button>
                    <button 
                      type="button" 
                      className="btn-clear-all"
                      onClick={clearAllSelections}
                    >
                      <Trash2 size={14} />
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="search-filter-bar">
                  <div className="search-container">
                    <Search size={18} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search trainees..." 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-enrolled">
                    <input 
                      type="checkbox" 
                      id="filter-enrolled" 
                      checked={filterEnrolled}
                      onChange={handleFilterEnrolledChange}
                    />
                    <label htmlFor="filter-enrolled">Hide already enrolled</label>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={toggleFilters} 
                    className="btn-toggle-filters"
                  >
                    <Filter size={18} />
                    <span>Filters</span>
                    {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                {showFilters && (
                  <div className="filters-panel">
                    <div className="filter-group">
                      <label htmlFor="program-filter">Program:</label>
                      <select 
                        id="program-filter" 
                        value={selectedProgramFilter}
                        onChange={handleProgramFilterChange}
                        className="filter-select"
                      >
                        <option value="all">All Programs</option>
                        {programs.map(program => (
                          <option key={program.id} value={program.id.toString()}>
                            {program.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="trainees-list">
                  {getFilteredTrainees().length > 0 ? (
                    getFilteredTrainees().map(trainee => {
                      const alreadyEnrolled = isEnrolled(trainee.id);
                      
                      return (
                        <div 
                          key={trainee.id} 
                          className={`trainee-item ${alreadyEnrolled ? 'already-enrolled' : ''}`}
                          onClick={() => !alreadyEnrolled && toggleTraineeSelection(trainee.id)}
                        >
                          <div className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={selectedTrainees.includes(trainee.id)}
                              onChange={() => {}}
                              disabled={alreadyEnrolled}
                            />
                          </div>
                          <div className="trainee-avatar">
                            {trainee.full_name.charAt(0)}
                          </div>
                          <div className="trainee-info">
                            <div className="trainee-name">{trainee.full_name}</div>
                            <div className="trainee-email">{trainee.email}</div>
                          </div>
                          {alreadyEnrolled && (
                            <div className="enrollment-badge">
                              <CheckCircle size={14} />
                              <span>Already Enrolled</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-trainees-message">
                      <AlertTriangle size={32} />
                      <p>No trainees match your search or filter criteria</p>
                    </div>
                  )}
                </div>
                
                <div className="selection-summary">
                  <span>{selectedTrainees.length} trainees selected for enrollment</span>
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                <XCircle size={18} />
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-save" 
                disabled={submitting || !selectedCourse || selectedTrainees.length === 0}
              >
                {submitting ? (
                  <>
                    <Clock size={18} className="icon-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    Enroll Trainees
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RefresherEnrollment;