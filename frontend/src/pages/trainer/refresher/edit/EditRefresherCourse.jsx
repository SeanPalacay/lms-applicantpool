import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  RotateCw, Save, XCircle, Clock, Calendar, Info, 
  Link as LinkIcon, ArrowLeft, AlertTriangle, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

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
      <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        <AlertBanner message="Refresher course not found" type="error" />
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => navigate('/trainer/refresher-courses')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
          >
            <ArrowLeft size={18} />
            <span>Back to Refresher Courses</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(`/trainer/refresher-courses/${courseId}`)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F8FAFC', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Course Details</span>
        </button>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #FFB74D, #FB8C00)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
            <RotateCw size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Edit Refresher Course</h3>
          </div>
        </div>
        
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Info size={18} />
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Course Information</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="title" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                  <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> Title:
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                  placeholder="Enter course title"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="description" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Description:</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', minHeight: '100px' }}
                  placeholder="Enter course description"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="related_program_id" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Related Program:</label>
                <select 
                  id="related_program_id" 
                  name="related_program_id" 
                  value={formData.related_program_id} 
                  onChange={handleChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                >
                  <option value="">None (Standalone Course)</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="duration_days" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                  <span style={{ color: '#E53E3E', marginRight: '4px' }}>*</span> Duration (days):
                </label>
                <input 
                  type="number" 
                  id="duration_days" 
                  name="duration_days" 
                  value={formData.duration_days} 
                  onChange={handleChange}
                  min="1"
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="status" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Status:</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                >
                  <option value="draft">Draft (Not Visible to Trainees)</option>
                  <option value="active">Active (Available for Enrollment)</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText size={18} />
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Course Content</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="content" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Content:</label>
                <textarea 
                  id="content" 
                  name="content" 
                  value={formData.content} 
                  onChange={handleChange}
                  style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', minHeight: '200px' }}
                  placeholder="Enter course content (supports basic formatting)"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <LinkIcon size={18} />
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Course Materials</h4>
              </div>
              
              {/* Materials List */}
              {formData.materials.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.materials.map((material, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: '#F8FAFC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {material.type === 'link' ? <LinkIcon size={16} /> : <FileText size={16} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{material.name}</span>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>{material.type === 'link' ? 'External Link' : 'Uploaded File'}</span>
                      </div>
                      <button 
                        type="button" 
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '9999px', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                        onClick={() => handleRemoveMaterial(index)}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Link Material */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Add External Link</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="material-name" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Name:</label>
                    <input 
                      type="text" 
                      id="material-name" 
                      value={materialName} 
                      onChange={handleMaterialNameChange}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                      placeholder="e.g., Policy Document"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="material-url" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>URL:</label>
                    <input 
                      type="url" 
                      id="material-url" 
                      value={materialUrl} 
                      onChange={handleMaterialUrlChange}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                      placeholder="https://example.com/document"
                    />
                  </div>
                  <button 
                    type="button" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={handleAddLinkMaterial}
                  >
                    <LinkIcon size={16} />
                    Add Link
                  </button>
                </div>
              </div>
              
              {/* Upload File Material */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', margin: '0' }}>Upload File</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="file-name" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Name:</label>
                    <input 
                      type="text" 
                      id="file-name" 
                      value={materialName} 
                      onChange={handleMaterialNameChange}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                      placeholder="e.g., Training Guide"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="file-upload" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>File:</label>
                    <input 
                      type="file" 
                      id="file-upload" 
                      onChange={handleFileChange}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '14px', color: '#1E293B', backgroundColor: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                    />
                  </div>
                  <button 
                    type="button" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease', opacity: uploading ? 0.7 : 1 }}
                    onClick={handleUploadMaterial}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease', opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Clock size={18} style={{ animation: 'spin 1s linear infinite' }} />
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