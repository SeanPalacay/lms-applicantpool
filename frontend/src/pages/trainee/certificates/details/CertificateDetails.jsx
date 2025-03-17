import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, Download, Printer, Share2, ArrowLeft, 
  AlertTriangle, Calendar, Check, BookOpen
} from 'lucide-react';
import '../styles/CertificateDetails.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CertificateDetails = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const certificateRef = useRef(null);
  
  // Fetch certificate details
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No token found. Please log in again.');
        }
        
        // Get certificate details
        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/certificate_details.php?id=${certificateId}`;
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
        
        // Verify this is a certificate record
        if (data.record_type !== 'training' || data.category !== 'certificate') {
          throw new Error('Invalid certificate record');
        }
        
        setCertificate(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.message || 'Failed to load certificate. Please try again later.');
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);
  
  // Generate share link
  const generateShareLink = async () => {
    try {
      setSharing(true);
      
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
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setShareLink(data.shareLink);
      setSharing(false);
    } catch (err) {
      console.error('Error generating share link:', err);
      alert('Failed to generate share link. Please try again.');
      setSharing(false);
    }
  };
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        alert('Failed to copy link to clipboard. Please copy it manually.');
      });
  };
  
  // Download certificate
  const downloadCertificate = async () => {
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
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.description}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate. Please try again.');
    }
  };
  
  // Print certificate
  const printCertificate = () => {
    // Open the certificate print view in a new window
    window.open(`/trainee/certificate-print/${certificateId}`, '_blank');
  };
  
  if (loading) {
    return (
      <div className="certificate-details-loading">
        <div className="spinner"></div>
        <p>Loading certificate...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="certificate-details-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/trainee/certificates')} 
          className="btn-primary back-btn"
        >
          <ArrowLeft size={16} />
          Back to Certificates
        </button>
      </div>
    );
  }
  
  // Check if certificate is expired
  const isExpired = certificate.expiry_date && new Date(certificate.expiry_date) < new Date();
  
  return (
    <div className="certificate-details-container">
      <div className="certificate-actions-bar">
        <button 
          className="btn-secondary back-btn"
          onClick={() => navigate('/trainee/certificates')}
        >
          <ArrowLeft size={16} />
          Back to Certificates
        </button>
        
        <div className="certificate-actions">
          <button 
            className="btn-primary"
            onClick={downloadCertificate}
          >
            <Download size={16} />
            Download
          </button>
          
          <button 
            className="btn-secondary"
            onClick={printCertificate}
          >
            <Printer size={16} />
            Print
          </button>
          
          <button 
            className="btn-secondary"
            onClick={generateShareLink}
            disabled={sharing}
          >
            <Share2 size={16} />
            {sharing ? 'Generating...' : 'Share'}
          </button>
        </div>
      </div>
      
      {shareLink && (
        <div className="share-link-container">
          <div className="share-link-box">
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              className="share-link-input"
            />
            <button 
              className="copy-link-btn"
              onClick={copyShareLink}
            >
              {linkCopied ? <Check size={16} /> : 'Copy'}
            </button>
          </div>
          <p className="share-link-info">
            This link will expire in 7 days. Anyone with this link can view your certificate.
          </p>
        </div>
      )}
      
      <div className="certificate-meta-info">
        <div className="meta-item">
          <BookOpen size={16} />
          <span>Program: {certificate.program_title}</span>
        </div>
        
        <div className="meta-item">
          <Calendar size={16} />
          <span>Issued: {new Date(certificate.created_at).toLocaleDateString()}</span>
        </div>
        
        {certificate.expiry_date && (
          <div className={`meta-item ${isExpired ? 'expired' : ''}`}>
            <Calendar size={16} />
            <span>
              {isExpired ? 'Expired: ' : 'Expires: '}
              {new Date(certificate.expiry_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      
      <div className="certificate-preview-container" ref={certificateRef}>
        <div className="certificate-document">
          <div className="certificate-header">
            <img src="/assets/images/logocolor.png" alt="Company Logo" className="logo" />
            <h1 className="certificate-title">Certificate of Completion</h1>
          </div>
          
          <div className="certificate-body">
            <div className="certificate-award-icon">
              <Award size={80} />
            </div>
            
            <p className="certificate-text">This is to certify that</p>
            <h2 className="certificate-recipient">{localStorage.getItem('userName') || 'Trainee'}</h2>
            <p className="certificate-text">has successfully completed</p>
            <h3 className="certificate-program">{certificate.program_title}</h3>
            
            <div className="certificate-description">
              <p>{certificate.description}</p>
            </div>
            
            <div className="certificate-date">
              Issued on {new Date(certificate.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="certificate-footer">
            <div className="certificate-signature">
              <div className="signature-line"></div>
              <p className="signature-name">Training Director</p>
            </div>
            
            <div className="certificate-seal">
              <div className="seal-circle">
                <Award size={40} />
              </div>
            </div>
            
            <div className="certificate-signature">
              <div className="signature-line"></div>
              <p className="signature-name">Program Instructor</p>
            </div>
          </div>
          
          {isExpired && (
            <div className="expired-watermark">EXPIRED</div>
          )}
          
          <div className="certificate-id">
            Certificate ID: {certificate.id}
          </div>
        </div>
      </div>
      
      <div className="certificate-verification">
        <h3>Verify this Certificate</h3>
        <p>
          To verify the authenticity of this certificate, please visit <strong>verify.example.com</strong> and enter the Certificate ID: <strong>{certificate.id}</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificateDetails;