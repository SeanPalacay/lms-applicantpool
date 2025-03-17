import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, Download, Search, Filter, Calendar, Eye, 
  Printer, Share2, AlertTriangle, RefreshCw
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No token found. Please log in again.');
        
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

  const getFilteredCertificates = () => {
    let filtered = [...certificates];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(cert => 
        cert.description.toLowerCase().includes(lowerQuery) ||
        cert.program_title.toLowerCase().includes(lowerQuery)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => cert.status === filterStatus);
    }
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.program_title.localeCompare(b.program_title));
    }
    return filtered;
  };

  const downloadCertificate = async (certificateId, filename) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No token found. Please log in again.');
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificate_download.php?id=${certificateId}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      
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

  const printCertificate = (certificateId) => {
    try {
      window.open(`/trainee/certificate-print/${certificateId}`, '_blank');
    } catch (err) {
      console.error('Error printing certificate:', err);
      alert('Failed to open print view. Please try again.');
    }
  };

  const shareCertificate = async (certificateId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No token found. Please log in again.');
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificate_share.php`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ certificate_id: certificateId })
      });
      
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      
      const data = await response.json();
      navigator.clipboard.writeText(data.shareLink)
        .then(() => alert('Share link copied to clipboard. The link will expire in 7 days.'))
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          alert(`Share link: ${data.shareLink}\n\nThe link will expire in 7 days.`);
        });
    } catch (err) {
      console.error('Error sharing certificate:', err);
      alert('Failed to generate share link. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setSortBy('recent');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: '15px' 
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #007bff', 
          borderTop: '4px solid transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Loading certificates...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: '15px', 
        textAlign: 'center' 
      }}>
        <AlertTriangle size={48} style={{ color: '#dc3545' }} />
        <h2 style={{ fontSize: '24px', margin: 0 }}>Error</h2>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const filteredCertificates = getFilteredCertificates();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={24} /> Certificates
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>View and download your earned certificates</p>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '15px', 
        marginBottom: '20px', 
        alignItems: 'center' 
      }}>
        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 10px 10px 35px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              fontSize: '14px' 
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                fontSize: '18px', 
                cursor: 'pointer', 
                color: '#666' 
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
            <Filter size={16} /> <span>Filter:</span>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['all', 'active', 'expired'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{ 
                  padding: '6px 12px', 
                  background: filterStatus === status ? '#007bff' : '#f8f9fa', 
                  color: filterStatus === status ? 'white' : '#666', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontSize: '14px' 
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="sort-select" style={{ fontSize: '14px', color: '#666' }}>Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              fontSize: '14px', 
              background: '#fff' 
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        <button 
          onClick={resetFilters}
          style={{ 
            padding: '6px 12px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            fontSize: '14px' 
          }}
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {filteredCertificates.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px', 
          textAlign: 'center' 
        }}>
          <Award size={48} style={{ color: '#666', marginBottom: '15px' }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>No certificates found</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 15px 0' }}>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'You have not earned any certificates yet. Complete programs to earn certificates.'}
          </p>
          {(searchQuery || filterStatus !== 'all') && (
            <button 
              onClick={resetFilters}
              style={{ 
                padding: '10px 20px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredCertificates.map(certificate => (
            <div 
              key={certificate.id} 
              style={{ 
                background: '#fff', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                padding: '15px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px' 
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                borderBottom: '1px solid #eee', 
                paddingBottom: '10px' 
              }}>
                <Award size={48} style={{ color: '#007bff' }} />
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{certificate.program_title}</span>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#666' }}>{certificate.description}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <Calendar size={14} /> 
                    <span>Issued: {new Date(certificate.created_at).toLocaleDateString()}</span>
                  </div>
                  {certificate.expiry_date && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      color: new Date(certificate.expiry_date) < new Date() ? '#dc3545' : '#666' 
                    }}>
                      <Calendar size={14} /> 
                      <span>
                        {new Date(certificate.expiry_date) < new Date() ? 'Expired: ' : 'Expires: '}
                        {new Date(certificate.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Link 
                  to={`/trainee/certificates/${certificate.id}`}
                  style={{ 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    borderRadius: '4px', 
                    color: '#007bff', 
                    textDecoration: 'none' 
                  }}
                  title="View Certificate"
                >
                  <Eye size={18} />
                </Link>
                <button 
                  onClick={() => downloadCertificate(certificate.id, `${certificate.description}.pdf`)}
                  style={{ 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    color: '#007bff' 
                  }}
                  title="Download Certificate"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => printCertificate(certificate.id)}
                  style={{ 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    color: '#007bff' 
                  }}
                  title="Print Certificate"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => shareCertificate(certificate.id)}
                  style={{ 
                    padding: '8px', 
                    background: '#f8f9fa', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    color: '#007bff' 
                  }}
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