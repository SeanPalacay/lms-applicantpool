import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data when component mounts
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('full_name');

    if (token && role) {
      setCurrentUser({
        token,
        role,
        fullName: fullName || 'User'
      });
    }

    setLoading(false);
  }, []);

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('full_name');
    setCurrentUser(null);
  };

  // Login function
  const login = (userData) => {
    const { token, role, full_name } = userData;
    
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('full_name', full_name || 'User');
    
    setCurrentUser({
      token,
      role,
      fullName: full_name || 'User'
    });
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    userRole: currentUser?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;