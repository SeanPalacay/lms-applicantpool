import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, Calendar, Tag, User, ArrowLeft, Trash2,
  AlertTriangle, FileIcon, Clock
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const RecordDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchRecordDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer' && userRole !== 'administrator') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/record_details.php?recordId=${recordId}`, {
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
          } else if (response.status === 404) {
            throw new Error('Record not found');
          }
          const errorText = await response.text();
          throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setRecord(data);
      } catch (err) {
        console.error('Error fetching record details:', err);
        setError(err.message || 'Failed to load record details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId, navigate, API_BASE_URL]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setDeleting(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/delete_records.php`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          record_ids: [parseInt(recordId)]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      navigate('/trainer/records', { 
        state: { message: 'Record deleted successfully' } 
      });
      
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/download_record.php?recordId=${recordId}`, {
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
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading record:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getFileIcon = (filePath) => {
    if (!filePath) return <FileIcon size={24} />;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText size={24} style={{ color: 'var(--danger-color)' }} />;
      case 'doc':
      case 'docx':
        return <FileText size={24} style={{ color: 'var(--primary-color)' }} />;
      case 'xls':
      case 'xlsx':
        return <FileText size={24} style={{ color: 'var(--success-color)' }} />;
      case 'ppt':
      case 'pptx':
        return <FileText size={24} style={{ color: 'var(--warning-color)' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon size={24} style={{ color: 'var(--secondary-color)' }} />;
      default:
        return <FileText size={24} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
        <AlertBanner message={error} type="error" />
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <Link 
            to="/trainer/records" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              color: 'var(--primary-color)', 
              textDecoration: 'none' 
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Records</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
        <AlertBanner message="Record not found" type="error" />
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <Link 
            to="/trainer/records" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              color: 'var(--primary-color)', 
              textDecoration: 'none' 
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Records</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      {confirmDelete && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: 'var(--radius-md)', 
            padding: 'var(--spacing-md)', 
            boxShadow: 'var(--shadow-lg)', 
            width: '400px', 
            textAlign: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <AlertTriangle size={24} color="var(--warning-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Confirm Deletion
              </h3>
            </div>
            <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this record?
            </p>
            <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--danger-color)', fontWeight: '500' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  opacity: deleting ? 0.7 : 1 
                }}
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: 'none', 
                  backgroundColor: 'var(--danger-color)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  opacity: deleting ? 0.7 : 1 
                }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Clock size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                    Delete Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <Link 
          to="/trainer/records" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            color: 'var(--primary-color)', 
            textDecoration: 'none' 
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Records</span>
        </Link>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: 'var(--radius-md)', 
        padding: 'var(--spacing-md)', 
        boxShadow: 'var(--shadow-sm)', 
        marginBottom: 'var(--spacing-md)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--primary-ultralight)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {getFileIcon(record.file_path)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
              {record.description || 'Untitled Record'}
            </h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                <Tag size={16} />
                <span>Category: {record.category || 'Uncategorized'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                <Calendar size={16} />
                <span>Added: {formatDate(record.created_at)}</span>
              </div>
              {record.uploaded_by && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                  <User size={16} />
                  <span>Added by: {record.uploaded_by}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {record.file_path && (
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: 'none', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  cursor: 'pointer' 
                }}
                onClick={handleDownload}
              >
                <Download size={18} />
                <span>Download</span>
              </button>
            )}
            <button 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                padding: 'var(--spacing-sm) var(--spacing-md)', 
                borderRadius: 'var(--radius-sm)', 
                border: 'none', 
                backgroundColor: 'var(--danger-color)', 
                color: 'white', 
                cursor: 'pointer' 
              }}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {record.file_path && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)', 
          marginBottom: 'var(--spacing-md)' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
            File Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Filename:</span>
              <span style={{ flex: 2, color: 'var(--text-primary)' }}>{record.file_path.split('/').pop()}</span>
            </div>
            {record.file_size && (
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Size:</span>
                <span style={{ flex: 2, color: 'var(--text-primary)' }}>{formatFileSize(record.file_size)}</span>
              </div>
            )}
            {record.file_type && (
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Type:</span>
                <span style={{ flex: 2, color: 'var(--text-primary)' }}>{record.file_type}</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <button 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                padding: 'var(--spacing-sm) var(--spacing-md)', 
                borderRadius: 'var(--radius-sm)', 
                border: 'none', 
                backgroundColor: 'var(--primary-color)', 
                color: 'white', 
                cursor: 'pointer' 
              }}
              onClick={handleDownload}
            >
              <Download size={18} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      )}
      
      {record.record_type === 'training' && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
            Training Information
          </h3>
          {record.training_details && Object.keys(record.training_details).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {record.training_details.program_name && (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Program:</span>
                  <span style={{ flex: 2, color: 'var(--text-primary)' }}>{record.training_details.program_name}</span>
                </div>
              )}
              {record.training_details.completion_date && (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Completion Date:</span>
                  <span style={{ flex: 2, color: 'var(--text-primary)' }}>{formatDate(record.training_details.completion_date)}</span>
                </div>
              )}
              {record.training_details.score !== undefined && (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>Score:</span>
                  <span style={{ flex: 2, color: 'var(--text-primary)' }}>{record.training_details.score}%</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No additional training details available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordDetail;