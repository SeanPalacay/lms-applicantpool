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
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            if (isTokenExpired()) {
                localStorage.removeItem('authToken');
                throw new Error('Your session has expired. Please login again.');
            }
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/dashboard.php`;
            console.log('Requesting dashboard data from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Dashboard data received:', data);
            return data;
        } catch (error) {
            console.error('Error in getDashboardData:', error.message, error.stack);
            throw error;
        }
    },
    
    getUserById: async (userId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. gPlease login again.');
            }
            
            if (isTokenExpired()) {
                localStorage.removeItem('authToken');
                throw new Error('Your session has expired. Please login again.');
            }
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php?id=${userId}`;
            console.log('Fetching user from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`Failed to fetch user: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getUserById:', error.message, error.stack);
            throw error;
        }
    },

    getUsers: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php`;
            console.log('Fetching users from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getUsers:', error.message, error.stack);
            throw error;
        }
    },
    
    getUserList: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php`;
            console.log('Fetching user list from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Failed to fetch user list: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getUserList:', error.message, error.stack);
            throw error;
        }
    },

    getProgramById: async (programId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            // Make sure the path includes "admin"
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php?id=${programId}`;
            console.log('Fetching program details from:', url);
            
    
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`Failed to fetch program details: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error in getProgramById(${programId}):`, error.message, error.stack);
            throw error;
        }
    },
    
    // Keep the existing getProgramDetails function for backwards compatibility
    getProgramDetails: async (programId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            // Correct the URL path to include "admin"
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php?id=${programId}`;
            console.log('Fetching program details from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(`Failed to fetch program details: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Program details fetched:', data);
            
            // Add default stats if not provided by the API
            if (!data.stats) {
                data.stats = {
                    totalEnrollments: 0,
                    completionRate: 0,
                    averageScore: 0
                };
            }
            
            // Initialize empty arrays for related data if not provided
            if (!data.enrollments) data.enrollments = [];
            if (!data.milestones) data.milestones = [];
            if (!data.quizzes) data.quizzes = [];
            
            return data;
        } catch (error) {
            console.error(`Error in getProgramDetails(${programId}):`, error.message, error.stack);
            throw error;
        }
    },
    
    getProgramList: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            // Updated URL with the correct path including "admin"
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php`;
            console.log('Fetching programs from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Failed to fetch program list: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getProgramList:', error.message, error.stack);
            throw error;
        }
    },

    
getRecords: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php`;
        console.log('Fetching records from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Records data received:', data);
        return data;
    } catch (error) {
        console.error('Error in getRecords:', error.message, error.stack);
        throw error;
    }
},

getRecordById: async (recordId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?id=${recordId}`;
        console.log('Fetching record details from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Record details received:', data);
        return data;
    } catch (error) {
        console.error(`Error in getRecordById(${recordId}):`, error.message, error.stack);
        throw error;
    }
},

downloadRecord: async (recordId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?id=${recordId}&action=download&token=${authToken}`;
        console.log('Downloading record from:', url);
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error(`Error in downloadRecord(${recordId}):`, error.message, error.stack);
        throw error;
    }
},

downloadMultipleRecords: async (recordIds) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?action=download-bulk&token=${authToken}`;
        console.log('Downloading multiple records from:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ record_ids: recordIds })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to download records: ${errorText}`);
        }
        
        // Check if the response is a ZIP file
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/zip')) {
            // Get the blob and create a download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `records-${new Date().toISOString().slice(0, 10)}.zip`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
        } else {
            // If not a ZIP, it's probably a JSON response with an error
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        }
    } catch (error) {
        console.error('Error in downloadMultipleRecords:', error.message, error.stack);
        throw error;
    }
},

deleteRecord: async (recordId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?id=${recordId}`;
        console.log('Deleting record from:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to delete record: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Delete record response:', data);
        return data;
    } catch (error) {
        console.error(`Error in deleteRecord(${recordId}):`, error.message, error.stack);
        throw error;
    }
},

deleteMultipleRecords: async (recordIds) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?action=delete-bulk`;
        console.log('Deleting multiple records from:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ record_ids: recordIds })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to delete records: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Delete multiple records response:', data);
        return data;
    } catch (error) {
        console.error('Error in deleteMultipleRecords:', error.message, error.stack);
        throw error;
    }
},

