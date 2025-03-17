import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';

const CertificatePrint = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  useEffect(() => {
    // Function to create and print the certificate
    const createPrintableCertificate = () => {
      // User data
      const userName = localStorage.getItem('userName') || 'Trainee';
      const certificateData = {
        id: certificateId || '1',
        program_title: 'Loan Officer Basics',
        description: 'Certificate of Completion: Loan Officer Basics',
        created_at: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };
      
      // Create iframe document content
      const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Certificate Print</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background-color: white;
            }
            .certificate-container {
              width: 1000px;
              margin: 0 auto;
              padding: 20px;
              position: relative;
            }
            .certificate-document {
              border: 8px solid #f1f2f6;
              padding: 40px;
              text-align: center;
              position: relative;
              background-color: white;
              min-height: 700px;
            }
            .certificate-header {
              margin-bottom: 40px;
            }
            .logo {
              width: 200px;
              height: 60px;
              margin-bottom: 20px;
              background-color: #eee; /* Placeholder for logo */
            }
            .certificate-title {
              font-size: 32px;
              color: #333;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 0;
            }
            .certificate-body {
              margin-bottom: 40px;
            }
            .certificate-award-icon {
              font-size: 80px;
              color: #f1c40f;
              margin-bottom: 20px;
            }
            .certificate-text {
              font-size: 18px;
              margin: 10px 0;
              color: #555;
            }
            .certificate-recipient {
              font-size: 28px;
              margin: 15px 0;
              color: #333;
              font-family: 'Palatino', serif;
            }
            .certificate-program {
              font-size: 24px;
              margin: 15px 0;
              color: #3498db;
            }
            .certificate-description {
              max-width: 700px;
              margin: 20px auto;
              font-size: 16px;
              color: #555;
            }
            .certificate-date {
              font-size: 16px;
              margin-top: 30px;
              color: #777;
            }
            .certificate-footer {
              display: flex;
              justify-content: space-around;
              margin-top: 60px;
              padding-top: 10px;
            }
            .certificate-signature {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              width: 100%;
              height: 1px;
              background-color: #333;
              margin-bottom: 8px;
            }
            .signature-name {
              font-size: 14px;
              margin: 0;
              color: #555;
            }
            .certificate-seal {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              border: 2px dashed #3498db;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              color: #3498db;
              font-size: 40px;
            }
            .certificate-id {
              position: absolute;
              bottom: 10px;
              right: 20px;
              font-size: 12px;
              color: #777;
            }
            @media print {
              @page {
                size: landscape;
                margin: 0;
              }
              body {
                width: 100%;
                height: 100%;
              }
              .certificate-container {
                width: 100%;
                height: 100%;
                padding: 0;
              }
              .certificate-document {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-document">
              <div class="certificate-header">
                <div class="logo"></div>
                <h1 class="certificate-title">Certificate of Completion</h1>
              </div>
              
              <div class="certificate-body">
                <div class="certificate-award-icon">🏆</div>
                
                <p class="certificate-text">This is to certify that</p>
                <h2 class="certificate-recipient">${userName}</h2>
                <p class="certificate-text">has successfully completed</p>
                <h3 class="certificate-program">${certificateData.program_title}</h3>
                
                <div class="certificate-description">
                  <p>${certificateData.description}</p>
                </div>
                
                <div class="certificate-date">
                  Issued on ${certificateData.created_at}
                </div>
              </div>
              
              <div class="certificate-footer">
                <div class="certificate-signature">
                  <div class="signature-line"></div>
                  <p class="signature-name">Training Director</p>
                </div>
                
                <div class="certificate-seal">★</div>
                
                <div class="certificate-signature">
                  <div class="signature-line"></div>
                  <p class="signature-name">Program Instructor</p>
                </div>
              </div>
              
              <div class="certificate-id">
                Certificate ID: ${certificateData.id}
              </div>
            </div>
          </div>
          <script>
            // Auto print when loaded
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;
      
      return iframeContent;
    };

    // If we have an iframe reference, populate and print it
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      iframeDoc.open();
      iframeDoc.write(createPrintableCertificate());
      iframeDoc.close();
    }
  }, [certificateId]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Preparing Certificate...</h2>
      <p>Your certificate is being prepared for printing. The print dialog should open automatically.</p>
      
      <button onClick={() => navigate('/trainee/certificates')} 
              style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px' }}>
        Back to Certificates
      </button>
      
      {/* Hidden iframe for printing */}
      <iframe 
        ref={iframeRef}
        style={{ position: 'absolute', width: '0', height: '0', border: '0' }}
        title="Certificate Print Frame" 
      />
    </div>
  );
};

export default CertificatePrint;