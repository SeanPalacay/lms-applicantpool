import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Clock, User, FileText,
  Filter, X, Check, BarChart2, Award, AlertCircle
} from 'lucide-react';
import trainerService from '../../../../services/trainerService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const TrainerGradePracticalExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ungradedOnly, setUngradedOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState([]);

  // State for the GRADING modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [gradeData, setGradeData] = useState({ score: 0, feedback: '' });

  // State for the SUBMISSION modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // -----------------------------
  // Fetch Data
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch exam details
        const examData = await trainerService.getPracticalExamById(examId);
        setExamDetails(examData);

        // 2. Fetch attempts (ungraded only by default)
        const attemptsData = await trainerService.getPracticalExamAttempts(examId, {
          ungraded_only: ungradedOnly ? 1 : 0
        });
        setAttempts(attemptsData || []);
        setFilteredAttempts(attemptsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load exam data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, ungradedOnly]);

  // -----------------------------
  // Filter Attempts by Trainee Name
  // -----------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAttempts(attempts);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = attempts.filter((attempt) =>
      attempt.trainee_name && attempt.trainee_name.toLowerCase().includes(term)
    );
    setFilteredAttempts(filtered);
  }, [searchTerm, attempts]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleGradeClick = (attempt) => {
    setSelectedAttempt(attempt);
    setGradeData({
      score: attempt.score || 0,
      feedback: attempt.feedback || ''
    });
    setShowGradeModal(true);
  };

  const handleGradeChange = (e) => {
    const { name, value } = e.target;
    if (name === 'score') {
      const safeScore = Math.min(
        Math.max(0, Number(value)),
        examDetails?.max_score || 100
      );
      setGradeData((prev) => ({ ...prev, score: safeScore }));
    } else {
      setGradeData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    try {
      await trainerService.gradePracticalExam(
        selectedAttempt.id,
        gradeData.score,
        gradeData.feedback
      );

      // Update attempt in local state
      setAttempts(attempts.map((a) =>
        a.id === selectedAttempt.id
          ? { 
              ...a,
              score: gradeData.score,
              feedback: gradeData.feedback,
              graded_at: new Date().toISOString()
            }
          : a
      ));

      // Filter out if "ungraded only" is active
      if (ungradedOnly) {
        setAttempts(attempts.filter((a) => a.id !== selectedAttempt.id));
        setFilteredAttempts(filteredAttempts.filter((a) => a.id !== selectedAttempt.id));
      }

      setSuccess(`Grade submitted successfully for ${selectedAttempt.trainee_name}`);
      setShowGradeModal(false);

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error submitting grade:', err);
      setError(err.message || 'Failed to submit grade. Please try again.');
    }
  };

  const handleViewSubmission = (attempt) => {
    // Show a separate modal for submission details
    setSelectedSubmission(attempt);
    setShowSubmissionModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!examDetails) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Exam Not Found</h2>
        <p>
          The practical exam you are trying to view does not exist
          or you don't have permission to access it.
        </p>
        <button
          onClick={() => navigate('/trainer/practical-exams')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Practical Exams
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate(`/trainer/practical-exams/${examId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: '0' }}>
              Grade: {examDetails.title}
            </h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Program: {examDetails.program_title || 'Unknown Program'}
            </div>
          </div>
        </div>
        <div
          style={{
            height: '2px',
            width: '60px',
            backgroundColor: '#007bff',
            marginTop: '5px',
            marginLeft: '52px'
          }}
        />
      </div>

      {/* Alerts */}
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

      {/* Exam Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#666',
              marginBottom: '10px'
            }}
          >
            <BarChart2 size={18} />
            <span>Exam Stats</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '15px'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Submissions</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                {examDetails?.stats?.total_attempts || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Average Score</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                {examDetails?.stats?.average_score
                  ? Number(examDetails.stats.average_score).toFixed(1)
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Max Score</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                {examDetails?.max_score || 100}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}
      >
        <div style={{ position: 'relative', width: '300px' }}>
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666'
            }}
          >
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by trainee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
          {searchTerm && (
            <button
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={ungradedOnly}
              onChange={() => setUngradedOnly(!ungradedOnly)}
              style={{ cursor: 'pointer' }}
            />
            <span>Show ungraded only</span>
          </label>

          <button
            onClick={() => setUngradedOnly(!ungradedOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: ungradedOnly ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} />
            <span>Ungraded</span>
          </button>
        </div>
      </div>

      {/* Attempts Table */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {filteredAttempts.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Trainee</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Submitted</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Score</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((attempt) => (
                <tr key={attempt.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#666" />
                      <span>{attempt.trainee_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#666'
                      }}
                    >
                      <Clock size={16} />
                      <span>{formatDate(attempt.submitted_at)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: attempt.graded_at ? '#d4edda' : '#fff3cd',
                        color: attempt.graded_at ? '#155724' : '#856404'
                      }}
                    >
                      {attempt.graded_at ? 'Graded' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {attempt.graded_at ? (
                      <span style={{ fontWeight: '500' }}>
                        {attempt.score} / {examDetails.max_score}
                      </span>
                    ) : (
                      <span style={{ color: '#666' }}>Not graded</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    {/* NEW: View Submission Button */}
                    <button
                      onClick={() => handleViewSubmission(attempt)}
                      style={{
                        marginRight: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={16} />
                      View Submission
                    </button>

                    {/* Grade Button */}
                    <button
                      onClick={() => handleGradeClick(attempt)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <Award size={16} />
                      {attempt.graded_at ? 'Update Grade' : 'Grade'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <AlertCircle size={48} style={{ marginBottom: '15px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
              No Submissions Found
            </h3>
            <p>
              {ungradedOnly
                ? 'No ungraded submissions found. Try showing all submissions.'
                : 'No submissions have been made for this practical exam yet.'}
            </p>
            {ungradedOnly && (
              <button
                onClick={() => setUngradedOnly(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  marginTop: '15px'
                }}
              >
                <Filter size={16} />
                <span>Show All Submissions</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------
         GRADE MODAL (For entering score/feedback only)
         --------------------------------------------------------- */}
      {showGradeModal && selectedAttempt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#333',
                  margin: 0
                }}
              >
                Grade Submission
              </h2>
              <button
                onClick={() => setShowGradeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Trainee & Exam Info */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '5px'
                }}
              >
                <User size={16} color="#666" />
                <span style={{ fontWeight: '500' }}>
                  {selectedAttempt.trainee_name}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                <FileText size={16} />
                <span>{examDetails.title}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                <Clock size={16} />
                <span>Submitted: {formatDate(selectedAttempt.submitted_at)}</span>
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSubmitGrade}>
              <div style={{ marginBottom: '15px' }}>
                <label
                  htmlFor="score"
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500'
                  }}
                >
                  Score (Max: {examDetails.max_score})
                </label>
                <input
                  type="number"
                  id="score"
                  name="score"
                  min="0"
                  max={examDetails.max_score}
                  value={gradeData.score}
                  onChange={handleGradeChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="feedback"
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: '500'
                  }}
                >
                  Feedback
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  value={gradeData.feedback}
                  onChange={handleGradeChange}
                  placeholder="Provide feedback to the trainee"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={18} />
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
         SUBMISSION MODAL (For viewing the exam prompt & answers)
         --------------------------------------------------------- */}
      {showSubmissionModal && selectedSubmission && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#333',
                  margin: 0
                }}
              >
                Trainee Submission
              </h2>
              <button
                onClick={() => setShowSubmissionModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Trainee & Exam Info */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '5px'
                }}
              >
                <User size={16} color="#666" />
                <span style={{ fontWeight: '500' }}>
                  {selectedSubmission.trainee_name}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                <FileText size={16} />
                <span>{examDetails.title}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                <Clock size={16} />
                <span>Submitted: {formatDate(selectedSubmission.submitted_at)}</span>
              </div>
            </div>

            {/* Display Exam Prompt (if any) */}
            {examDetails.description && (
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}
                >
                  Exam Prompt
                </h3>
                <p style={{ margin: 0 }}>{examDetails.description}</p>
              </div>
            )}

            {/* Display Trainee Submission */}
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}
              >
                Answers
              </h3>
              {selectedSubmission.submission_text ? (
                <p style={{ whiteSpace: 'pre-line' }}>
                  {selectedSubmission.submission_text}
                </p>
              ) : (
                <p style={{ color: '#999' }}>No submission text provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerGradePracticalExam;
