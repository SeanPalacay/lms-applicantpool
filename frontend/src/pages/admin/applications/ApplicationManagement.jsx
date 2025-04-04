import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Filter, RefreshCw, Eye, UserCheck, UserX, File,ExternalLink,
  UserPlus, Download, FileText, Mail, Clock, CheckCircle, 
  XCircle, AlertTriangle, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import adminService from '../../../services/adminService';

const ApplicationManagement = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [action, setAction] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [expandedIds, setExpandedIds] = useState([]);
    const [filters, setFilters] = useState({
      status: '',
      department: '',
      search: ''
    });
    const [departments, setDepartments] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
  
    useEffect(() => {
      fetchApplications();
      fetchDepartments();
    }, []);
  
    useEffect(() => {
      if (showModal && selectedApplication) {
        fetchDocuments(selectedApplication.user_id);
      }
    }, [showModal, selectedApplication]);


  // New function to fetch documents
  const fetchDocuments = async (userId) => {
    try {
      const docs = await adminService.getUserDocuments(userId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocuments([]);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      await adminService.viewUserDocument(documentId);
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to view document.');
    }
  };
  
  const fetchApplications = async () => {
    try {
      setLoading(true);
      let response = [];
      if (typeof adminService.getApplications === 'function') {
        response = await adminService.getApplications(filters);
      } else {
        const dashboardData = await adminService.getDashboardData();
        response = dashboardData.applications || [];
      }
      setApplications(response || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepartments = async () => {
    try {
      if (typeof adminService.getDepartments === 'function') {
        const response = await adminService.getDepartments();
        setDepartments(response || []);
      } else {
        setDepartments([
          'Human Resources',
          'Accounting and Finance',
          'Operations',
          'Client Development and Services',
          'Compliance and Strategic Support',
          'Internal Audit',
          'General Services'
        ]);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const applyFilters = () => {
    fetchApplications();
  };
  
  const resetFilters = () => {
    setFilters({
      status: '',
      department: '',
      search: ''
    });
    setTimeout(() => {
      fetchApplications();
    }, 100);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchApplications();
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
    setDocuments([]); // Reset documents when closing
    setAction('');
    setActionReason('');
    setProcessingAction(false);
  };
  
  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(expandedId => expandedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#f39c12', background: '#fef5e7', icon: <Clock size={16} /> };
      case 'shortlisted':
        return { color: '#2ecc71', background: '#e6ffe6', icon: <CheckCircle size={16} /> };
      case 'hired':
        return { color: '#3498db', background: '#e6f7ff', icon: <UserCheck size={16} /> };
      case 'rejected':
        return { color: '#e74c3c', background: '#ffe6e6', icon: <XCircle size={16} /> };
      default:
        return { color: '#7f8c8d', background: '#f1f5f9', icon: <AlertTriangle size={16} /> };
    }
  };
  
  const handleAction = (applicationId, actionType) => {
    setSelectedApplication(applications.find(app => app.id === applicationId));
    setAction(actionType);
    setActionReason('');
  };
  
  const confirmAction = async () => {
    try {
      setProcessingAction(true);
      
      let newStatus;
      let successMessage;
      
      switch (action) {
        case 'waitlist':
          newStatus = 'shortlisted';
          successMessage = 'Applicant has been waitlisted (shortlisted)';
          break;
        case 'reject':
          newStatus = 'rejected';
          successMessage = 'Application has been rejected';
          break;
        case 'hire':
          newStatus = 'hired';
          successMessage = 'Applicant has been hired';
          break;
        default:
          throw new Error('Invalid action type');
      }
      
      // Update application status if method exists
      if (typeof adminService.updateApplicationStatus === 'function') {
        await adminService.updateApplicationStatus(selectedApplication.id, newStatus);
      } else {
        console.log('updateApplicationStatus method not available - would update to status:', newStatus);
      }
      
      // If hiring, convert applicant to trainee if method exists
      if (action === 'hire') {
        if (typeof adminService.convertApplicantToTrainee === 'function') {
          await adminService.convertApplicantToTrainee(
            selectedApplication.user_id, 
            {
              note: actionReason,
              application_id: selectedApplication.id
            }
          );
        } else {
          console.log('convertApplicantToTrainee method not available - would convert user:', selectedApplication.user_id);
        }
      }
      
      // Refresh the application list
      fetchApplications();
      
      alert(successMessage);
      closeModal();
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);
      alert(`Failed to ${action} applicant: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };
  
  const exportApplications = async () => {
    try {
      if (typeof adminService.exportApplicants === 'function') {
        await adminService.exportApplicants('csv', filters);
      } else {
        console.log('exportApplicants method not available');
        alert('Export functionality is not available yet.');
      }
    } catch (err) {
      console.error('Error exporting applications:', err);
      alert('Failed to export applications.');
    }
  };
  
  return (
    <div className="admin-application-management" style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#1e293b'
        }}>
          <Users size={24} /> Application Management
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={exportApplications}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={fetchApplications}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        padding: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search applicants by name or position..."
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginLeft: '12px',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {showFilters && (
  <div style={{ 
    padding: '16px', 
    borderRadius: '6px', 
    backgroundColor: '#f8fafc', 
    marginTop: '12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  }}>
    <div>
      <label htmlFor="status" style={{ fontSize: '14px', fontWeight: '500', color: '#475569', display: 'block', marginBottom: '6px' }}>Status</label>
      <select
        id="status"
        name="status"
        value={filters.status}
        onChange={handleFilterChange}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: 'white',
          fontSize: '14px'
        }}
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
    
    <div>
      <label htmlFor="department" style={{ fontSize: '14px', fontWeight: '500', color: '#475569', display: 'block', marginBottom: '6px' }}>Department</label>
      <select
        id="department"
        name="department"
        value={filters.department}
        onChange={handleFilterChange}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: 'white',
          fontSize: '14px'
        }}
      >
        <option value="">All Departments</option>
        {departments.map((dept, index) => (
          <option key={dept.id || index} value={dept.department}>
            {dept.department}
          </option>
        ))}
      </select>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      <button
        onClick={applyFilters}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Apply Filters
      </button>
      <button
        onClick={resetFilters}
        style={{
          padding: '8px 16px',
          backgroundColor: 'white',
          color: '#64748b',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
    </div>
  </div>
)}
      </div>
      
      {/* Applications List Section */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <RefreshCw size={30} style={{ color: '#64748b', animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          padding: '16px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      ) : applications.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
          padding: '24px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Users size={40} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>No Applications Found</h3>
          <p>No applicants match your current filters. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Applicant</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Position</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Applied Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const statusInfo = getStatusInfo(application.status);
                const isExpanded = expandedIds.includes(application.id);
                
                return (
                  <React.Fragment key={application.id}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e2e8f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#64748b', 
                            fontWeight: '600', 
                            fontSize: '16px' 
                          }}>
                            {application.full_name ? application.full_name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{application.full_name || 'Anonymous Applicant'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{application.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1e293b' }}>
                        <div>{application.position_name || 'Unknown Position'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{application.department || 'No department'}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: '#64748b' }} />
                          {formatDate(application.applied_at)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 10px', 
                          borderRadius: '16px', 
                          backgroundColor: statusInfo.background, 
                          color: statusInfo.color, 
                          fontSize: '12px', 
                          fontWeight: '500' 
                        }}>
                          {statusInfo.icon} 
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => toggleExpand(application.id)}
                            style={{
                              padding: '8px',
                              backgroundColor: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handleViewDetails(application)}
                            style={{
                              padding: '8px',
                              backgroundColor: '#f1f5f9',
                              color: '#2563eb',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan="5" style={{ padding: '16px 24px', fontSize: '14px', color: '#1e293b' }}>
                          <div style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: '16px' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Reasons for Applying:</h4>
                              <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{application.reasons || 'No reasons provided'}</p>
                            </div>
                            
                            {application.skills && (
                              <div style={{ marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Skills:</h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{application.skills}</p>
                              </div>
                            )}
                            
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                              {application.status !== 'hired' && (
                                <button
                                  onClick={() => handleAction(application.id, 'hire')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <UserPlus size={16} /> Make Trainee
                                </button>
                              )}
                              
                              {application.status !== 'shortlisted' && (
                                <button
                                  onClick={() => handleAction(application.id, 'waitlist')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <UserCheck size={16} /> Waitlist
                                </button>
                              )}
                              
                              {application.status !== 'rejected' && (
                                <button
                                  onClick={() => handleAction(application.id, 'reject')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <UserX size={16} /> Reject
                                </button>
                              )}
                              
                              <button
                                onClick={() => window.open(`/admin/applicants/${application.user_id}`, '_blank')}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  backgroundColor: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                <FileText size={16} /> View Profile
                              </button>
                              
                              <button
                                onClick={() => window.open(`mailto:${application.email}`, '_blank')}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  backgroundColor: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                <Mail size={16} /> Email
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Application Details</h2>
              <button onClick={closeModal} style={{ padding: '8px', fontSize: '20px', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                ×
              </button>
            </div>
            
            {action ? (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  {action === 'waitlist' ? 'Waitlist Applicant' : 
                   action === 'reject' ? 'Reject Application' : 
                   'Convert to Trainee'}
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="actionReason" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    {action === 'waitlist' ? 'Waitlist Reason:' : 
                     action === 'reject' ? 'Rejection Reason:' : 
                     'Notes:'}
                  </label>
                  <textarea
                    id="actionReason"
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    placeholder={action === 'waitlist' ? 'Reason for waitlisting this applicant...' : 
                                 action === 'reject' ? 'Reason for rejecting this application...' : 
                                 'Additional notes for trainee conversion...'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      minHeight: '120px',
                      fontSize: '14px'
                    }}
                  ></textarea>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={processingAction}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: action === 'reject' ? '#dc2626' : action === 'waitlist' ? '#16a34a' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: processingAction ? 'not-allowed' : 'pointer',
                      opacity: processingAction ? 0.7 : 1
                    }}
                  >
                    {processingAction ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e2e8f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#64748b', 
                    fontWeight: '600', 
                    fontSize: '20px' 
                  }}>
                    {selectedApplication.full_name ? selectedApplication.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {selectedApplication.full_name || 'Anonymous Applicant'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      {selectedApplication.email || 'No email provided'}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    {(() => {
                      const statusInfo = getStatusInfo(selectedApplication.status);
                      return (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 12px', 
                          borderRadius: '16px', 
                          backgroundColor: statusInfo.background, 
                          color: statusInfo.color, 
                          fontSize: '14px', 
                          fontWeight: '500' 
                        }}>
                          {statusInfo.icon} 
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px', 
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 4px 0' }}>Applied Position</h4>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{selectedApplication.position_name || 'Unknown Position'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 4px 0' }}>Department</h4>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{selectedApplication.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 4px 0' }}>Applied Date</h4>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{formatDate(selectedApplication.applied_at)}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 4px 0' }}>Last Updated</h4>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{formatDate(selectedApplication.updated_at)}</p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Reasons for Applying</h4>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {selectedApplication.reasons || 'No reasons provided'}
                  </div>
                </div>
                
                {selectedApplication.experience && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Experience</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedApplication.experience}
                    </div>
                  </div>
                )}
                
                {selectedApplication.skills && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Skills</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedApplication.skills}
                    </div>
                  </div>
                )}
                
                {selectedApplication.education && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Education</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedApplication.education}
                    </div>
                  </div>
                )}
                
                {selectedApplication.availability && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Availability</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedApplication.availability}
                    </div>
                  </div>
                )}
                
                {selectedApplication.references && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>References</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedApplication.references}
                    </div>
                  </div>
                )}

                {/* New Documents Section */}
       {/* Updated Documents Section */}
       <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Documents</h4>
                  {documents.length > 0 ? (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {documents.map((doc) => (
                          <li key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <File size={16} style={{ color: '#64748b' }} />
                              <span>{doc.description || 'Unnamed Document'} {doc.category ? `(${doc.category})` : ''}</span>
                            </div>
                            <button
                              onClick={() => handleViewDocument(doc.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#16a34a', // Green for view
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <ExternalLink size={14} /> View
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      No documents available
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedApplication.status !== 'rejected' && (
                      <button
                        onClick={() => setAction('reject')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <UserX size={16} /> Reject
                      </button>
                    )}
                    
                    {selectedApplication.status !== 'shortlisted' && (
                      <button
                        onClick={() => setAction('waitlist')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <UserCheck size={16} /> Waitlist
                      </button>
                    )}
                    
                    {selectedApplication.status !== 'hired' && (
                      <button
                        onClick={() => setAction('hire')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <UserPlus size={16} /> Make Trainee
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;