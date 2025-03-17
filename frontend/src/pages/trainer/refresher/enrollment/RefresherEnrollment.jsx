import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, RotateCw, Save, XCircle, Clock, Search, 
  AlertTriangle, UserCheck, Trash2, CheckCircle, Filter,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

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
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #FFB74D, #FB8C00)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Enroll Trainees in Refresher Course</h3>
          </div>
        </div>
        
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="course_id" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                  <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> Select Refresher Course:
                </label>
                <select 
                  id="course_id" 
                  value={selectedCourse} 
                  onChange={handleCourseChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
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
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Course Summary</h4>
                  <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>{courseDetails.description || 'No description provided'}</p>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748B' }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>Course Type:</span> {courseDetails.type}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Status:</span> {courseDetails.status}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Current Enrollments:</span> {courseDetails.enrollments?.length || 0} trainees
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="enrollment_reason" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Enrollment Reason:</label>
                <textarea 
                  id="enrollment_reason" 
                  value={enrollmentReason} 
                  onChange={handleReasonChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', minHeight: '100px' }}
                  placeholder="Explain why these trainees need this refresher course..."
                />
              </div>
            </div>
            
            {selectedCourse && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Select Trainees to Enroll</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#E3F2FD', color: '#1E88E5', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                      onClick={selectAllVisible}
                    >
                      <UserCheck size={14} />
                      Select All Visible
                    </button>
                    <button 
                      type="button" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#FEE2E2', color: '#E53E3E', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                      onClick={clearAllSelections}
                    >
                      <Trash2 size={14} />
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '8px', gap: '8px' }}>
                    <Search size={18} color="#64748B" />
                    <input 
                      type="text" 
                      placeholder="Search trainees..." 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#1E293B', outline: 'none' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                    <input 
                      type="checkbox" 
                      id="filter-enrolled" 
                      checked={filterEnrolled}
                      onChange={handleFilterEnrolledChange}
                      style={{ marginRight: '8px' }}
                    />
                    <label htmlFor="filter-enrolled">Hide already enrolled</label>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={toggleFilters} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                  >
                    <Filter size={18} />
                    <span>Filters</span>
                    {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                {showFilters && (
                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="program-filter" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Program:</label>
                      <select 
                        id="program-filter" 
                        value={selectedProgramFilter}
                        onChange={handleProgramFilterChange}
                        style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getFilteredTrainees().length > 0 ? (
                    getFilteredTrainees().map(trainee => {
                      const alreadyEnrolled = isEnrolled(trainee.id);
                      
                      return (
                        <div 
                          key={trainee.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '16px', 
                            padding: '16px', 
                            backgroundColor: 'white', 
                            borderRadius: '8px', 
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', 
                            cursor: alreadyEnrolled ? 'default' : 'pointer',
                            opacity: alreadyEnrolled ? 0.7 : 1
                          }}
                          onClick={() => !alreadyEnrolled && toggleTraineeSelection(trainee.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedTrainees.includes(trainee.id)}
                              onChange={() => {}}
                              disabled={alreadyEnrolled}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#E3F2FD', borderRadius: '50%', color: '#1E88E5', fontWeight: '600' }}>
                            {trainee.full_name.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{trainee.full_name}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{trainee.email}</div>
                          </div>
                          {alreadyEnrolled && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#2ECC71' }}>
                              <CheckCircle size={14} />
                              <span>Already Enrolled</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      <AlertTriangle size={32} />
                      <p>No trainees match your search or filter criteria</p>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '14px', color: '#64748B', marginTop: '16px' }}>
                  <span>{selectedTrainees.length} trainees selected for enrollment</span>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
              <button 
                type="button" 
                onClick={handleCancel} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease', opacity: submitting || !selectedCourse || selectedTrainees.length === 0 ? 0.7 : 1 }}
                disabled={submitting || !selectedCourse || selectedTrainees.length === 0}
              >
                {submitting ? (
                  <>
                    <Clock size={18} style={{ animation: 'spin 1s linear infinite' }} />
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