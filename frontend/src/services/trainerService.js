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

  // Add these methods to your trainerService.js file

// Get leaderboard data
getLeaderboard: async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (filters.programId) {
    queryParams.append('programId', filters.programId);
  }
  
  if (filters.timeframe) {
    queryParams.append('timeframe', filters.timeframe);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/leaderboard.php${queryString}`;
  
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

// Export leaderboard data
exportLeaderboard: async (format = 'csv', filters = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  // Build query parameters
  const queryParams = new URLSearchParams({ format });
  
  if (filters.programId) {
    queryParams.append('programId', filters.programId);
  }
  
  if (filters.timeframe) {
    queryParams.append('timeframe', filters.timeframe);
  }
  
  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/export_leaderboard.php?${queryParams.toString()}`;
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
  link.download = `trainee_leaderboard.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
},

// Get trainee ranking for a specific trainee
getTraineeRanking: async (traineeId) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainee_ranking.php?traineeId=${traineeId}`;
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
  
  // Add this to your trainerService.js file

enrollTrainees: async (programId, traineeIds) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/enroll_trainees.php`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      programId: programId,
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

// Update this method in your trainerService.js file
createQuiz: async (quizData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/create_quiz.php`;
  
  try {
    console.log("Sending request to:", endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quizData)
    });

    // First try to get the text response
    const responseText = await response.text();
    
    // Check if it's valid JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Server returned non-JSON response:", responseText);
      throw new Error(`Server error: Invalid response format. Please check server logs.`);
    }

    // Check for error in the JSON response
    if (responseData.error) {
      throw new Error(responseData.error);
    }

    // Check HTTP status
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error: ${response.status}`);
    }

    return responseData;
  } catch (err) {
    console.error("Error in createQuiz:", err);
    throw err;
  }
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
  // Add or update this method in trainerService.js

createProgram: async (programData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php`;
  console.log('Creating program from:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    });

    // Get response text first to check what's actually being returned
    const responseText = await response.text();
    
    // Try to parse it as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Server returned an invalid response. Please try again or contact support.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      
      // Use the error message from the parsed JSON if available
      throw new Error(responseData.error || `Error creating program (${response.status})`);
    }

    return responseData;
  } catch (error) {
    console.error('Error in createProgram:', error.message);
    throw error;
  }
},

// Add this to your trainerService.js

updateProgram: async (programId, programData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php?id=${programId}`;
  console.log('Updating program at:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    });

    // Get response text first to check what's actually being returned
    const responseText = await response.text();
    
    // Try to parse it as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Server returned an invalid response. Please try again or contact support.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      
      // Use the error message from the parsed JSON if available
      throw new Error(responseData.error || `Error updating program (${response.status})`);
    }

    return responseData;
  } catch (error) {
    console.error('Error in updateProgram:', error.message);
    throw error;
  }
},
getProgramById: async (programId) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php?id=${programId}`;
  console.log('Fetching program details from:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API response status:', response.status);
    
    // Get response text
    const responseText = await response.text();
    console.log('API response text:', responseText);
    
    // Empty response check
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }
    
    // Try to parse it as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data type:', Array.isArray(responseData) ? 'array' : typeof responseData);
      
      // If we got an array, try to find the program by ID
      if (Array.isArray(responseData)) {
        console.log('Received array instead of object, looking for program with ID:', programId);
        const foundProgram = responseData.find(p => String(p.id) === String(programId));
        if (foundProgram) {
          console.log('Found program in array:', foundProgram);
          responseData = foundProgram;
        } else {
          throw new Error('Program not found in response array');
        }
      }
      
      // Check if we got an error response
      if (responseData && responseData.error) {
        throw new Error(responseData.error);
      }
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Server returned an invalid response format. Please try again.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 404) {
        throw new Error('Program not found or you do not have access to it.');
      }
      
      throw new Error(responseData.error || `Error fetching program (${response.status})`);
    }

    return responseData;
  } catch (error) {
    console.error(`Error in getProgramById(${programId}):`, error);
    throw error;
  }
},

// Add these to your trainerService.js

// Get all practical exams
getPracticalExams: async (programId = '') => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = programId
    ? `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php?programId=${programId}`
    : `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php`;
  
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

// Get a specific practical exam
getPracticalExamById: async (examId) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php?id=${examId}`;
  
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

// Create a new practical exam
createPracticalExam: async (examData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(examData)
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

// Update an existing practical exam
updatePracticalExam: async (examId, examData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php?id=${examId}`;
  
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(examData)
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

// Delete a practical exam
deletePracticalExam: async (examId) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exams.php?id=${examId}`;
  
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

// Get practical exam attempts
getPracticalExamAttempts: async (examId, filters = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const queryParams = new URLSearchParams({ exam_id: examId });
  
  // Add filters to query parameters
  if (filters.ungraded_only) {
    queryParams.append('ungraded_only', '1');
  }
  
  if (filters.trainee_id) {
    queryParams.append('trainee_id', filters.trainee_id);
  }
  
  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exam_grades.php?${queryParams.toString()}`;
  
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

// Grade a practical exam attempt
gradePracticalExam: async (attemptId, score, feedback = '') => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/practical_exam_grades.php`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      score,
      feedback
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


// Get a trainee's overall grade (including practical exams)
// Enhanced debug version of getTraineeGrades for trainerService.js

getTraineeGrades: async (traineeId, programId = null) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  // Build the endpoint URL
  let endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainee_grades.php?trainee_id=${traineeId}`;
  if (programId) {
    endpoint += `&program_id=${programId}`;
  }
  
  console.log('Fetching grades from:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Get the raw text first to help with debugging
    const responseText = await response.text();
    console.log('Raw API response length:', responseText.length);
    if (responseText.length > 100) {
      console.log('Response preview:', responseText.substring(0, 100) + '...');
    } else {
      console.log('Full response:', responseText);
    }

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      throw new Error('Server returned an empty response');
    }

    // Now try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Invalid JSON response`);
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      
      throw new Error(`HTTP error: ${response.status} - ${data.error || 'Unknown error'}`);
    }

    // If we have an error property in the response
    if (data.error) {
      throw new Error(data.message || data.error);
    }

    console.log('Grade data received');
    return data;
  } catch (err) {
    console.error('Error fetching trainee grades:', err);
    throw err;
  }
},
// Add these methods to your trainerService.js file

getGradeConfiguration: async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/grade_configuration.php`;
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

saveGradeConfiguration: async (configData) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No token found. Please log in again.');
  if (isTokenExpired()) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please log in again.');
  }

  const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/grade_configuration.php`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(configData)
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