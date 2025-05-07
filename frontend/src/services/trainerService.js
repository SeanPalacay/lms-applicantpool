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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getJobPositions: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/job_positions.php`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  configureQuizGrading: async (quizId, gradingData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php?id=${quizId}`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gradingData)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getLeaderboard: async (filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams();
    if (filters.programId) queryParams.append('programId', filters.programId);
    if (filters.timeframe) queryParams.append('timeframe', filters.timeframe);
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  exportLeaderboard: async (format = 'csv', filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams({ format });
    if (filters.programId) queryParams.append('programId', filters.programId);
    if (filters.timeframe) queryParams.append('timeframe', filters.timeframe);
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getTrainees: async (programId = '', filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams();
    if (programId) queryParams.append('programId', programId);
    if (filters.positionName) queryParams.append('positionName', filters.positionName);
    
    const endpoint = queryParams.toString()
      ? `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainees.php?${queryParams.toString()}`
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response: expected an array of trainees');
    }
    return data;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  exportTrainees: async (format = 'csv', filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams({ format });
    if (filters.programId) queryParams.append('programId', filters.programId);
    if (filters.positionName) queryParams.append('positionName', filters.positionName);
    
    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/export_trainees.php?${queryParams.toString()}`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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

  getPositionMappings: async (positionId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/position_mappings.php?positionId=${positionId}`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getProgramDetails: async (programId, filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams({ programId });
    if (filters.positionName) queryParams.append('positionName', filters.positionName);
    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/program_details.php?${queryParams.toString()}`;
    
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Fetching program details from:', endpoint);
    }

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    if (!data.enrollments || !Array.isArray(data.enrollments)) {
      throw new Error('Invalid response: enrollments array missing or invalid');
    }
    return data;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
        programId,
        traineeIds
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
        courseId,
        traineeIds
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getQuizzes: async (programId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = programId
      ? `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php?program_id=${programId}`
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
    const response = await fetch(endpoint, {
      method: 'PUT',
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/quizzes.php?id=${quizId}`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  createProgram: async (programData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php`;
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Creating program from:', endpoint);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      if (process.env.REACT_APP_DEBUG_API) {
        console.error('Failed to parse response as JSON:', responseText);
      }
      throw new Error('Server returned an invalid response. Please try again or contact support.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(responseData.error || `HTTP error: ${response.status}`);
    }

    return responseData;
  },

  updateProgram: async (programId, programData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php?id=${programId}`;
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Updating program at:', endpoint);
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      if (process.env.REACT_APP_DEBUG_API) {
        console.error('Failed to parse response as JSON:', responseText);
      }
      throw new Error('Server returned an invalid response. Please try again or contact support.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(responseData.error || `HTTP error: ${response.status}`);
    }

    return responseData;
  },

  deleteProgram: async (programId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php?id=${programId}`;
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Deleting program from:', endpoint);
    }

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getProgramById: async (programId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php?id=${programId}`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getPracticalExamAttempts: async (examId, filters = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    const queryParams = new URLSearchParams({ exam_id: examId });
    if (filters.ungraded_only) queryParams.append('ungraded_only', '1');
    if (filters.trainee_id) queryParams.append('trainee_id', filters.trainee_id);
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  },

  getTraineeGrades: async (traineeId, programId = null) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }

    let endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainer/trainee_grades.php?trainee_id=${traineeId}`;
    if (programId) endpoint += `&program_id=${programId}`;
    
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Fetching grades from:', endpoint);
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    if (process.env.REACT_APP_DEBUG_API) {
      console.log('Raw API response length:', responseText.length);
      if (responseText.length > 100) {
        console.log('Response preview:', responseText.substring(0, 100) + '...');
      } else {
        console.log('Full response:', responseText);
      }
    }

    if (!responseText || responseText.trim() === '') {
      throw new Error('Server returned an empty response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      if (process.env.REACT_APP_DEBUG_API) {
        console.error('JSON parse error');
      }
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(data.error || `HTTP error: ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    return data;
  },

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      } catch {
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
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