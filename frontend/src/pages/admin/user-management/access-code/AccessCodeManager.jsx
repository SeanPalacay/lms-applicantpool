import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, RefreshCw, Shield, AlertCircle, Calendar, Mail } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const AccessCodeManager = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchUserAndAccessCode();
  }, [userId]);

  const fetchUserAndAccessCode = async () => {
    try {
      setLoading(true);
      // First get the user
      const userData = await adminService.getUserById(userId);
      setUser(userData);
      
      if (userData.role !== 'applicant') {
        setError('Access codes can only be managed for applicant users.');
        setLoading(false);
        return;
      }
      
      // Then try to get the access code
      try {
        const accessCodesData = await adminService.getAccessCodesByUser(userId);
        if (accessCodesData && accessCodesData.length > 0) {
          // Get the most recent code
          const latestCode = accessCodesData.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          
          setAccessCode(latestCode.code);
          setExpiryDate(latestCode.expires_at ? new Date(latestCode.expires_at).toLocaleDateString() : 'Never');
        } else {
          // No access code exists yet
          generateNewCode();
        }
      } catch (err) {
        console.error('Error fetching access codes:', err);
        generateNewCode();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      
      // Generate a random code (10 characters)
      const newCode = generateRandomCode(10);
      setAccessCode(newCode);
      
      // Set expiry date to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      setExpiryDate(expiryDate.toLocaleDateString());
      
      // Save the new code to the database
      await adminService.createAccessCode({
        user_id: userId,
        code: newCode,
        expires_at: expiryDate.toISOString()
      });
      
      setSuccess('Access code regenerated successfully!');
      setCodeCopied(false);
    } catch (err) {
      console.error('Error generating access code:', err);
      setError('Failed to generate access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(accessCode)
      .then(() => {
        setCodeCopied(true);
        setSuccess('Access code copied to clipboard!');
        setTimeout(() => {
          setCodeCopied(false);
          setSuccess(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setError('Failed to copy access code. Please try manually.');
      });
  };

  const sendAccessCodeEmail = async () => {
    if (!user || !user.email || !accessCode) {
      setError('Missing user email or access code information.');
      return;
    }
    
    try {
      setSendingEmail(true);
      setLoading(true);
      
      // Call the API endpoint to send an email
      const response = await adminService.sendAccessCodeEmail({
        user_id: userId,
        code: accessCode,
        email: user.email,
        expires_at: expiryDate
      });
      
      setSuccess(`Access code has been emailed to ${user.email}!`);
    } catch (err) {
      console.error('Error sending access code email:', err);
      setError('Failed to send access code email. Please try again.');
    } finally {
      setSendingEmail(false);
      setLoading(false);
    }
  };

  // Function to generate a random code
  const generateRandomCode = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let result = '';
    
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
  };

  if (loading && !user) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b',
      position: 'relative'
    }}>
      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}
      
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/admin/user-management" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to User Management
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          Manage Access Code: {user?.full_name}
        </h1>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} /> Applicant Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Username</label>
              <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: '#1e293b' }}>{user?.username}</p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Email</label>
              <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: '#1e293b' }}>{user?.email}</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0d47a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> Access Code Management
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#1565c0' }}>
            This code allows the applicant to log in to the system. Share it securely with them.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              style={{
                flex: '1',
                padding: '12px',
                border: '1px solid #64b5f6',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'monospace',
                backgroundColor: '#fff',
                color: '#0d47a1',
                fontWeight: '600'
              }}
            />
            <button
              type="button"
              onClick={copyCodeToClipboard}
              style={{
                padding: '12px',
                backgroundColor: codeCopied ? '#2e7d32' : '#1e88e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Copy to clipboard"
            >
              <Copy size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1565c0' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '14px' }}>Expires: {expiryDate}</span>
            </div>
            
            <button
              onClick={generateNewCode}
              style={{
                backgroundColor: '#1565c0',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <RefreshCw size={16} /> Regenerate Code
            </button>
          </div>
          
          {/* Email Button */}
          <button
            onClick={sendAccessCodeEmail}
            disabled={sendingEmail}
            style={{
              width: '100%',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: sendingEmail ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              opacity: sendingEmail ? 0.7 : 1
            }}
          >
            <Mail size={16} /> {sendingEmail ? 'Sending...' : `Email Access Code to ${user?.email}`}
          </button>
        </div>

        <div style={{ marginTop: '24px' }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
            <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Regenerating the code will invalidate the previous code and create a new one. The applicant will need the new code to log in.
          </p>
        </div>
      </div>
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default AccessCodeManager;