// src/pages/admin/records/upload/UploadRecord.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  User, 
  Tag,
  ArrowLeft,
  RefreshCw,
  XCircle,
  File,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';
import '../styles/UploadRecord.css';

const UploadRecord = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [users, setUsers] = useState([]);
  const [recordData, setRecordData] = useState({
    user_id: '',
    record_type: 'training',
    category: '',
    description: '',
    file: null
  });
  const [dragActive, setDragActive] = useState(false);
  
  const recordTypes = [
    { value: 'training', label: 'Training' },
    { value: 'applicant', label: 'Applicant' },
    { value: 'backup', label: 'Backup' },
    { value: 'other', label: 'Other' }
  ];
  
  const categoryOptions = {
    training: [
      { value: 'certificates', label: 'Certificates' },
      { value: 'guides', label: 'Guides' },
      { value: 'materials', label: 'Training Materials' }
    ],
    applicant: [
      { value: 'evaluations', label: 'Evaluations' },
      { value: 'resumes', label: 'Resumes' },
      { value: 'cover_letters', label: 'Cover Letters' }
    ],
    backup: [
      { value: 'database', label: 'Database Backup' },
      { value: 'configuration', label: 'Configuration' }
    ],
    other: [
      { value: 'miscellaneous', label: 'Miscellaneous' },
      { value: 'reports', label: 'Reports' }
    ]
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Fetch users data
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Reset category if record type changes
    if (name === 'record_type') {
      setRecordData({
        ...recordData,
        record_type: value,
        category: ''
      });
    } else {
      setRecordData({
        ...recordData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setRecordData({
        ...recordData,
        file: file,
        description: recordData.description || file.name
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setRecordData({
        ...recordData,
        file: file,
        description: recordData.description || file.name
      });
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    // Reset error and success messages
    setError(null);
    setSuccess(null);
    
    // Validate file
    if (!recordData.file) {
      setError('Please select a file to upload.');
      return false;
    }
    
    // Validate record type
    if (!recordData.record_type) {
      setError('Please select a record type.');
      return false;
    }
    
    // Validate category
    if (!recordData.category) {
      setError('Please select a category.');
      return false;
    }
    
    // Validate description
    if (!recordData.description.trim()) {
      setError('Please provide a description for the record.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', recordData.file);
      formData.append('user_id', recordData.user_id || null);
      formData.append('record_type', recordData.record_type);
      formData.append('category', recordData.category);
      formData.append('description', recordData.description);
      
      await adminService.uploadRecord(formData);
      setSuccess('Record uploaded successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/records', { state: { message: 'Record uploaded successfully.' } });
      }, 2000);
    } catch (err) {
      console.error('Error uploading record:', err);
      setError(err.message || 'Failed to upload record. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/records');
  };

  const removeFile = () => {
    setRecordData({
      ...recordData,
      file: null
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const formatFileSize = (size) => {
    if (!size) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let fileSize = size;
    let unitIndex = 0;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="upload-record-container">
      <div className="section-header">
        <h1>Upload Record</h1>
        <div className="header-line"></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div className="back-link" onClick={handleCancel}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Records</span>
      </div>
      
      <div className="upload-content">
        <div className="upload-card">
          <div className="card-header gradient-indigo">
            <div className="header-icon">
              <Upload size={20} />
            </div>
            <div className="header-content">
              <h3>Upload New Record</h3>
            </div>
          </div>
          
          <div className="card-content">
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="file-upload-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="file-input"
                  id="file-upload"
                />
                
                {!recordData.file ? (
                  <div 
                    className={`drop-area ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="drop-content">
                      <Upload size={48} className="upload-icon" />
                      <h3>Drag & Drop File Here</h3>
                      <p>or</p>
                      <button 
                        type="button" 
                        className="browse-button"
                        onClick={handleBrowseClick}
                      >
                        Browse Files
                      </button>
                      <p className="file-hint">Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
                    </div>
                  </div>
                ) : (
                  <div className="file-preview">
                    <div className="file-preview-header">
                      <h3>Selected File</h3>
                      <button 
                        type="button" 
                        className="remove-file" 
                        onClick={removeFile}
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    <div className="file-info">
                      <div className="file-icon">
                        <File size={32} />
                      </div>
                      <div className="file-details">
                        <div className="file-name">{recordData.file.name}</div>
                        <div className="file-meta">
                          <span className="file-type">{recordData.file.type || 'Unknown type'}</span>
                          <span className="file-size">{formatFileSize(recordData.file.size)}</span>
                        </div>
                      </div>
                      <div className="file-status">
                        <CheckCircle size={18} className="file-ready" />
                        <span>Ready to upload</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="record_type">Record Type</label>
                  <div className="select-with-icon">
                    <FileText size={18} className="select-icon" />
                    <select
                      id="record_type"
                      name="record_type"
                      value={recordData.record_type}
                      onChange={handleInputChange}
                      required
                    >
                      {recordTypes.map((type, index) => (
                        <option key={index} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group half">
                  <label htmlFor="category">Category</label>
                  <div className="select-with-icon">
                    <Tag size={18} className="select-icon" />
                    <select
                      id="category"
                      name="category"
                      value={recordData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryOptions[recordData.record_type]?.map((category, index) => (
                        <option key={index} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <div className="input-with-icon">
                  <FileText size={18} className="input-icon" />
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={recordData.description}
                    onChange={handleInputChange}
                    placeholder="Enter record description"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="user_id">Associated User (Optional)</label>
                <div className="select-with-icon">
                  <User size={18} className="select-icon" />
                  <select
                    id="user_id"
                    name="user_id"
                    value={recordData.user_id}
                    onChange={handleInputChange}
                  >
                    <option value="">No User (System Record)</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="action-button secondary" onClick={handleCancel}>
                  <XCircle size={16} className="icon-inline" /> Cancel
                </button>
                <button type="submit" className="action-button primary" disabled={uploading || !recordData.file}>
                  {uploading ? (
                    <>
                      <RefreshCw size={16} className="icon-inline spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="icon-inline" /> Upload Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadRecord;