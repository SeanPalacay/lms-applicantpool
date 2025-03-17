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
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const data = await adminService.getUserList();
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
    setError(null);
    setSuccess(null);
    
    if (!recordData.file) {
      setError('Please select a file to upload.');
      return false;
    }
    
    if (!recordData.record_type) {
      setError('Please select a record type.');
      return false;
    }
    
    if (!recordData.category) {
      setError('Please select a category.');
      return false;
    }
    
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
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Upload Record</h1>
        <div style={{ height: '1px', backgroundColor: 'var(--medium-gray)', marginTop: '8px' }}></div>
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
      
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '24px' }}
        onClick={handleCancel}
      >
        <ArrowLeft size={16} />
        <span>Back to Records</span>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', padding: '16px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Upload size={20} color="white" />
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>Upload New Record</h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              
              {!recordData.file ? (
                <div 
                  style={{ 
                    border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--medium-gray)'}`, 
                    borderRadius: '8px', 
                    padding: '32px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: dragActive ? 'var(--primary-ultralight)' : 'var(--light-gray)', 
                    cursor: 'pointer' 
                  }}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload size={48} color={dragActive ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '16px' }}>Drag & Drop File Here</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '8px 0' }}>or</p>
                  <button 
                    type="button" 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '4px', 
                      backgroundColor: 'var(--primary-color)', 
                      color: 'white', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '14px', 
                      fontWeight: '500' 
                    }}
                    onClick={handleBrowseClick}
                  >
                    Browse Files
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--medium-gray)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Selected File</h3>
                    <button 
                      type="button" 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}
                      onClick={removeFile}
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                      <File size={32} color="var(--text-secondary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{recordData.file.name}</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>{recordData.file.type || 'Unknown type'}</span>
                        <span>{formatFileSize(recordData.file.size)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
                      <CheckCircle size={18} />
                      <span>Ready to upload</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="record_type" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Record Type</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <select
                    id="record_type"
                    name="record_type"
                    value={recordData.record_type}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '8px 16px 8px 40px', 
                      borderRadius: '4px', 
                      border: '1px solid var(--medium-gray)', 
                      backgroundColor: 'white', 
                      fontSize: '14px', 
                      color: 'var(--text-primary)', 
                      appearance: 'none' 
                    }}
                    required
                  >
                    {recordTypes.map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <label htmlFor="category" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <select
                    id="category"
                    name="category"
                    value={recordData.category}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '8px 16px 8px 40px', 
                      borderRadius: '4px', 
                      border: '1px solid var(--medium-gray)', 
                      backgroundColor: 'white', 
                      fontSize: '14px', 
                      color: 'var(--text-primary)', 
                      appearance: 'none' 
                    }}
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
            
            <div>
              <label htmlFor="description" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Description</label>
              <div style={{ position: 'relative' }}>
                <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={recordData.description}
                  onChange={handleInputChange}
                  placeholder="Enter record description"
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px 8px 40px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--medium-gray)', 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="user_id" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Associated User (Optional)</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <select
                  id="user_id"
                  name="user_id"
                  value={recordData.user_id}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px 8px 40px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--medium-gray)', 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)', 
                    appearance: 'none' 
                  }}
                >
                  <option value="">No User (System Record)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--medium-gray)', 
                  color: 'var(--text-primary)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
                onClick={handleCancel}
              >
                <XCircle size={16} />
                <span>Cancel</span>
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  opacity: uploading || !recordData.file ? 0.7 : 1, 
                  pointerEvents: uploading || !recordData.file ? 'none' : 'auto' 
                }}
                disabled={uploading || !recordData.file}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadRecord;