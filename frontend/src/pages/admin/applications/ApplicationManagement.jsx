import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Filter, RefreshCw, Eye, UserCheck, UserX, File, ExternalLink,
  UserPlus, Download, FileText, Mail, Clock, CheckCircle, 
  XCircle, AlertTriangle, ChevronDown, ChevronUp, Calendar, List, Briefcase
} from 'lucide-react';
import adminService from '../../../services/adminService';

const ApplicationManagement = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [positions, setPositions] = useState([]);
    const [waitlists, setWaitlists] = useState({}); // Store waitlists by position_id
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
      position: '',
      search: ''
    });
    const [departments, setDepartments] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
      fetchPositions();
      fetchApplications();
      fetchDepartments();
      fetchWaitlists();
    }, []);

    useEffect(() => {
      if (showModal && selectedApplication) {
        fetchDocuments(selectedApplication.user_id);
      }
    }, [showModal, selectedApplication]);

    const fetchPositions = async () => {
      try {
        const positionsData = await adminService.getJobPositions();
        console.log('Fetched positions:', positionsData);
        setPositions(positionsData || []);
      } catch (err) {
        console.error('Error fetching positions:', err);
      }
    };

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
        
        // Sort applications by applied_at for FCFS
        response.sort((a, b) => new Date(a.applied_at) - new Date(b.applied_at));
        
        // Make sure all position names are properly set
        if (positions.length > 0) {
          response = response.map(app => {
            const position = positions.find(p => p.id === app.position_id);
            return {
              ...app,
              position_name: position ? position.name : app.position_name || `Position ${app.position_id}`
            };
          });
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

    const fetchWaitlists = async () => {
      try {
        // First get all positions
        const positions = await adminService.getJobPositions();
        const waitlistData = {};
        
        for (const position of positions) {
          // For each position, get its waitlist
          const waitlist = await adminService.getWaitlistByPosition(position.id);
          // Sort by application date for FCFS
          waitlistData[position.id] = {
            position_name: position.name, // Use name instead of position_name
            department: position.department,
            waitlist: waitlist.sort((a, b) => new Date(a.applied_at) - new Date(b.applied_at))
          };
        }
        setWaitlists(waitlistData);
      } catch (err) {
        console.error('Error fetching waitlists:', err);
        setError('Failed to load waitlists. Please try again.');
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
        position: '',
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
      setDocuments([]);
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
        case 'waitlisted':
          return { color: '#8e44ad', background: '#f3e8ff', icon: <List size={16} /> };
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
            newStatus = 'waitlisted';
            successMessage = 'Applicant has been waitlisted';
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
        await adminService.updateApplicationStatus(selectedApplication.id, newStatus, actionReason);
        if (action === 'hire') {
          if (typeof adminService.convertApplicantToTrainee === 'function') {
            await adminService.convertApplicantToTrainee(
              selectedApplication.user_id, 
              {
                note: actionReason,
                application_id: selectedApplication.id
              }
            );
          }
          // Move the next waitlisted applicant to Applied
          await adminService.moveNextWaitlistedToApplied(selectedApplication.position_id);
        }
        fetchApplications();
        fetchWaitlists();
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

    // Get count of applications by status
    const getStatusCounts = () => {
      const counts = {
        pending: 0,
        waitlisted: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
        total: applications.length
      };
      
      applications.forEach(app => {
        if (counts.hasOwnProperty(app.status)) {
          counts[app.status]++;
        }
      });
      
      return counts;
    };
    
    const statusCounts = getStatusCounts();

    return (
      <div className="admin-application-management" style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Header */}
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
              onClick={() => { fetchApplications(); fetchWaitlists(); }}
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

        {/* Summary Stats */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#3498db' }}>{statusCounts.total}</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Total Applications</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f39c12' }}>{statusCounts.pending}</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Pending</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#8e44ad' }}>{statusCounts.waitlisted}</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Waitlisted</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#3498db' }}>{statusCounts.hired}</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Hired</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e74c3c' }}>{statusCounts.rejected}</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Rejected</div>
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
                  <option value="waitlisted">Waitlisted</option>
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
                    <option key={dept.id || index} value={dept.department || dept}>
                      {dept.department || dept}
                    </option>
                  ))}
                </select>
              </div>
           <div>
  <label htmlFor="position" style={{ fontSize: '14px', fontWeight: '500', color: '#475569', display: 'block', marginBottom: '6px' }}>Position</label>
  <select
    id="position"
    name="position"
    value={filters.position}
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
    <option value="">All Positions</option>
    {positions.map((pos) => (
      <option key={pos.id} value={pos.id}>
        {pos.name} {/* Use name instead of position_name */}
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

        {/* Waitlist Summary Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <List size={20} style={{ color: '#8e44ad' }} /> 
            Waitlist Summary
          </h2>
          
          {Object.entries(waitlists).length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
              {Object.entries(waitlists).map(([positionId, positionData]) => (
                positionData.waitlist && positionData.waitlist.length > 0 ? (
                  <div key={positionId} style={{ 
                    padding: '12px', 
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '15px', 
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                      <Briefcase size={16} /> 
                      {positionData.position_name || `Position ${positionId}`}
                    </div>
                    <div style={{ color: '#64748b', marginBottom: '8px' }}>
                      {positionData.waitlist.length} applicant(s) waitlisted
                    </div>
                    {positionData.waitlist.length > 0 && (
                      <div style={{ 
                        marginTop: '8px', 
                        borderTop: '1px dashed #e2e8f0', 
                        paddingTop: '8px' 
                      }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Next in line:</div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px' 
                        }}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            backgroundColor: '#8e44ad', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '12px', 
                            fontWeight: '500' 
                          }}>
                            {positionData.waitlist[0]?.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{ fontWeight: '500' }}>
                            {positionData.waitlist[0]?.full_name || 'Unknown Applicant'}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Applied: {formatDate(positionData.waitlist[0]?.applied_at)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#64748b',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <List size={30} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: '500' }}>No waitlisted applicants</p>
              <p style={{ margin: '8px 0 0', fontSize: '14px' }}>When applicants are waitlisted, they'll appear here</p>
            </div>
          )}
        </div>

        {/* Applications List Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={20} style={{ color: '#2563eb' }} /> 
            Applications
          </h2>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px'
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
              padding: '24px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Users size={40} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>No Applications Found</h3>
              <p>No applicants match your current filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div style={{ overflow: 'hidden' }}>
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
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500'
                            }}>
                              <Briefcase size={14} style={{ color: '#64748b' }} />
                              {application.position_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{application.department || 'No department'}</div>
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
                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
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
                                  {application.status !== 'waitlisted' && (
                                    <button
                                      onClick={() => handleAction(application.id, 'waitlist')}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        backgroundColor: '#8e44ad',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <List size={16} /> Waitlist
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
        </div>

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
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {action ? (
                    action === 'waitlist' ? <List size={20} style={{ color: '#8e44ad' }} /> : 
                    action === 'reject' ? <UserX size={20} style={{ color: '#dc2626' }} /> : 
                    <UserPlus size={20} style={{ color: '#2563eb' }} />
                  ) : (
                    <Eye size={20} style={{ color: '#2563eb' }} />
                  )}
                  {action ? (
                    action === 'waitlist' ? 'Waitlist Applicant' : 
                    action === 'reject' ? 'Reject Application' : 
                    'Convert to Trainee'
                  ) : (
                    'Application Details'
                  )}
                </h2>
                <button 
                  onClick={closeModal} 
                  style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#f1f5f9',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#64748b'
                  }}
                >
                  ×
                </button>
              </div>
              
              {action ? (
                <div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#64748b', 
                        fontWeight: '600', 
                        fontSize: '18px' 
                      }}>
                        {selectedApplication.full_name ? selectedApplication.full_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{selectedApplication.full_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                          <Briefcase size={14} /> {selectedApplication.position_name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="actionReason" style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      color: '#334155' 
                    }}>
                      {action === 'waitlist' ? 'Waitlist Reason:' : 
                       action === 'reject' ? 'Rejection Reason:' : 
                       'Notes for Trainee Conversion:'}
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
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                    ></textarea>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
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
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAction}
                      disabled={processingAction}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: action === 'reject' ? '#dc2626' : action === 'waitlist' ? '#8e44ad' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: processingAction ? 'not-allowed' : 'pointer',
                        opacity: processingAction ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {processingAction ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#64748b', 
                      fontWeight: '600', 
                      fontSize: '22px' 
                    }}>
                      {selectedApplication.full_name ? selectedApplication.full_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {selectedApplication.full_name || 'Anonymous Applicant'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '14px', 
                          color: '#64748b'
                        }}>
                          <Mail size={14} /> {selectedApplication.email || 'No email provided'}
                        </span>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '14px', 
                          color: '#64748b' 
                        }}>
                          <Calendar size={14} /> Applied on {formatDate(selectedApplication.applied_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const statusInfo = getStatusInfo(selectedApplication.status);
                        return (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            padding: '8px 12px', 
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
                    marginBottom: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#334155',
                        margin: '0 0 12px 0'
                      }}>
                        <Briefcase size={16} /> Position Details
                      </h4>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Applied For</div>
                        <div style={{ fontSize: '15px', fontWeight: '500' }}>{selectedApplication.position_name || 'Unknown Position'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Department</div>
                        <div style={{ fontSize: '15px' }}>{selectedApplication.department || 'Not specified'}</div>
                      </div>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#334155',
                        margin: '0 0 12px 0'
                      }}>
                        <Clock size={16} /> Timeline
                      </h4>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Applied Date</div>
                        <div style={{ fontSize: '15px' }}>{formatDate(selectedApplication.applied_at)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Last Updated</div>
                        <div style={{ fontSize: '15px' }}>{formatDate(selectedApplication.updated_at)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Reasons for Applying
                    </h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      border: '1px solid #e2e8f0'
                    }}>
                      {selectedApplication.reasons || 'No reasons provided'}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    {selectedApplication.experience && (
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Experience</h4>
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: '1px solid #e2e8f0',
                          height: '100%'
                        }}>
                          {selectedApplication.experience}
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.skills && (
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Skills</h4>
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: '1px solid #e2e8f0',
                          height: '100%'
                        }}>
                          {selectedApplication.skills}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    {selectedApplication.education && (
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Education</h4>
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: '1px solid #e2e8f0',
                          height: '100%'
                        }}>
                          {selectedApplication.education}
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.availability && (
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Availability</h4>
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: '1px solid #e2e8f0',
                          height: '100%'
                        }}>
                          {selectedApplication.availability}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedApplication.references && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>References</h4>
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        border: '1px solid #e2e8f0'
                      }}>
                        {selectedApplication.references}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <File size={16} /> Documents
                    </h4>
                    {documents.length > 0 ? (
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        border: '1px solid #e2e8f0'
                      }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {documents.map((doc) => (
                            <li key={doc.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              marginBottom: doc.id !== documents[documents.length-1].id ? '12px' : 0,
                              paddingBottom: doc.id !== documents[documents.length-1].id ? '12px' : 0,
                              borderBottom: doc.id !== documents[documents.length-1].id ? '1px solid #e2e8f0' : 'none'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <File size={16} style={{ color: '#64748b' }} />
                                <span>{doc.description || 'Unnamed Document'} {doc.category ? `(${doc.category})` : ''}</span>
                              </div>
                              <button
                                onClick={() => handleViewDocument(doc.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#16a34a',
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
                        color: '#64748b',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                      }}>
                        <File size={20} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                        <p style={{ margin: 0 }}>No documents available</p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'}}>
                    <div style={{ 
                      flex: 1, 
                      fontSize: '14px', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      Select an action to process this application
                    </div>
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
                      {selectedApplication.status !== 'waitlisted' && (
                        <button
                          onClick={() => setAction('waitlist')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            backgroundColor: '#8e44ad',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <List size={16} /> Waitlist
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