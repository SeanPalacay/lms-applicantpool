// employeeService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;
    const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
    return new Date().getTime() > expirationTime;
};

const employeeService = {
    getDashboardData: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/dashboard.php`;

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
            console.error('Error in employeeService.getDashboardData:', error);
            throw error;
        }
    },

    getPracticalExams: async (programId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        let endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/practical_exams.php`;
        if (programId) {
            endpoint += `?programId=${programId}`;
        }

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
            console.error('Error in employeeService.getPracticalExams:', error);
            throw error;
        }
    },

    getPracticalExamAttempts: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/practical_exam_attempts.php`;

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
            console.error('Error in employeeService.getPracticalExamAttempts:', error);
            throw error;
        }
    },

    getMilestones: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/milestones.php`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Permission denied. You do not have access to this resource.');
                } else {
                    throw new Error(`HTTP error: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getMilestones:', error);
            throw error;
        }
    },

    getMilestoneDetails: async (milestoneId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/milestone_details.php?milestoneId=${milestoneId}`;

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
            console.error('Error in employeeService.getMilestoneDetails:', error);
            throw error;
        }
    },

    getResume: async (resumePath) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        let endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/get_resume.php`;
        if (resumePath) {
            endpoint += `?path=${encodeURIComponent(resumePath)}`;
        }

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
                if (response.status === 404) {
                    throw new Error('Resume not found.');
                }
                if (response.status === 403) {
                    throw new Error('You do not have permission to view this resume.');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Error in employeeService.getResume:', error);
            throw error;
        }
    },

    getPrograms: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/programs.php`;

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
            console.error('Error in employeeService.getPrograms:', error);
            throw error;
        }
    },

    getProgramDetails: async (programId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/program_details.php?programId=${programId}`;

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
            console.error('Error in employeeService.getProgramDetails:', error);
            throw error;
        }
    },

    getQuizAttempts: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/quiz_attempts.php`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please log in again.');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in employeeService.getQuizAttempts:', error);
            throw error;
        }
    },

    getProfile: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/profile.php`;

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
            console.error('Error in employeeService.getProfile:', error);
            throw error;
        }
    },

    // Add getActivity function that's missing
    getActivity: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/activity.php`;

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
            console.error('Error in employeeService.getActivity:', error);
            throw error;
        }
    },

    // Add updateProfile function that's missing
    updateProfile: async (profileData, resumeFile = null) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/update_profile.php`;
        
        try {
            let response;
            
            if (resumeFile) {
                const formData = new FormData();
                formData.append('full_name', profileData.full_name);
                formData.append('email', profileData.email);
                formData.append('resume', resumeFile);
                
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
            } else {
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: profileData.full_name,
                        email: profileData.email
                    })
                });
            }
            
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
            console.error('Error in employeeService.updateProfile:', error);
            throw error;
        }
    },

    // Add changePassword function that's missing
    changePassword: async (passwordData) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/change_password.php`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Current password is incorrect');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in employeeService.changePassword:', error);
            throw error;
        }
    },

    getAssessments: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/assessments.php`;
        console.log('Fetching assessments from:', endpoint);

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
            console.error('Error in employeeService.getAssessments:', error);
            throw error;
        }
    },

    updateMilestoneProgress: async (progressId, status) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/update_milestone.php`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    milestone_id: progressId,
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
            console.error('Error in employeeService.updateMilestoneProgress:', error);
            throw error;
        }
    },

    exportProgressPDF: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No token found. Please log in again.');
        }

        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
        }

        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/employee/export_progress_pdf.php`;

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
            console.error('Error in employeeService.exportProgressPDF:', error);
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

export default employeeService;