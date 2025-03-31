import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const EnrollTrainees = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [program, setProgram] = useState({});
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get program details
        const programData = await trainerService.getProgramDetails(programId);
        setProgram(programData);
        
        // Get all trainees
        const traineesData = await trainerService.getTrainees();
        
        // Filter out already enrolled trainees
        const enrolledTraineeIds = programData.enrollments 
          ? programData.enrollments.map(enrollment => enrollment.user_id) 
          : [];
          
        const available = traineesData.filter(trainee => 
          !enrolledTraineeIds.includes(trainee.id)
        );
        
        setAvailableTrainees(available);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]);

  const handleSelectAll = () => {
    if (selectedTrainees.length === availableTrainees.length) {
      setSelectedTrainees([]);
    } else {
      setSelectedTrainees(availableTrainees.map(trainee => trainee.id));
    }
  };

  const handleSelectTrainee = (traineeId) => {
    if (selectedTrainees.includes(traineeId)) {
      setSelectedTrainees(selectedTrainees.filter(id => id !== traineeId));
    } else {
      setSelectedTrainees([...selectedTrainees, traineeId]);
    }
  };

  const handleEnrollTrainees = async () => {
    if (selectedTrainees.length === 0) {
      setError('Please select at least one trainee to enroll');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await trainerService.enrollTrainees(programId, selectedTrainees);
      
      if (result.success) {
        setSuccess(`Successfully enrolled ${result.stats.newly_enrolled} new trainees.`);
        setEnrollmentStats(result.stats);
        // Clear selection after successful enrollment
        setSelectedTrainees([]);
        
        // Refresh available trainees list
        const traineesData = await trainerService.getTrainees();
        const programData = await trainerService.getProgramDetails(programId);
        
        const enrolledTraineeIds = programData.enrollments 
          ? programData.enrollments.map(enrollment => enrollment.user_id) 
          : [];
          
        const available = traineesData.filter(trainee => 
          !enrolledTraineeIds.includes(trainee.id)
        );
        
        setAvailableTrainees(available);
      } else {
        setError(result.error || 'Failed to enroll trainees');
      }
    } catch (err) {
      console.error('Error enrolling trainees:', err);
      setError(err.message || 'Failed to enroll trainees');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(`/trainer/programs/${programId}`);
  };

  if (loading && !availableTrainees.length) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
          Enroll Trainees
        </h1>
        <div style={{ height: '2px', width: '60px', backgroundColor: 'var(--primary-color)' }}></div>
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
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          color: 'var(--primary-color)', 
          cursor: 'pointer', 
          marginBottom: 'var(--spacing-md)' 
        }}
        onClick={goBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Program</span>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
          Enroll Trainees in: {program.title}
        </h2>
        
        {/* Enrollment Stats if available */}
        {enrollmentStats && (
          <div style={{ 
            backgroundColor: 'var(--primary-ultralight)', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
              Enrollment Results:
            </h3>
            <ul style={{ paddingLeft: 'var(--spacing-md)' }}>
              <li>Total trainees requested: {enrollmentStats.total_requested}</li>
              <li>Already enrolled: {enrollmentStats.already_enrolled}</li>
              <li>Newly enrolled: {enrollmentStats.newly_enrolled}</li>
            </ul>
          </div>
        )}
        
        {/* Trainee Selection */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
              Available Trainees ({availableTrainees.length})
            </h3>
            
            <div>
              <button
                onClick={handleSelectAll}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-xs) var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-ultralight)', 
                  color: 'var(--primary-color)', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                {selectedTrainees.length === availableTrainees.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={handleEnrollTrainees}
                disabled={selectedTrainees.length === 0 || loading}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-xs) var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: selectedTrainees.length === 0 || loading ? 'not-allowed' : 'pointer',
                  opacity: selectedTrainees.length === 0 || loading ? 0.7 : 1,
                  marginLeft: 'var(--spacing-sm)'
                }}
              >
                <UserPlus size={16} />
                {loading ? 'Enrolling...' : `Enroll Selected (${selectedTrainees.length})`}
              </button>
            </div>
          </div>
          
          {availableTrainees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
              <p>All trainees are already enrolled in this program.</p>
            </div>
          ) : (
            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-sm)' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--light-gray)' }}>
                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--medium-gray)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        Select
                      </div>
                    </th>
                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--medium-gray)' }}>Name</th>
                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--medium-gray)' }}>Email</th>
                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', borderBottom: '1px solid var(--medium-gray)' }}>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTrainees.map((trainee) => (
                    <tr 
                      key={trainee.id} 
                      style={{ 
                        borderBottom: '1px solid var(--medium-gray)',
                        backgroundColor: selectedTrainees.includes(trainee.id) ? 'var(--primary-ultralight)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-sm)' }}>
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => handleSelectTrainee(trainee.id)}
                        >
                          {selectedTrainees.includes(trainee.id) ? (
                            <CheckCircle size={20} color="var(--primary-color)" />
                          ) : (
                            <div 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                border: '1px solid var(--medium-gray)', 
                                borderRadius: '3px' 
                              }} 
                            />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>{trainee.full_name}</td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>{trainee.email}</td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>{trainee.department || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollTrainees;