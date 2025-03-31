import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CertificatePrint = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No token found. Please log in again.');

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
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data.record_type !== 'training' || data.category !== 'certificate') {
          throw new Error('Invalid certificate record');
        }

        setCertificate(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.message || 'Failed to load certificate data');
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  useEffect(() => {
    if (!certificate || !iframeRef.current) return;

    const userName = localStorage.getItem('userName') || 'Trainee';
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const iframeContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate Print</title>
        <style>
          @media print {
            @page { size: landscape; margin: 0; }
            body { width: 100%; height: 100%; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div style="
          width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: white;
        ">
          <div style="
            border: 8px solid #f1f2f6;
            padding: 40px;
            text-align: center;
            background-color: white;
            min-height: 700px;
            position: relative;
          ">
            <div style="margin-bottom: 40px;">
              <img src="/assets/images/logocolor.png" alt="Logo" style="
                width: 200px;
                height: 60px;
                margin-bottom: 20px;
              " />
              <h1 style="
                font-size: 32px;
                color: #333;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
              ">Certificate of Completion</h1>
            </div>

            <div style="margin-bottom: 40px;">
              <div style="
                margin-bottom: 20px;
                color: #007bff;
              ">${'<svg width="80" height="80">' + Award({ size: 80 }).props.dangerouslySetInnerHTML.__html + '</svg>'}</div>
              <p style="
                font-size: 18px;
                margin: 10px 0;
                color: #555;
              ">This is to certify that</p>
              <h2 style="
                font-size: 28px;
                margin: 15px 0;
                color: #333;
                font-family: 'Palatino', serif;
              ">${userName}</h2>
              <p style="
                font-size: 18px;
                margin: 10px 0;
                color: #555;
              ">has successfully completed</p>
              <h3 style="
                font-size: 24px;
                margin: 15px 0;
                color: #007bff;
              ">${certificate.program_title}</h3>
              <div style="
                max-width: 700px;
                margin: 20px auto;
                font-size: 16px;
                color: #555;
              ">
                <p>${certificate.description}</p>
              </div>
              <div style="
                font-size: 16px;
                margin-top: 30px;
                color: #777;
              ">
                Issued on ${new Date(certificate.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div style="
              display: flex;
              justify-content: space-around;
              margin-top: 60px;
              padding-top: 10px;
            ">
              <div style="
                text-align: center;
                width: 200px;
              ">
                <div style="
                  width: 100%;
                  height: 1px;
                  background-color: #333;
                  margin-bottom: 8px;
                "></div>
                <p style="
                  font-size: 14px;
                  margin: 0;
                  color: #555;
                ">Training Director</p>
              </div>
              <div style="
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 2px dashed #007bff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #007bff;
              ">
                <svg width="40" height="40">${Award({ size: 40 }).props.dangerouslySetInnerHTML.__html}</svg>
              </div>
              <div style="
                text-align: center;
                width: 200px;
              ">
                <div style="
                  width: 100%;
                  height: 1px;
                  background-color: #333;
                  margin-bottom: 8px;
                "></div>
                <p style="
                  font-size: 14px;
                  margin: 0;
                  color: #555;
                ">Program Instructor</p>
              </div>
            </div>

            <div style="
              position: absolute;
              bottom: 10px;
              right: 20px;
              font-size: 12px;
              color: #777;
            ">
              Certificate ID: ${certificate.id}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(iframeContent);
    iframeDoc.close();
  }, [certificate, certificateId]);

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
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Loading certificate...</p>
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
        <h2 style={{ fontSize: '24px', margin: 0, color: '#dc3545' }}>Error</h2>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>{error}</p>
        <button 
          onClick={() => navigate('/trainee/certificates')}
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
          <ArrowLeft size={16} /> Back to Certificates
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#333' }}>Preparing Certificate...</h2>
      <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
        Your certificate is being prepared for printing. The print dialog should open automatically.
      </p>
      <button 
        onClick={() => navigate('/trainee/certificates')}
        style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer', 
          marginTop: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}
      >
        <ArrowLeft size={16} /> Back to Certificates
      </button>
      <iframe 
        ref={iframeRef}
        style={{ position: 'absolute', width: '0', height: '0', border: '0' }}
        title="Certificate Print Frame"
      />
    </div>
  );
};

export default CertificatePrint;