import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, Download, Search, Filter, Calendar, Eye, 
  Printer, Share2, AlertTriangle, RefreshCw
} from 'lucide-react';
import './styles/Certificates.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No token found. Please log in again.');
        }
        
        // Get certificates using fetch
        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificates.php`;
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
        setCertificates(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err.message || 'Failed to load certificates. Please try again later.');
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);
  
  // Get filtered certificates
  const getFilteredCertificates = () => {
    let filtered = [...certificates];
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(cert => 
        cert.description.toLowerCase().includes(lowerQuery) ||
        cert.program_title.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => cert.status === filterStatus);
    }
    
    // Sort certificates
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filtered = filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'alphabetical') {
      filtered = filtered.sort((a, b) => a.program_title.localeCompare(b.program_title));
    }
    
    return filtered;
  };
  
  // Download certificate
  const downloadCertificate = async (certificateId, filename) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificate_download.php?id=${certificateId}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate. Please try again.');
    }
  };
  
  // Print certificate
  const printCertificate = async (certificateId) => {
    try {
      // Redirect to print view
      window.open(`/trainee/certificate-print/${certificateId}`, '_blank');
    } catch (err) {
      console.error('Error printing certificate:', err);
      alert('Failed to open print view. Please try again.');
    }
  };
  
  // Share certificate
  const shareCertificate = async (certificateId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificate_share.php`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ certificate_id: certificateId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Copy link to clipboard
      navigator.clipboard.writeText(data.shareLink)
        .then(() => {
          alert('Share link copied to clipboard. The link will expire in 7 days.');
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          alert(`Share link: ${data.shareLink}\n\nThe link will expire in 7 days.`);
        });
    } catch (err) {
      console.error('Error sharing certificate:', err);
      alert('Failed to generate share link. Please try again.');
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setSortBy('recent');
  };
  
  if (loading) {
    return (
      <div className="certificates-loading">
        <div className="spinner"></div>
        <p>Loading certificates...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="certificates-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  const filteredCertificates = getFilteredCertificates();
  
  return (
    <div className="certificates-container">
      <div className="certificates-header">
        <div className="header-title">
          <h1><Award size={24} /> Certificates</h1>
          <p>View and download your earned certificates</p>
        </div>
      </div>
      
      <div className="certificates-filters">
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div className="filter-group">
          <div className="filter-label">
            <Filter size={16} />
            <span>Filter:</span>
          </div>
          
          <div className="filter-options">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`}
              onClick={() => setFilterStatus('expired')}
            >
              Expired
            </button>
          </div>
        </div>
        
        <div className="sort-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        
        <button 
          className="btn-secondary reset-filters" 
          onClick={resetFilters}
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
      
      {filteredCertificates.length === 0 ? (
        <div className="no-certificates">
          <Award size={48} className="no-data-icon" />
          <h3>No certificates found</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'You have not earned any certificates yet. Complete programs to earn certificates.'}
          </p>
          {(searchQuery || filterStatus !== 'all') && (
            <button 
              className="btn-primary"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="certificates-grid">
          {filteredCertificates.map(certificate => (
            <div key={certificate.id} className="certificate-card">
              <div className="certificate-preview">
                <Award size={48} className="certificate-icon" />
                <span className="certificate-program">{certificate.program_title}</span>
              </div>
              
              <div className="certificate-details">
                <h3 className="certificate-title">{certificate.description}</h3>
                
                <div className="certificate-meta">
                  <div className="meta-item issue-date">
                    <Calendar size={14} />
                    <span>Issued: {new Date(certificate.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {certificate.expiry_date && (
                    <div className={`meta-item expiry-date ${new Date(certificate.expiry_date) < new Date() ? 'expired' : ''}`}>
                      <Calendar size={14} />
                      <span>
                        {new Date(certificate.expiry_date) < new Date() 
                          ? 'Expired: ' 
                          : 'Expires: '
                        }
                        {new Date(certificate.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="certificate-actions">
                <Link 
                  to={`/trainee/certificates/${certificate.id}`}
                  className="btn-icon"
                  title="View Certificate"
                >
                  <Eye size={18} />
                </Link>
                
                <button 
                  className="btn-icon"
                  onClick={() => downloadCertificate(certificate.id, `${certificate.description}.pdf`)}
                  title="Download Certificate"
                >
                  <Download size={18} />
                </button>
                
                <button 
                  className="btn-icon"
                  onClick={() => printCertificate(certificate.id)}
                  title="Print Certificate"
                >
                  <Printer size={18} />
                </button>
                
                <button 
                  className="btn-icon"
                  onClick={() => shareCertificate(certificate.id)}
                  title="Share Certificate"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;