uploadRecord: async (formData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php`;
        console.log('Uploading record to:', url);
        
        // Add the authorization token to the FormData
        formData.append('token', authToken);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Don't set Content-Type when sending FormData
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to upload record: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Upload record response:', data);
        return data;
    } catch (error) {
        console.error('Error in uploadRecord:', error.message, error.stack);
        throw error;
    }
},

getRecordCategories: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?action=categories`;
        console.log('Fetching record categories from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch record categories: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Record categories received:', data);
        return data;
    } catch (error) {
        console.error('Error in getRecordCategories:', error.message, error.stack);
        throw error;
    }
},
    // Reports Module Methods
getReportsData: async (reportType = 'all', dateRange = 'month', startDate = null, endDate = null) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('type', reportType);
        params.append('range', dateRange);
        
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/reports.php?${params.toString()}`;
        console.log('Requesting reports data from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Reports data received:', data);
        return data;
    } catch (error) {
        console.error('Error in getReportsData:', error.message, error.stack);
        throw error;
    }
},

exportReport: async (reportType, format = 'csv', filters = {}) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('type', reportType);
        params.append('format', format);
        params.append('action', 'export');
        params.append('token', authToken);
        
        // Add filters
        for (const key in filters) {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/reports-export.php?${params.toString()}`;
        console.log('Exporting report from:', url);
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}-report-${new Date().toISOString().slice(0, 10)}.${format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error('Error in exportReport:', error.message, error.stack);
        throw error;
    }
},
    
    getSystemStatus: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authToken found in localStorage');
                throw new Error('Authentication required. Please login again.');
            }
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/system-status.php`;
            console.log('Fetching system status from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error details:', errorText);
                throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getSystemStatus:', error.message, error.stack);
            throw error;
        }
    },
    

// Backup Management Functions for adminService.js
// Add these functions to your existing adminService object

createBackup: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php`;
        console.log('Creating backup from:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ 
                backup_type: 'manual',
                backup_name: `Manual_Backup_${new Date().toISOString().slice(0, 10)}_${Math.floor(Math.random() * 1000)}`
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`Failed to create backup: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in createBackup:', error.message, error.stack);
        throw error;
    }
},

downloadBackup: async (backupId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php?id=${backupId}&action=download&token=${authToken}`;
        console.log('Downloading backup from:', url);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup-${backupId}.sql`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true };
    } catch (error) {
        console.error('Error in downloadBackup:', error.message, error.stack);
        throw error;
    }
},

restoreBackup: async (backupId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php?id=${backupId}&action=restore`;
        console.log('Restoring backup from:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(`Failed to restore backup: ${await response.text()}`);
        return await response.json();
    } catch (error) {
        console.error('Error in restoreBackup:', error.message, error.stack);
        throw error;
    }
},

getBackups: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php`;
        console.log('Fetching backups from:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch backups: ${await response.text()}`);
        return await response.json();
    } catch (error) {
        console.error('Error in getBackups:', error.message, error.stack);
        throw error;
    }
},

getBackupById: async (backupId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php?id=${backupId}`;
        console.log('Fetching backup details from:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch backup details: ${await response.text()}`);
        return await response.json();
    } catch (error) {
        console.error(`Error in getBackupById(${backupId}):`, error.message, error.stack);
        throw error;
    }
},

deleteBackup: async (backupId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/backups.php?id=${backupId}`;
        console.log('Deleting backup from:', url);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(`Failed to delete backup: ${await response.text()}`);
        return await response.json();
    } catch (error) {
        console.error('Error in deleteBackup:', error.message, error.stack);
        throw error;
    }
},

    
    // User Management Functions
    createUser: async (userData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php`;
            console.log('Creating user from:', url);
            
            // If creating an applicant, ensure access code is set
            if (userData.role === 'applicant' && userData.access_code) {
                // Create a copy of userData to avoid modifying the original
                const userDataCopy = { ...userData };
                
                // Remove access_code from userDataCopy as it's handled separately
                delete userDataCopy.access_code;
                
                // First create the user
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(userDataCopy)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create user: ${errorText}`);
                }
                
                const userResponse = await response.json();
                
                // Then create the access code
                const accessCodeData = {
                    user_id: userResponse.id,
                    code: userData.access_code,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
                };
                
                await adminService.createAccessCode(accessCodeData);
                
                return userResponse;
            } else {
                // For non-applicant users, proceed as before
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(userData)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create user: ${errorText}`);
                }
                
                return await response.json();
            }
        } catch (error) {
            console.error('Error in createUser:', error.message, error.stack);
            throw error;
        }
    },

    // Add these functions to your adminService object

// Add these functions to your adminService object

getAccessCodes: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/access-codes.php`;
        console.log('Fetching access codes from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch access codes: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getAccessCodes:', error.message, error.stack);
        throw error;
    }
},

getAccessCodesByUser: async (userId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/access-codes.php?user_id=${userId}`;
        console.log('Fetching user access codes from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch user access codes: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getAccessCodesByUser:', error.message, error.stack);
        throw error;
    }
},

createAccessCode: async (codeData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/access-codes.php`;
        console.log('Creating access code at:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(codeData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create access code: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in createAccessCode:', error.message, error.stack);
        throw error;
    }
},

revokeAccessCode: async (codeId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/access-codes.php?id=${codeId}`;
        console.log('Revoking access code from:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to revoke access code: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in revokeAccessCode:', error.message, error.stack);
        throw error;
    }
},

validateAccessCode: async (code) => {
    try {
        const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/validate-code.php`;
        console.log('Validating access code at:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Invalid access code: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in validateAccessCode:', error.message, error.stack);
        throw error;
    }
},
    
    updateUser: async (userId, userData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php?id=${userId}`;
            console.log('Updating user from:', url);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error(`Failed to update user: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in updateUser:', error.message, error.stack);
            throw error;
        }
    },
    
    deleteUser: async (userId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php?id=${userId}`;
            console.log('Deleting user from:', url);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to delete user: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in deleteUser:', error.message, error.stack);
            throw error;
        }
    },
    
    exportUsers: async (format = 'csv') => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php?action=export&format=${format}&token=${authToken}`;
            console.log('Exporting users from:', url);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.${format}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
        } catch (error) {
            console.error('Error in exportUsers:', error.message, error.stack);
            throw error;
        }
    },
    
    // Program Management Functions
    createProgram: async (programData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php`;
            console.log('Creating program from:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(programData)
            });
            if (!response.ok) throw new Error(`Failed to create program: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in createProgram:', error.message, error.stack);
            throw error;
        }
    },
    
    updateProgram: async (programId, programData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php?id=${programId}`;
            console.log('Updating program at:', url);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(programData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update program: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error in updateProgram:', error.message, error.stack);
            throw error;
        }
    },
    
    deleteProgram: async (programId) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/programs.php?id=${programId}`;
            console.log('Deleting program from:', url);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to delete program: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in deleteProgram:', error.message, error.stack);
            throw error;
        }
    },
    
    // Quiz Management Functions
    createQuiz: async (quizData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/quizzes.php`;
            console.log('Creating quiz from:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(quizData)
            });
            if (!response.ok) throw new Error(`Failed to create quiz: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in createQuiz:', error.message, error.stack);
            throw error;
        }
    },
    
    getQuizzes: async (programId = null) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            let url = `${API_BASE_URL}/lms-forbes/backend/api/admin/quizzes.php`;
            if (programId) url += `?program_id=${programId}`;
            console.log('Fetching quizzes from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch quizzes: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in getQuizzes:', error.message, error.stack);
            throw error;
        }
    },
    
    // Applicant Export Functions
    exportApplicants: async (format = 'csv', filters = {}) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const queryParams = new URLSearchParams();
            queryParams.append('action', 'export');
            queryParams.append('format', format);
            for (const key in filters) if (filters[key]) queryParams.append(key, filters[key]);
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applications.php?${queryParams.toString()}&token=${authToken}`;
            console.log('Exporting applicants from:', url);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `applicants-export-${new Date().toISOString().slice(0, 10)}.${format}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
        } catch (error) {
            console.error('Error in exportApplicants:', error.message, error.stack);
            throw error;
        }
    },
    
    // Settings Management Functions
    getSettings: async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/settings.php`;
            console.log('Fetching settings from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch settings: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in getSettings:', error.message, error.stack);
            throw error;
        }
    },
    
    updateSettings: async (settingsData) => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) throw new Error('Authentication required. Please login again.');
            const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/settings.php`;
            console.log('Updating settings from:', url);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(settingsData)
            });
            if (!response.ok) throw new Error(`Failed to update settings: ${await response.text()}`);
            return await response.json();
        } catch (error) {
            console.error('Error in updateSettings:', error.message, error.stack);
            throw error;
        }
    },

    // Performance Incidents functions to add to your adminService object
// These are optimized to match your existing style and reuse patterns

// Add these functions to your existing adminService object:

getPerformanceIncidents: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incidents.php`;
        console.log('Fetching performance incidents from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Performance incidents received:', data);
        return data;
    } catch (error) {
        console.error('Error in getPerformanceIncidents:', error.message, error.stack);
        throw error;
    }
},

