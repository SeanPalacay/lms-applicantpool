import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Award, Download, Printer, AlertTriangle,
  Calendar, RefreshCw, LockIcon, CheckCircle
} from 'lucide-react';
import './styles/CertificateShare.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CertificateShare = () => {
  const { token } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipient, setRecipient] = useState('');
  
  // Fetch shared certificate details
  useEffect(() => {
    const fetchSharedCertificate = async () => {
      try {
        setLoading(true);
        
        // Verify share token and get certificate details
        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/public/shared_certificate.php?token=${token}`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        setCertificate(data.certificate);
        setRecipient(data.recipient);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared certificate:', err);
        setError('This share link is invalid or has expired.');
        setLoading(false);
      }
    };

    fetchSharedCertificate();
  }, [token]);
  
  // Print certificate
  const printCertificate = () => {
    window.print();
  };
  
  // Download certificate
  const downloadCertificate = async () => {
    try {
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/public/download_shared_certificate.php?token=${token}`;
      const response = await fetch(endpoint, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
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
  
  // Verify certificate
  const verifyCertificate = () => {
    return certificate && !isExpired;
  };
  
  if (loading) {
    return (
      <div className="certificate-share-loading">
        <div className="spinner"></div>
        <p>Loading shared certificate...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="certificate-share-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Invalid Share Link</h2>
        <p>{error}</p>
        <div className="error-info">
          <LockIcon size={16} />
          <span>Share links expire after 7 days for security reasons.</span>
        </div>
      </div>
    );
  }
  
  // Check if certificate is expired
  const isExpired = certificate.expiry_date && new Date(certificate.expiry_date) < new Date();
  const isVerified = verifyCertificate();
  
  return (
    <div className="certificate-share-container">
      <div className="certificate-share-header">
        <h1>Shared Certificate</h1>
        <div className="verification-badge">
          {isVerified ? (
            <div className="verified">
              <CheckCircle size={18} />
              <span>Verified</span>
            </div>
          ) : (
            <div className="not-verified">
              <AlertTriangle size={18} />
              <span>Not Verified</span>
            </div>
          )}
        </div>
      </div>
      
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
      </div>
      
      <div className="certificate-meta-info">
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
      
      <div className="certificate-preview-container">
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
            <h2 className="certificate-recipient">{recipient}</h2>
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

export default CertificateShare;