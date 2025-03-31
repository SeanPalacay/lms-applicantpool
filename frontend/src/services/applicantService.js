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

const applicantService = {
// Applicant Dashboard Data
getDashboardData: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Added userId as a query parameter
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/dashboard.php?userId=${userId}`;
        console.log('Fetching dashboard data from:', url);
        
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
            throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getDashboardData:', error.message, error.stack);
        throw error;
    }
},

// Applicant Pools functions for admin
getApplicantPools: async () => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pools.php`;
    console.log('Fetching applicant pools from:', url);
    
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
        throw new Error(`Failed to fetch applicant pools: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getApplicantPools:', error);
    throw error;
}
},

getApplicantPoolById: async (poolId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pools.php?id=${poolId}`;
    console.log('Fetching applicant pool from:', url);
    
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
        throw new Error(`Failed to fetch applicant pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getApplicantPoolById:', error);
    throw error;
}
},

createApplicantPool: async (poolData) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pools.php`;
    console.log('Creating applicant pool at:', url);
    console.log('Pool data:', poolData);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            pool_name: poolData.pool_name,
            description: poolData.description,
            department: poolData.department,
            positions: poolData.positions
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to create applicant pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in createApplicantPool:', error);
    throw error;
}
},

updateApplicantPool: async (poolId, poolData) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pools.php?id=${poolId}`;
    console.log('Updating applicant pool at:', url);
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            pool_name: poolData.pool_name,
            description: poolData.description,
            department: poolData.department,
            positions: poolData.positions
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to update applicant pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in updateApplicantPool:', error);
    throw error;
}
},

deleteApplicantPool: async (poolId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pools.php?id=${poolId}`;
    console.log('Deleting applicant pool at:', url);
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to delete applicant pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in deleteApplicantPool:', error);
    throw error;
}
},

// Department and Position functions
getDepartments: async () => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/departments.php`;
    console.log('Fetching departments from:', url);
    
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
        throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getDepartments:', error);
    throw error;
}
},

getPositionsByDepartment: async (department) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/positions.php?department=${encodeURIComponent(department)}`;
    console.log('Fetching positions from:', url);
    
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
        throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getPositionsByDepartment:', error);
    throw error;
}
},

// Pool assignments for admin
getApplicantsByPool: async (poolId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pool-assignments.php?pool_id=${poolId}`;
    console.log('Fetching applicants for pool from:', url);
    
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
        throw new Error(`Failed to fetch applicants for pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getApplicantsByPool:', error);
    throw error;
}
},

// NEW METHOD: Get details of a specific applicant in a pool
getApplicantDetails: async (poolId, applicantId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-details.php?pool_id=${poolId}&applicant_id=${applicantId}`;
    console.log('Fetching applicant details from:', url);
    
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
        throw new Error(`Failed to fetch applicant details: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getApplicantDetails:', error);
    throw error;
}
},

assignApplicantToPool: async (applicationId, poolId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pool-assignments.php`;
    console.log('Assigning applicant to pool at:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            application_id: applicationId,
            pool_id: poolId
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to assign applicant to pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in assignApplicantToPool:', error);
    throw error;
}
},

removeApplicantFromPool: async (assignmentId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pool-assignments.php?id=${assignmentId}`;
    console.log('Removing applicant from pool at:', url);
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to remove applicant from pool: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in removeApplicantFromPool:', error);
    throw error;
}
},

// Application status management
updateApplicationStatus: async (applicationId, status) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applications.php?id=${applicationId}`;
    console.log('Updating application status at:', url);
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to update application status: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    throw error;
}
},


// NEW METHOD: Add a note about an applicant
addApplicantNote: async (applicantId, noteContent) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-notes.php`;
    console.log('Adding applicant note at:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            applicant_id: applicantId,
            content: noteContent
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to add applicant note: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in addApplicantNote:', error);
    throw error;
}
},

getApplicationDocuments: async (applicationId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // First, we need to get the user ID from the application
        // This endpoint would need to be implemented on the backend
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php?application_id=${applicationId}`;
        console.log('Fetching application documents from:', url);
        
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
            throw new Error(`Failed to fetch application documents: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getApplicationDocuments:', error);
        throw error;
    }
},

