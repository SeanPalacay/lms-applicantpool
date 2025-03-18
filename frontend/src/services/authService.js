// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Helper function to check token expiration
const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;

    // Set token expiration to 24 hours
    const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
    return new Date().getTime() > expirationTime;
};

const authService = {
    // Login user
    login: async (username, password) => {
        try {
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/login.php`;
            console.log('Logging in to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Store user data in localStorage for UI purposes
            if (data) {
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('auth_token', data.token); // For backward compatibility
                }

                const userData = {
                    role: data.role || '',
                    full_name: data.full_name || username,
                };

                localStorage.setItem('user_data', JSON.stringify(userData));
                localStorage.setItem('loginTime', new Date().toISOString());
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout user
    logout: async () => {
        try {
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/logout.php`;
            console.log('Logging out from:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Logout successful:', data);

            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('loginTime');
        } catch (error) {
            console.error('Logout error:', error);

            // Still clear local storage even if server request fails
            localStorage.removeItem('authToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('loginTime');
        }
    },

    // Check if user is authenticated
    checkAuthStatus: async () => {
        try {
            const authToken = localStorage.getItem('authToken');

            if (!authToken || isTokenExpired()) {
                console.error('No valid authToken found in localStorage');
                return false;
            }

            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/verify.php`;
            console.log('Checking auth status from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Auth check failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data && data.isAuthenticated;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },

    // Get current user data from localStorage (for UI purposes)
    getCurrentUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    // Check if user has specific role
    hasRole: (requiredRole) => {
        const userData = localStorage.getItem('user_data');

        if (!userData) {
            return false;
        }

        const user = JSON.parse(userData);

        // Admin has access to everything
        if (user.role === 'administrator' || user.role === 'admin') {
            return true;
        }

        return user.role === requiredRole;
    }
};

export default authService;