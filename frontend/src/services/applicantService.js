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
        // Applicant Pools functions
        getDashboardData: async () => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                // This path should match where your PHP dashboard file is located
                const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/dashboard.php`;
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
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error in getDashboardData:', error);
                throw error;
            }
        },

        getPrograms: async () => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/programs.php`;
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
                    throw new Error(`Failed to fetch programs: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error in getPrograms:', error);
                throw error;
            }
        },


        // Applicant Pools functions
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
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(poolData)
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
                    body: JSON.stringify(poolData)
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
        
        // Applications functions
        getApplications: async (filters = {}) => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                // Update this to point to your actual applications API
                // Since your API doesn't support direct application listing in the way we want,
                // We'll create a custom URL for the admin page
                const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applications.php`;
                console.log('Fetching applications from:', url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                // Check for response errors
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error details:', errorText);
                    throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
                }
                
                // Assume we'll implement a placeholder empty array for now
                // We'll need to implement this on the backend properly
                return []; // Temporarily return empty array until backend is updated
            } catch (error) {
                console.error('Error in getApplications:', error);
                throw error;
            }
        },
        
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
        
        getApplicantDetails: async (poolId, applicantId) => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/applicant-pool-assignments.php?id=${applicantId}&pool_id=${poolId}&details=true`;
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
                console.log('Received applicant details:', data); // Log the data for inspection
        
                // Create a placeholder if needed - this helps for development
                if (!data || Object.keys(data).length === 0) {
                    console.warn('Empty data received from API, using placeholder data');
                    return {
                        id: applicantId,
                        pool_id: poolId,
                        application_id: '1',
                        user_id: '4',  
                        full_name: 'Test Applicant',
                        email: 'test@example.com',
                        job_role: 'Loan Officer',
                        department: 'Operations',
                        status: 'pending',
                        applied_at: new Date().toISOString(),
                        program: {
                            title: 'Loan Officer Basics',
                            type: 'regular'
                        },
                        documents: [],
                        notes: []
                    };
                }
                
                return data;
            } catch (error) {
                console.error('Error in getApplicantDetails:', error);
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

        getApplicationDocuments: async (applicationId) => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
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
        
        /**
 * Fetch user documents
 * 
 * @returns {Promise<Array>} Array of document objects
 */
getUserDocuments: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/user-documents.php`;
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
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getUserDocuments:', error);
        throw error;
    }
},

/**
 * Upload a document
 * 
 * @param {FormData} formData - Form data containing the file and metadata
 * @param {Function} progressCallback - Callback function for upload progress updates
 * @returns {Promise<Object>} The uploaded document object
 */
uploadDocument: async (formData, progressCallback = null) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        formData.append('token', authToken); // Add token to FormData for backend verification
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/upload-document.php`;
        console.log('Uploading document to:', url);
        
        // Use XMLHttpRequest to track upload progress
        const xhr = new XMLHttpRequest();
        const promise = new Promise((resolve, reject) => {
            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`HTTP error: ${xhr.status} - ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            
            if (progressCallback) {
                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        progressCallback(percentComplete);
                    }
                };
            }
        });
        
        xhr.send(formData);
        return await promise;
    } catch (error) {
        console.error('Error in uploadDocument:', error);
        throw error;
    }
},

/**
 * Delete a document
 * 
 * @param {number|string} documentId - The ID of the document to delete
 * @returns {Promise<Object>} Response with success/error message
 */
deleteDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/user-documents.php?id=${documentId}&action=delete`;
        console.log('Deleting document from:', url);
        
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
            throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in deleteDocument:', error);
        throw error;
    }
},

/**
 * View a document (open in new tab)
 * 
 * @param {number|string} documentId - The ID of the document to view
 * @returns {Promise<void>}
 */
viewDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/user-documents.php?id=${documentId}&action=view&token=${authToken}`;
        console.log('Viewing document from:', url);
        
        // Open the document in a new tab
        window.open(url, '_blank');
        
        return { success: true };
    } catch (error) {
        console.error('Error in viewDocument:', error);
        throw error;
    }
},

/**
 * Download a document
 * 
 * @param {number|string} documentId - The ID of the document to download
 * @returns {Promise<Object>} Response with success/error message
 */
downloadDocument: async (documentId) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/user-documents.php?id=${documentId}&action=download&token=${authToken}`;
        console.log('Downloading document from:', url);
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', ''); // The server will set the filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error('Error in downloadDocument:', error);
        throw error;
    }
},

/**
 * Get user profile information
 * 
 * @returns {Promise<Object>} User profile data
 */
getUserProfile: async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/profile.php`;
        console.log('Fetching user profile from:', url);
        
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
            throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        throw error;
    }
},

/**
 * Update user profile
 * 
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated user profile
 */
updateUserProfile: async (profileData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/profile.php`;
        console.log('Updating user profile at:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error details:', errorText);
            throw new Error(`Failed to update user profile: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        throw error;
    }
},

/**
 * Change user password
 * 
 * @param {Object} passwordData - Password data including current and new password
 * @returns {Promise<Object>} Success response
 */
changePassword: async (passwordData) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/change-password.php`;
        console.log('Changing password at:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(passwordData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error details:', errorText);
            
            // Check for specific error conditions
            if (response.status === 401) {
                throw new Error('Current password is incorrect');
            }
            
            throw new Error(`Failed to change password: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in changePassword:', error);
        throw error;
    }
},

/**
 * Get user activity
 * 
 * @param {number} limit - Optional limit for number of activities to return
 * @returns {Promise<Array>} Array of activity objects
 */
getUserActivity: async (limit = 10) => {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            console.error('No authToken found in localStorage');
            throw new Error('Authentication required. Please login again.');
        }
        
        const url = `${API_BASE_URL}/lms-forbes/backend/api/applicant/user-activity.php?limit=${limit}`;
        console.log('Fetching user activity from:', url);
        
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
            throw new Error(`Failed to fetch user activity: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getUserActivity:', error);
        throw error;
    }
},
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
        
        // Pool assignment functions
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
        
        // Document handling (placeholder - you'll need to implement this properly)
        downloadDocument: async (documentId) => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/records.php?id=${documentId}&action=download&token=${authToken}`;
                console.log('Downloading document from:', url);
                
                // Create a link and trigger download
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', ''); // The server will set the filename
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                return { success: true };
            } catch (error) {
                console.error('Error in downloadDocument:', error);
                throw error;
            }
        },
        
        // Notes functions (placeholder - you'll need to implement this properly)
        addApplicantNote: async (applicantId, noteContent) => {
            try {
                const authToken = localStorage.getItem('authToken');
                
                if (!authToken) {
                    console.error('No authToken found in localStorage');
                    throw new Error('Authentication required. Please login again.');
                }
                
                // This is a placeholder. You'll need to implement the appropriate API endpoint
                const url = `${API_BASE_URL}/lms-forbes/backend/api/admin/notes.php`;
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
                
                // Return a dummy response for now
                return {
                    success: true,
                    note: {
                        id: Date.now(),
                        content: noteContent,
                        created_at: new Date().toISOString(),
                        author_name: localStorage.getItem('userName') || 'User'
                    }
                };
            } catch (error) {
                console.error('Error in addApplicantNote:', error);
                throw error;
            }
        }
    };

    export default applicantService;