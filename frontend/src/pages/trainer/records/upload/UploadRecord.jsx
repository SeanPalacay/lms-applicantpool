import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Save, XCircle, Clock, Tag, 
  AlertTriangle, CheckCircle, Info, FileIcon
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/UploadRecord.css';

/**
 * UploadRecord Component
 * Allows trainers to upload training records and documentation
 */
const UploadRecord = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    user_id: '', // Optional - for assigning to specific trainee
  });
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fileError, setFileError] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [fileSize, setFileSize] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Maximum allowed file size in bytes (10 MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Supported file types
  const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  // Fetch categories and trainees on component mount
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch record categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/record_categories.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!categoriesResponse.ok) {
          // If API returns 404, use default categories instead of showing error
          if (categoriesResponse.status === 404) {
            setCategories(['certificates', 'guides', 'presentations', 'assessments', 'templates']);
          } else {
            const errorText = await categoriesResponse.text();
            throw new Error(`Failed to fetch categories: ${categoriesResponse.status} - ${errorText}`);
          }
        } else {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
        
        // Fetch trainees for assignment
        const traineesResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/trainees.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!traineesResponse.ok) {
          if (traineesResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await traineesResponse.text();
          throw new Error(`Failed to fetch trainees: ${traineesResponse.status} - ${errorText}`);
        }

        const traineesData = await traineesResponse.json();
        setTrainees(traineesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // If we haven't set categories yet, set default ones
        if (categories.length === 0) {
          setCategories(['certificates', 'guides', 'presentations', 'assessments', 'templates']);
        }
        
        // Only show error for non-404 errors
        if (!err.message.includes('404')) {
          setError('Failed to load required data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, API_BASE_URL, categories.length]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category' && value === 'custom') {
      setShowCustomCategory(true);
    } else if (name === 'category') {
      setShowCustomCategory(false);
      setFormData({
        ...formData,
        [name]: value
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle custom category change
  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileError('');
    
    if (!selectedFile) {
      setFile(null);
      setFilePreview(null);
      setFileSize(null);
      return;
    }
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 10MB limit (${formatFileSize(selectedFile.size)})`);
      return;
    }
    
    // Check file type
    if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError('Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, or image files.');
      return;
    }
    
    setFile(selectedFile);
    setFileSize(selectedFile.size);
    
    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (file) => {
    if (!file) return <FileIcon size={48} />;
    
    const fileType = file.type;
    
    if (fileType.includes('pdf')) {
      return <FileText size={48} className="file-pdf" />;
    } else if (fileType.includes('word')) {
      return <FileText size={48} className="file-word" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileText size={48} className="file-excel" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText size={48} className="file-powerpoint" />;
    } else if (fileType.includes('image')) {
      return filePreview ? (
        <img src={filePreview} alt="Preview" className="image-preview" />
      ) : (
        <FileIcon size={48} className="file-image" />
      );
    } else {
      return <FileText size={48} />;
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!file) {
      setFileError('Please select a file to upload');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please provide a description for the record');
      return;
    }
    
    // Set the correct category value
    let categoryValue = formData.category;
    if (showCustomCategory && customCategory.trim()) {
      categoryValue = customCategory.trim();
    } else if (!formData.category) {
      setError('Please select or enter a category');
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setUploading(false);
        return;
      }
      
      // Create form data for file upload
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('description', formData.description);
      uploadData.append('category', categoryValue);
      
      if (formData.user_id) {
        uploadData.append('user_id', formData.user_id);
      }
      
      // Upload record
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/upload_record.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: uploadData
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload record');
      }
      
      setSuccessMessage('Record uploaded successfully!');
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/trainer/records');
      }, 2000);
    } catch (err) {
      console.error('Error uploading record:', err);
      setError(err.message || 'Failed to upload record. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Cancel upload
  const handleCancel = () => {
    navigate('/trainer/records');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="upload-record-container">
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div className="card">
        <div className="card-header gradient-indigo">
          <div className="header-icon">
            <Upload size={20} />
          </div>
          <div className="header-content">
            <h3>Upload Training Record</h3>
          </div>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-grid">
              <div className="form-section">
                <div className="section-header">
                  <Info size={18} />
                  <h4>Record Information</h4>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">
                    <span className="required">*</span> Description:
                  </label>
                  <textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Enter record description"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">
                    <span className="required">*</span> Category:
                  </label>
                  <select 
                    id="category" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    className="form-select"
                    required={!showCustomCategory}
                    disabled={showCustomCategory}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                    <option value="custom">Add new category...</option>
                  </select>
                </div>
                
                {showCustomCategory && (
                  <div className="form-group">
                    <label htmlFor="custom-category">
                      <span className="required">*</span> New Category:
                    </label>
                    <div className="custom-category-container">
                      <input 
                        type="text" 
                        id="custom-category" 
                        value={customCategory} 
                        onChange={handleCustomCategoryChange}
                        className="form-input"
                        placeholder="Enter new category name"
                        required
                      />
                      <button 
                        type="button" 
                        className="btn-reset-category"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setCustomCategory('');
                          setFormData({...formData, category: ''});
                        }}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="user_id">Assign to Trainee (Optional):</label>
                  <select 
                    id="user_id" 
                    name="user_id" 
                    value={formData.user_id} 
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Not assigned to specific trainee</option>
                    {trainees.map(trainee => (
                      <option key={trainee.id} value={trainee.id}>
                        {trainee.full_name}
                      </option>
                    ))}
                  </select>
                  <small className="form-help-text">
                    If selected, this record will be associated with the specified trainee
                  </small>
                </div>
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <FileText size={18} />
                  <h4>File Upload</h4>
                </div>
                
                <div className="file-upload-container">
                  <div className="file-input-container">
                    <input 
                      type="file" 
                      id="file" 
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <label htmlFor="file" className="file-label">
                      <Upload size={20} />
                      <span>{file ? 'Change File' : 'Select File'}</span>
                    </label>
                    {fileError && (
                      <div className="file-error">
                        <AlertTriangle size={16} />
                        <span>{fileError}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="file-preview">
                    {file ? (
                      <>
                        <div className="preview-icon">
                          {getFileIcon(file)}
                        </div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-details">
                            <span>{file.type.split('/')[1].toUpperCase()}</span>
                            <span>{formatFileSize(fileSize)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="no-file-selected">
                        <FileText size={48} className="empty-icon" />
                        <p>No file selected</p>
                        <span>Supported formats: PDF, Word, Excel, PowerPoint, Images</span>
                        <span>Maximum size: 10MB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                <XCircle size={18} />
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={uploading || !file || fileError}>
                {uploading ? (
                  <>
                    <Clock size={18} className="icon-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Upload Record
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