getIncidentById: async (incidentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incidents.php?id=${incidentId}`;
        console.log('Fetching incident details from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Incident details received:', data);
        
        // Add default empty arrays if not provided
        if (!data.relatedIncidents) data.relatedIncidents = [];
        if (!data.notes) data.notes = [];
        
        return data;
    } catch (error) {
        console.error(`Error in getIncidentById(${incidentId}):`, error.message, error.stack);
        throw error;
    }
},

createPerformanceIncident: async (incidentData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incidents.php`;
        console.log('Creating performance incident at:', url);
        console.log('Incident data:', incidentData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(incidentData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`Failed to create incident: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Incident creation response:', data);
        return data;
    } catch (error) {
        console.error('Error in createPerformanceIncident:', error.message, error.stack);
        throw error;
    }
},

updateIncident: async (incidentId, incidentData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incidents.php?id=${incidentId}`;
        console.log('Updating incident at:', url);
        console.log('Incident data:', incidentData);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(incidentData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`Failed to update incident: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Incident update response:', data);
        return data;
    } catch (error) {
        console.error(`Error in updateIncident(${incidentId}):`, error.message, error.stack);
        throw error;
    }
},

deleteIncident: async (incidentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incidents.php?id=${incidentId}`;
        console.log('Deleting incident from:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`Failed to delete incident: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Incident deletion response:', data);
        return data;
    } catch (error) {
        console.error(`Error in deleteIncident(${incidentId}):`, error.message, error.stack);
        throw error;
    }
},

// Special note about this function:
// For addIncidentNote, you'll need to create an incident-notes.php file to handle 
// the notes functionality, or alternatively, you can modify your incidents.php 
// to handle notes management through actions like ?action=add-note

addIncidentNote: async (noteData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Your session has expired. Please login again.');
        }
        
        // You can use this endpoint (create the corresponding PHP file)
        // Or you can modify your incidents.php to handle notes with actions
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/incident-notes.php`;
        console.log('Adding incident note at:', url);
        console.log('Note data:', noteData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(noteData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(`Failed to add note: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Note addition response:', data);
        return data;
    } catch (error) {
        console.error('Error in addIncidentNote:', error.message, error.stack);
        throw error;
    }
},

sendAccessCodeEmail: async (emailData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) throw new Error('Authentication required. Please login again.');
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/access-codes.php?action=send-email`;
        console.log('Sending access code email from:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`Failed to send access code email: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in sendAccessCodeEmail:', error.message, error.stack);
        throw error;
    }
},

// This is an extension of your existing getUserList function to support filtering
// You can keep both functions or replace getUserList with this more versatile version
getFilteredUsers: async (filters = {}) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        for (const key in filters) {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        }
        
        const queryString = queryParams.toString() ? '?' + queryParams.toString() : '';
        const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/users.php${queryString}`;
        console.log('Fetching filtered users from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error details:', errorText);
            throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error('Error in getFilteredUsers:', error.message, error.stack);
        throw error;
    }
},
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginTime');
        try {
            fetch(`${API_BASE_URL}/lms-forbes/backend/api/auth/logout.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.error('Logout API error:', err.message));
        } catch (error) {
            console.error('Error during logout:', error.message);
        }
    }
};

export default adminService;