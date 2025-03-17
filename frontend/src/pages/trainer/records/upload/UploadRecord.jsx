import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Save, XCircle, Clock, Tag, 
  AlertTriangle, CheckCircle, Info, FileIcon
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

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
      return <FileText size={48} style={{ color: '#E53E3E' }} />;
    } else if (fileType.includes('word')) {
      return <FileText size={48} style={{ color: '#2B6CB0' }} />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileText size={48} style={{ color: '#2F855A' }} />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText size={48} style={{ color: '#B83280' }} />;
    } else if (fileType.includes('image')) {
      return filePreview ? (
        <img src={filePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
      ) : (
        <FileIcon size={48} style={{ color: '#718096' }} />
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
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #1E88E5, #1565C0)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
            <Upload size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Upload Training Record</h3>
          </div>
        </div>
        
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Info size={18} />
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Record Information</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="description" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                    <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> Description:
                  </label>
                  <textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange}
                    style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                    placeholder="Enter record description"
                    rows={4}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="category" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                    <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> Category:
                  </label>
                  <select 
                    id="category" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="custom-category" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                      <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> New Category:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text" 
                        id="custom-category" 
                        value={customCategory} 
                        onChange={handleCustomCategoryChange}
                        style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                        placeholder="Enter new category name"
                        required
                      />
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '9999px', transition: 'background-color 0.15s ease, color 0.15s ease' }}
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="user_id" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Assign to Trainee (Optional):</label>
                  <select 
                    id="user_id" 
                    name="user_id" 
                    value={formData.user_id} 
                    onChange={handleChange}
                    style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                  >
                    <option value="">Not assigned to specific trainee</option>
                    {trainees.map(trainee => (
                      <option key={trainee.id} value={trainee.id}>
                        {trainee.full_name}
                      </option>
                    ))}
                  </select>
                  <small style={{ fontSize: '12px', color: '#64748B' }}>
                    If selected, this record will be associated with the specified trainee
                  </small>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={18} />
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>File Upload</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      id="file" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#E3F2FD', color: '#1E88E5', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}>
                      <Upload size={20} />
                      <span>{file ? 'Change File' : 'Select File'}</span>
                    </label>
                    {fileError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E53E3E', fontSize: '12px', marginTop: '4px' }}>
                        <AlertTriangle size={16} />
                        <span>{fileError}</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px dashed #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                    {file ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getFileIcon(file)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{file.name}</div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                            <span>{file.type.split('/')[1].toUpperCase()}</span>
                            <span>{formatFileSize(fileSize)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748B', textAlign: 'center' }}>
                        <FileText size={48} style={{ color: '#E2E8F0' }} />
                        <p>No file selected</p>
                        <span>Supported formats: PDF, Word, Excel, PowerPoint, Images</span>
                        <span>Maximum size: 10MB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
              <button 
                type="button" 
                onClick={handleCancel} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease', opacity: uploading || !file || fileError ? 0.7 : 1 }}
                disabled={uploading || !file || fileError}
              >
                {uploading ? (
                  <>
                    <Clock size={18} style={{ animation: 'spin 1s linear infinite' }} />
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