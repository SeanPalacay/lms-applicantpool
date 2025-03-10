// trainerService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Helper function to check token expiration
const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;

    // Set token expiration to 24 hours
    const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
    return new Date().getTime() > expirationTime;
};

const trainerService = {
    getDashboardData: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }

            if (isTokenExpired()) {
                localStorage.removeItem('authToken');
                throw new Error('Your session has expired. Please login again.');
            }

            console.log('Requesting trainer dashboard data from:', `${API_BASE_URL}/lms-forbes/backend/api/trainer/dashboard.php`);

            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/dashboard.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Trainer dashboard data received:', data);
            return data;
        } catch (error) {
            console.error('Error in getDashboardData:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('role');
        localStorage.removeItem('full_name');
        localStorage.removeItem('loginTime');

        // Optionally make a logout API call
        try {
            fetch(`${API_BASE_URL}/lms-forbes/backend/api/auth/logout.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    },
};

export default trainerService;