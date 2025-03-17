// src/services/trainerService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const isTokenExpired = () => {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return true;
  const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000); // 24 hours
  return new Date().getTime() > expirationTime;
};

const trainerService = {
  getDashboardData: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/dashboard.php`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  // Add these methods to your existing trainerService.js file

// Set quiz grading options
configureQuizGrading: async (quizId, gradingOptions) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/configure_quiz_grading.php?quizId=${quizId}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(gradingOptions)
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      throw new Error('Authentication failed. Please login again.');
    }
    const errorText = await response.text();
    throw new Error(`HTTP error: ${response.status} - ${errorText}`);
  }

  return response.json();
},

// Get grading results for a quiz
getQuizGradingResults: async (quizId, includeDetails = false) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quiz_grading_results.php?quizId=${quizId}&details=${includeDetails ? 1 : 0}`;
  const response = await fetch(endpoint, {
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

  return response.json();
},

// Generate automated feedback for a quiz attempt
generateQuizFeedback: async (attemptId) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/generate_feedback.php?attemptId=${attemptId}`;
  const response = await fetch(endpoint, {
    method: 'POST',
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

  return response.json();
},


  getPrograms: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  getMilestones: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/milestones.php`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  getMilestoneDetails: async (milestoneId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/milestone_details.php?milestoneId=${milestoneId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  createMilestone: async (milestoneData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/save_milestone.php`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(milestoneData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  updateMilestone: async (milestoneId, milestoneData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/save_milestone.php?milestoneId=${milestoneId}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(milestoneData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  deleteMilestone: async (milestoneId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/delete_milestone.php?milestoneId=${milestoneId}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
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

    return response.json();
  },

  getTrainees: async (programId = '') => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = programId
      ? `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainees.php?programId=${programId}`
      : `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainees.php`;
    
    const response = await fetch(endpoint, {
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

    return response.json();
  },
  
  getTraineeDetails: async (traineeId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainee_details.php?traineeId=${traineeId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },
  
  getTraineeProgress: async (traineeId, timeRange = 'all') => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainee_progress.php?traineeId=${traineeId}&timeRange=${timeRange}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },
  
  exportTrainees: async (format = 'csv') => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/export_trainees.php?format=${format}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': format === 'pdf' ? 'application/pdf' : 'text/csv'
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

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trainees_export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  getProgramDetails: async (programId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/program_details.php?programId=${programId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  getRefresherCourses: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_courses.php`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },
  
  getRefresherCourseDetails: async (courseId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_course_details.php?courseId=${courseId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },
  
  createRefresherCourse: async (courseData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/create_refresher_course.php`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },
  
  updateRefresherCourse: async (courseId, courseData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/update_refresher_course.php?courseId=${courseId}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },
  
  deleteRefresherCourse: async (courseId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/delete_refresher_course.php?courseId=${courseId}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
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

    return response.json();
  },
  
  enrollTraineesInRefresherCourse: async (courseId, traineeIds) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/enroll_trainees_refresher.php`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseId: courseId,
        traineeIds: traineeIds
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  getQuizzes: async (programId = '') => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = programId
      ? `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php?programId=${programId}`
      : `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  createQuiz: async (quizData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/create_quiz.php`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quizData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  getQuizById: async (quizId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quiz_details.php?quizId=${quizId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  updateQuiz: async (quizId, quizData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }
  
    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/update_quiz.php?quizId=${quizId}`;
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
  
      return response.json();
    } catch (err) {
      throw err;
    }
  },

  updateQuizStatus: async (quizId, status) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/update_quiz_status.php?quizId=${quizId}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  deleteQuiz: async (quizId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/delete_quiz.php?quizId=${quizId}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
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

    return response.json();
  },

  getQuizAttempts: async (quizId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quiz_attempts.php?quizId=${quizId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  getQuizAttemptDetails: async (quizId, attemptId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quiz_attempt_details.php?quizId=${quizId}&attemptId=${attemptId}`;
    const response = await fetch(endpoint, {
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

    return response.json();
  },

  exportQuizResults: async (quizId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/export_quiz_results.php?quizId=${quizId}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
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

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz_${quizId}_results.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTime');
  }
};

export default trainerService;  