import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  RotateCw, Save, XCircle, Clock, Calendar, Info, 
  Link as LinkIcon, ArrowLeft, AlertTriangle, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/RefresherForm.css';

/**
 * EditRefresherCourse Component
 * Allows trainers to edit existing refresher courses
 */
const EditRefresherCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: 7,
    related_program_id: '',
    content: '',
    materials: [],
    status: 'draft'
  });
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [materialName, setMaterialName] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [file, setFile] = useState(null);
  const [originalCourse, setOriginalCourse] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Fetch course details and available programs on component mount
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
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch refresher course details
        const courseResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/refresher_course_details.php?courseId=${courseId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!courseResponse.ok) {
          if (courseResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          } else if (courseResponse.status === 404) {
            throw new Error('Refresher course not found.');
          }
          const errorText = await courseResponse.text();
          throw new Error(`HTTP error: ${courseResponse.status} - ${errorText}`);
        }

        const courseData = await courseResponse.json();
        setOriginalCourse(courseData);
        
        // Set form data from course details
        setFormData({
          title: courseData.title || '',
          description: courseData.description || '',
          duration_days: courseData.duration_days || 7,
          related_program_id: courseData.related_program_id || '',
          content: courseData.content || '',
          materials: courseData.materials || [],
          status: courseData.status || 'draft'
        });
        
        // Fetch available programs
        const programsResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/programs.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!programsResponse.ok) {
          if (programsResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await programsResponse.text();
          throw new Error(`HTTP error: ${programsResponse.status} - ${errorText}`);
        }

        const programsData = await programsResponse.json();
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load required data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle material name change
  const handleMaterialNameChange = (e) => {
    setMaterialName(e.target.value);
  };

  // Handle material URL change
  const handleMaterialUrlChange = (e) => {
    setMaterialUrl(e.target.value);
  };

  // Add link material
  const handleAddLinkMaterial = (e) => {
    e.preventDefault();
    
    if (!materialName || !materialUrl) {
      setError('Please provide both name and URL for the material');
      return;
    }
    
    setFormData({
      ...formData,
      materials: [
        ...formData.materials,
        {
          type: 'link',
          name: materialName,
          url: materialUrl
        }
      ]
    });
    
    // Reset material inputs
    setMaterialName('');
    setMaterialUrl('');
  };

  // Upload file material
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!file || !materialName) {
      setError('Please select a file and provide a name');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setUploading(false);
        return;
      }
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('name', materialName);
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/upload_material.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, the browser will set it with the boundary
        },
        body: formDataUpload
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      setFormData(prevData => ({
        ...prevData,
        materials: [
          ...prevData.materials,
          {
            type: 'file',
            name: materialName,
            url: data.url,
            file_path: data.file_path
          }
        ]
      }));
      
      // Reset file inputs
      setFile(null);
      setMaterialName('');
      document.getElementById('file-upload').value = '';
    } catch (err) {
      console.error('Error uploading material:', err);
      setError('Failed to upload material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Remove material
  const handleRemoveMaterial = (index) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials.splice(index, 1);
    setFormData({
      ...formData,
      materials: updatedMaterials
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Title is required');
      setSubmitting(false);
      return;
    }
    
    if (!formData.duration_days || formData.duration_days < 1) {
      setError('Duration must be at least 1 day');
      setSubmitting(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setSubmitting(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/update_refresher_course.php?courseId=${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update refresher course');
      }

      await response.json();
      setSuccessMessage('Refresher course updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/trainer/refresher-courses/${courseId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating refresher course:', err);
      setError(err.message || 'Failed to update refresher course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    navigate(`/trainer/refresher-courses/${courseId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!originalCourse && !loading) {
    return (
      <div className="edit-refresher-container">
        <AlertBanner message="Refresher course not found" type="error" />
        <div className="back-navigation">
          <button onClick={() => navigate('/trainer/refresher-courses')} className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Refresher Courses</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-refresher-container">
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div className="back-navigation">
        <button onClick={() => navigate(`/trainer/refresher-courses/${courseId}`)} className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Course Details</span>
        </button>
      </div>
      
      <div className="card">
        <div className="card-header gradient-amber">
          <div className="header-icon">
            <RotateCw size={20} />
          </div>
          <div className="header-content">
            <h3>Edit Refresher Course</h3>
          </div>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="refresher-form">
            <div className="form-section">
              <div className="section-header">
                <Info size={18} />
                <h4>Course Information</h4>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">
                  <span className="required">*</span> Title:
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter course title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Enter course description"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="related_program_id">Related Program:</label>
                <select 
                  id="related_program_id" 
                  name="related_program_id" 
                  value={formData.related_program_id} 
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">None (Standalone Course)</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="duration_days">
                  <span className="required">*</span> Duration (days):
                </label>
                <input 
                  type="number" 
                  id="duration_days" 
                  name="duration_days" 
                  value={formData.duration_days} 
                  onChange={handleChange}
                  min="1"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="draft">Draft (Not Visible to Trainees)</option>
                  <option value="active">Active (Available for Enrollment)</option>
                </select>
              </div>
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <FileText size={18} />
                <h4>Course Content</h4>
              </div>
              
              <div className="form-group">
                <label htmlFor="content">Content:</label>
                <textarea 
                  id="content" 
                  name="content" 
                  value={formData.content} 
                  onChange={handleChange}
                  className="form-textarea content-textarea"
                  placeholder="Enter course content (supports basic formatting)"
                  rows={10}
                />
              </div>
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <LinkIcon size={18} />
                <h4>Course Materials</h4>
              </div>
              
              {/* Materials List */}
              {formData.materials.length > 0 && (
                <div className="materials-list">
                  {formData.materials.map((material, index) => (
                    <div key={index} className="material-item">
                      <div className="material-icon">
                        {material.type === 'link' ? <LinkIcon size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="material-info">
                        <span className="material-name">{material.name}</span>
                        <span className="material-type">{material.type === 'link' ? 'External Link' : 'Uploaded File'}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-remove-material"
                        onClick={() => handleRemoveMaterial(index)}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Link Material */}
              <div className="add-material-section">
                <h5>Add External Link</h5>
                <div className="add-link-form">
                  <div className="form-group">
                    <label htmlFor="material-name">Name:</label>
                    <input 
                      type="text" 
                      id="material-name" 
                      value={materialName} 
                      onChange={handleMaterialNameChange}
                      className="form-input"
                      placeholder="e.g., Policy Document"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="material-url">URL:</label>
                    <input 
                      type="url" 
                      id="material-url" 
                      value={materialUrl} 
                      onChange={handleMaterialUrlChange}
                      className="form-input"
                      placeholder="https://example.com/document"
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-add-link"
                    onClick={handleAddLinkMaterial}
                  >
                    <LinkIcon size={16} />
                    Add Link
                  </button>
                </div>
              </div>
              
              {/* Upload File Material */}
              <div className="add-material-section">
                <h5>Upload File</h5>
                <div className="upload-file-form">
                  <div className="form-group">
                    <label htmlFor="file-name">Name:</label>
                    <input 
                      type="text" 
                      id="file-name" 
                      value={materialName} 
                      onChange={handleMaterialNameChange}
                      className="form-input"
                      placeholder="e.g., Training Guide"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="file-upload">File:</label>
                    <input 
                      type="file" 
                      id="file-upload" 
                      onChange={handleFileChange}
                      className="form-file-input"
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-upload-file"
                    onClick={handleUploadMaterial}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Clock size={16} className="icon-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                <XCircle size={18} />
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? (
                  <>
                    <Clock size={18} className="icon-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
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

export default EditRefresherCourse;