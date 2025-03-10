// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Helper function to check token expiration (optional - implement if needed)
const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;
    
    // Set token expiration to 24 hours
    const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
    return new Date().getTime() > expirationTime;
};

const traineeService = {
    // Get dashboard data for trainee
    getDashboardData: async () => {
        try {
            // Get authentication token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            // Optional: Check token expiration
            if (isTokenExpired()) {
                localStorage.removeItem('authToken');
                throw new Error('Your session has expired. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/dashboard.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            // Check for HTTP errors
            if (!response.ok) {
                if (response.status === 401) {
                    // Clear invalid token
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                
                throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getDashboardData:', error);
            throw error;
        }
    },
    
    // Get enrolled programs for trainee
    getEnrolledPrograms: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/programs.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch programs: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getEnrolledPrograms:', error);
            throw error;
        }
    },
    
    // Get program details by ID
    getProgramDetails: async (programId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/programs.php?id=${programId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch program details: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getProgramDetails:', error);
            throw error;
        }
    },
    
    // Get available quizzes
    getQuizzes: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/quizzes.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quizzes: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getQuizzes:', error);
            throw error;
        }
    },
    
    // Get quiz details by ID
    getQuizDetails: async (quizId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/quizzes.php?id=${quizId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quiz details: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getQuizDetails:', error);
            throw error;
        }
    },
    
    // Submit a quiz attempt
    submitQuizAttempt: async (quizId, answers) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/quiz-submit.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    quiz_id: quizId,
                    answers: answers
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to submit quiz: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in submitQuizAttempt:', error);
            throw error;
        }
    },
    
    // Get quiz result details
    getQuizResult: async (attemptId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/quiz-results.php?attempt_id=${attemptId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quiz result: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getQuizResult:', error);
            throw error;
        }
    },
    
    // Get milestones
    getMilestones: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/milestones.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch milestones: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getMilestones:', error);
            throw error;
        }
    },
    
    // Update milestone progress
    updateMilestoneProgress: async (milestoneId, status) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/milestone-update.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    milestone_id: milestoneId,
                    status: status
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update milestone: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in updateMilestoneProgress:', error);
            throw error;
        }
    },
    
    // Get user profile
    getUserProfile: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/profile.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            throw error;
        }
    },
    
    // Update user profile
    updateUserProfile: async (profileData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainee/profile-update.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in updateUserProfile:', error);
            throw error;
        }
    },
    
    // Logout function
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginTime');
        
        // Optionally make a logout API call if your backend tracks sessions
        try {
            fetch(`${API_BASE_URL}/lms-forbes/backend/api/auth/logout.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
};

export default traineeService;