// General applications functions 
getApplications: async (filters = {}) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    let url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applications.php`;
    
    // Add query parameters for filters
    if (Object.keys(filters).length > 0) {
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.department) params.append('department', filters.department);
        if (filters.search) params.append('search', filters.search);
        
        url += `?${params.toString()}`;
    }
    
    console.log('Fetching applications from:', url);
    
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
        throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getApplications:', error);
    throw error;
}
},

getJobRoles: async () => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/job-roles.php`;
    console.log('Fetching job roles from:', url);
    
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
        throw new Error(`Failed to fetch job roles: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getJobRoles:', error);
    throw error;
}
},

// Applicant-specific pool functions
// In applicantService.js
getUserAppliedPools: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            console.error('No authToken or userId found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Use the correct endpoint with type=my-pools parameter
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/pools.php?type=my-pools&user_id=${userId}`;
        console.log('Fetching user applied pools from:', url);
        
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
            throw new Error(`Failed to fetch user applied pools: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getUserAppliedPools:', error.message, error.stack);
        throw error;
    }
},

// For getAvailablePools
getAvailablePools: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            console.error('No authToken or userId found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Use the same pools.php endpoint but without the type parameter
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/pools.php?user_id=${userId}`;
        console.log('Fetching available pools from:', url);
        
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
            throw new Error(`Failed to fetch available pools: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getAvailablePools:', error.message, error.stack);
        throw error;
    }
},


applyToPool: async (poolId, data = {}) => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            console.error('No authToken or userId found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Use the pools.php endpoint for POST requests
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/pools.php?user_id=${userId}`;
        console.log('Applying to pool at:', url);
        
        const postData = {
            pool_id: poolId,
            ...data
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error details:', errorText);
            throw new Error(`Failed to apply to pool: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in applyToPool:', error.message, error.stack);
        throw error;
    }
},


// Get all documents for the current user
// In applicantService.js
getUserDocuments: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            console.error('No authToken or userId found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        // Add userId as a query parameter
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php?user_id=${userId}`;
        console.log('Fetching user documents from:', url);
        
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
            throw new Error(`Failed to fetch user documents: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in getUserDocuments:', error.message, error.stack);
        throw error;
    }
},

uploadDocument: async (formData, progressCallback) => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            throw new Error('Authentication required. Please login again.');
        }
        
        // Add userId to the formData
        formData.append('user_id', userId);
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php`;
        console.log('Uploading document to:', url);
        
        const xhr = new XMLHttpRequest();
        
        // Setup progress tracking
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && progressCallback) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressCallback(percentComplete);
            }
        };
        
        // Return a promise for the upload
        return new Promise((resolve, reject) => {
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            
            xhr.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        const response = JSON.parse(this.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${this.status} ${this.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error during upload'));
            };
            
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Error in uploadDocument:', error.message, error.stack);
        throw error;
    }
},

viewDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php?id=${documentId}&action=view&user_id=${userId}`;
        console.log('Viewing document at:', url);
        
        window.open(url, '_blank');
        return true;
    } catch (error) {
        console.error('Error in viewDocument:', error.message, error.stack);
        throw error;
    }
},

downloadDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php?id=${documentId}&action=download&user_id=${userId}&token=${authToken}`;
        console.log('Downloading document from:', url);
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error('Error in downloadDocument:', error.message, error.stack);
        throw error;
    }
},

deleteDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        
        if (!authToken || !userId) {
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/documents.php?id=${documentId}&user_id=${userId}`;
        console.log('Deleting document at:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error details:', errorText);
            throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in deleteDocument:', error.message, error.stack);
        throw error;
    }
},
withdrawApplication: async (assignmentId) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/pools.php?assignment_id=${assignmentId}`;
    console.log('Withdrawing application from:', url);
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to withdraw application: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in withdrawApplication:', error);
    throw error;
}
},

// Applications management (applicant side)
getUserApplications: async () => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/applications.php`;
    console.log('Fetching user applications from:', url);
    
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
        throw new Error(`Failed to fetch user applications: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in getUserApplications:', error);
    throw error;
}
},

submitApplication: async (applicationData) => {
try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No authToken found in localStorage');
        throw new Error('Authentication required. Please login again.');
    }
    
    const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/applications.php`;
    console.log('Submitting application to:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(applicationData)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error details:', errorText);
        throw new Error(`Failed to submit application: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Error in submitApplication:', error);
    throw error;
}
}
};

export default applicantService;