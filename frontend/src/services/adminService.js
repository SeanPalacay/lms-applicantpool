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

const adminService = {
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
            
            console.log('Requesting dashboard data from:', `${API_BASE_URL}/lms-forbes/backend/api/admin/dashboard.php`);
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/admin/dashboard.php`, {
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
                
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Dashboard data received:', data);
            return data;
        } catch (error) {
            console.error('Error in getDashboardData:', error);
            throw error;
        }
    },
    
    getUserList: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/admin/users.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch user list: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getUserList:', error);
            throw error;
        }
    },
    
    getProgramList: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch program list: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getProgramList:', error);
            throw error;
        }
    },
    
    getSystemStatus: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                throw new Error('Authentication required. Please login again.');
            }
            
            const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/admin/system-status.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getSystemStatus:', error);
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

export default adminService;