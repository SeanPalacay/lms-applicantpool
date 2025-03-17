import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Award, Download, Printer, AlertTriangle,
  Calendar, LockIcon, CheckCircle
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CertificateShare = () => {
  const { token } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    const fetchSharedCertificate = async () => {
      try {
        setLoading(true);
        const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/public/shared_certificate.php?token=${token}`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
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

  const printCertificate = () => {
    window.print();
  };

  const downloadCertificate = async () => {
    try {
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/public/download_shared_certificate.php?token=${token}`;
      const response = await fetch(endpoint, { method: 'GET' });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

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

  const verifyCertificate = () => certificate && (!certificate.expiry_date || new Date(certificate.expiry_date) >= new Date());

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
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Loading shared certificate...</p>
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
        <h2 style={{ fontSize: '24px', margin: 0, color: '#333' }}>Invalid Share Link</h2>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>{error}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '14px' }}>
          <LockIcon size={16} />
          <span>Share links expire after 7 days for security reasons.</span>
        </div>
      </div>
    );
  }

  const isExpired = certificate.expiry_date && new Date(certificate.expiry_date) < new Date();
  const isVerified = verifyCertificate();

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '15px' 
      }}>
        <h1 style={{ fontSize: '24px', margin: 0, color: '#333' }}>Shared Certificate</h1>
        <div style={{ 
          padding: '6px 12px', 
          borderRadius: '4px', 
          background: isVerified ? '#d4edda' : '#f8d7da', 
          color: isVerified ? '#155724' : '#721c24', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          {isVerified ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{isVerified ? 'Verified' : 'Not Verified'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={downloadCertificate}
          style={{ 
            padding: '10px 15px', 
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
          <Download size={16} /> Download
        </button>
        <button 
          onClick={printCertificate}
          style={{ 
            padding: '10px 15px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}
        >
          <Printer size={16} /> Print
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '15px', 
        marginBottom: '20px', 
        fontSize: '14px', 
        color: '#666' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={16} /> 
          <span>Issued: {new Date(certificate.created_at).toLocaleDateString()}</span>
        </div>
        {certificate.expiry_date && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            color: isExpired ? '#dc3545' : '#666' 
          }}>
            <Calendar size={16} /> 
            <span>{isExpired ? 'Expired: ' : 'Expires: '}{new Date(certificate.expiry_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        padding: '20px', 
        position: 'relative' 
      }}>
        <div style={{ 
          border: '2px solid #007bff', 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '4px', 
          position: 'relative' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px', 
            flexWrap: 'wrap', 
            gap: '15px' 
          }}>
            <img 
              src="/assets/images/logocolor.png" 
              alt="Company Logo" 
              style={{ maxWidth: '150px', height: 'auto' }} 
            />
            <h1 style={{ 
              fontSize: '24px', 
              color: '#007bff', 
              fontWeight: 'bold', 
              margin: 0, 
              textAlign: 'right' 
            }}>
              Certificate of Completion
            </h1>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ margin: '20px 0' }}>
              <Award size={80} style={{ color: '#007bff' }} />
            </div>
            <p style={{ fontSize: '16px', color: '#666', margin: '10px 0' }}>This is to certify that</p>
            <h2 style={{ fontSize: '28px', color: '#333', margin: '10px 0', fontWeight: 'bold' }}>{recipient}</h2>
            <p style={{ fontSize: '16px', color: '#666', margin: '10px 0' }}>has successfully completed</p>
            <h3 style={{ fontSize: '20px', color: '#007bff', margin: '10px 0' }}>{certificate.program_title}</h3>
            <div style={{ 
              maxWidth: '500px', 
              margin: '20px auto', 
              fontSize: '14px', 
              color: '#666' 
            }}>
              <p>{certificate.description}</p>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Issued on {new Date(certificate.created_at).toLocaleDateString()}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '40px', 
            flexWrap: 'wrap', 
            gap: '20px' 
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: '150px', height: '1px', background: '#007bff', margin: '0 auto 5px' }}></div>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Training Director</p>
            </div>
            <div style={{ 
              textAlign: 'center', 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center' 
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                border: '2px solid #007bff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Award size={40} style={{ color: '#007bff' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: '150px', height: '1px', background: '#007bff', margin: '0 auto 5px' }}></div>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Program Instructor</p>
            </div>
          </div>

          {isExpired && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%) rotate(-45deg)', 
              fontSize: '48px', 
              color: '#dc3545', 
              opacity: 0.3, 
              fontWeight: 'bold', 
              pointerEvents: 'none' 
            }}>
              EXPIRED
            </div>
          )}

          <div style={{ 
            position: 'absolute', 
            bottom: '10px', 
            right: '10px', 
            fontSize: '12px', 
            color: '#666' 
          }}>
            Certificate ID: {certificate.id}
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        textAlign: 'center' 
      }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#333' }}>Verify this Certificate</h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          To verify the authenticity of this certificate, please visit{' '}
          <strong>verify.example.com</strong> and enter the Certificate ID:{' '}
          <strong>{certificate.id}</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificateShare;