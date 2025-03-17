// traineeService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;
    const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
    return new Date().getTime() > expirationTime;
};

const traineeService = {
    getDashboardData: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/dashboard.php`;

        try {
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.getDashboardData:', error);
            throw error;
        }
    },
    
    // Get all programs for the trainee
    getPrograms: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/programs.php`;

        try {
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.getPrograms:', error);
            throw error;
        }
    },
    
    // Get a specific program by ID
    getProgramDetails: async (programId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/program_details.php?programId=${programId}`;

        try {
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.getProgramDetails:', error);
            throw error;
        }
    },
    
    // Get milestones for a program
    getProgramMilestones: async (programId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/milestones.php?programId=${programId}`;

        try {
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.getProgramMilestones:', error);
            throw error;
        }
    },
    
    // Update milestone progress
    updateMilestoneProgress: async (milestoneId, status) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/update_milestone.php`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    milestone_id: milestoneId,
                    status: status
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.updateMilestoneProgress:', error);
            throw error;
        }
    },

    // Inside traineeService object, after getAssessments
getQuizDetails: async (quizId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/take_quiz.php?quizId=${quizId}`;
    console.log('Fetching quiz details from:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Quiz details fetch failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in traineeService.getQuizDetails:', error);
        throw error;
    }
},

submitQuiz: async (quizId, answers) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/take_quiz.php`;
    console.log('Submitting quiz to:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quiz_id: quizId, answers })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Quiz submission failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in traineeService.submitQuiz:', error);
        throw error;
    }
},

getQuizFeedback: async (quizId, attemptId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/quiz_feedback.php?quizId=${quizId}&attemptId=${attemptId}`;
    console.log('Fetching quiz feedback from:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Quiz feedback fetch failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in traineeService.getQuizFeedback:', error);
        throw error;
    }
},

downloadQuizFeedbackPDF: async (quizId, attemptId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/quiz_feedback.php?quizId=${quizId}&attemptId=${attemptId}&format=pdf`;
    console.log('Downloading quiz feedback PDF from:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PDF download failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error('Error in traineeService.downloadQuizFeedbackPDF:', error);
        throw error;
    }
},

    // Add this inside the traineeService object
getAssessments: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/assessments.php`;
    console.log('Fetching assessments from:', endpoint); // Debug

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Assessments fetch failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in traineeService.getAssessments:', error);
        throw error;
    }
},

// Add after getProgramQuizzes
getTraineeQuizAttempts: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/quiz_attempts.php`;
    try {
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
        return await response.json();
    } catch (error) {
        console.error('Error in traineeService.getTraineeQuizAttempts:', error);
        throw error;
    }
},

getTraineeMilestones: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/milestone_progress.php`;
    try {
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
        return await response.json();
    } catch (error) {
        console.error('Error in traineeService.getTraineeMilestones:', error);
        throw error;
    }
},

exportProgressPDF: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found. Please log in again.');
    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/progress_export.php`;
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
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
        return await response.blob();
    } catch (error) {
        console.error('Error in traineeService.exportProgressPDF:', error);
        throw error;
    }
},
    
    // Get quizzes for a program
    getProgramQuizzes: async (programId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }
    
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }
    
        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/quizzes.php?programId=${programId}`;
    
        try {
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
    
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in traineeService.getProgramQuizzes:', error);
            throw error;
        }
    },
// Add this to traineeService.js
getCertificates: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No token found. Please log in again.');
    }

    if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
    }

    const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificates.php`;
    console.log('Fetching certificates from:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Certificates fetch failed:', response.status, errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in traineeService.getCertificates:', error);
        throw error;
    }
},
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginTime');
        // Optionally POST to a logout endpoint
    }
};

export default traineeService;