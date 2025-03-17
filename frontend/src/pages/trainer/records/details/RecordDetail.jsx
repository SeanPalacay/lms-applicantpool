import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, Calendar, Tag, User, ArrowLeft, Trash2,
  AlertTriangle, FileIcon, Clock
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/RecordDetail.css';

/**
 * RecordDetail Component
 * Displays detailed information about a training record
 */
const RecordDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Fetch record details on component mount
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
        
        // Fetch record details
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

  // Handle record deletion
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
      
      // Navigate back to records list
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

  // Handle download
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
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use fallback
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get file icon based on extension
  const getFileIcon = (filePath) => {
    if (!filePath) return <FileIcon size={24} />;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText size={24} className="file-pdf" />;
      case 'doc':
      case 'docx':
        return <FileText size={24} className="file-word" />;
      case 'xls':
      case 'xlsx':
        return <FileText size={24} className="file-excel" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={24} className="file-powerpoint" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon size={24} className="file-image" />;
      default:
        return <FileText size={24} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="record-detail-container">
        <AlertBanner message={error} type="error" />
        <div className="back-navigation">
          <Link to="/trainer/records" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Records</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="record-detail-container">
        <AlertBanner message="Record not found" type="error" />
        <div className="back-navigation">
          <Link to="/trainer/records" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Records</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="record-detail-container">
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <div className="modal-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>Confirm Deletion</h3>
            </div>
            <p>Are you sure you want to delete this record?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Clock size={16} className="icon-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Record
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(false)}></div>
        </div>
      )}
      
      <div className="back-navigation">
        <Link to="/trainer/records" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Records</span>
        </Link>
      </div>
      
      <div className="record-header-card">
        <div className="record-header">
          <div className="record-icon">
            {getFileIcon(record.file_path)}
          </div>
          <div className="record-title-container">
            <h2>{record.description || 'Untitled Record'}</h2>
            <div className="record-meta">
              <span className="record-category">
                <Tag size={16} />
                Category: {record.category || 'Uncategorized'}
              </span>
              <span className="record-created">
                <Calendar size={16} />
                Added: {formatDate(record.created_at)}
              </span>
              {record.uploaded_by && (
                <span className="record-uploader">
                  <User size={16} />
                  Added by: {record.uploaded_by}
                </span>
              )}
            </div>
          </div>
          <div className="record-actions">
            {record.file_path && (
              <button className="btn-download" onClick={handleDownload}>
                <Download size={18} />
                <span>Download</span>
              </button>
            )}
            <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {record.file_path && (
        <div className="file-details-card">
          <h3>File Information</h3>
          <div className="file-detail">
            <span className="detail-label">Filename:</span>
            <span className="detail-value">{record.file_path.split('/').pop()}</span>
          </div>
          {record.file_size && (
            <div className="file-detail">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{formatFileSize(record.file_size)}</span>
            </div>
          )}
          {record.file_type && (
            <div className="file-detail">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{record.file_type}</span>
            </div>
          )}
          <div className="file-actions">
            <button className="btn-download" onClick={handleDownload}>
              <Download size={18} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      )}
      
      {record.record_type === 'training' && (
        <div className="training-details-card">
          <h3>Training Information</h3>
          {record.training_details && Object.keys(record.training_details).length > 0 ? (
            <div className="training-details">
              {record.training_details.program_name && (
                <div className="training-detail">
                  <span className="detail-label">Program:</span>
                  <span className="detail-value">{record.training_details.program_name}</span>
                </div>
              )}
              {record.training_details.completion_date && (
                <div className="training-detail">
                  <span className="detail-label">Completion Date:</span>
                  <span className="detail-value">{formatDate(record.training_details.completion_date)}</span>
                </div>
              )}
              {record.training_details.score !== undefined && (
                <div className="training-detail">
                  <span className="detail-label">Score:</span>
                  <span className="detail-value">{record.training_details.score}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="no-details-message">No additional training details available.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export default RecordDetail;