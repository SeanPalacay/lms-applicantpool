import axios from 'axios';

const authService = {
    // Login user
    login: async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login.php', {
                username,
                password
            }, {
                withCredentials: true // Important: Include cookies in request
            });
            
            // Store user data in localStorage for UI purposes
            if (response.data) {
                if (response.data.token) {
                    localStorage.setItem('auth_token', response.data.token);
                }
                
                // Create user data object
                const userData = {
                    role: response.data.role || '',
                    full_name: response.data.full_name || username,
                };
                
                localStorage.setItem('user_data', JSON.stringify(userData));
                
                console.log('Login successful:', response.data);
            }
            
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    // Logout user
    logout: async () => {
        try {
            // Call server to destroy session
            await axios.post('/api/auth/logout.php', {}, {
                withCredentials: true
            });
            
            // Clear local storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
        } catch (error) {
            console.error('Logout error:', error);
            
            // Still clear local storage even if server request fails
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
        }
    },
    
    // Check if user is authenticated
    checkAuthStatus: async () => {
        try {
            // Check session on server
            const response = await axios.get('/api/auth/verify.php', {
                withCredentials: true // Important: Include cookies in request
            });
            
            return response.data && response.data.isAuthenticated;
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