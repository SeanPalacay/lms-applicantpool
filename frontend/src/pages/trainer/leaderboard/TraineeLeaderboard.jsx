import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, Search, Filter, ChevronDown, ChevronUp, Award, 
  Star, Calendar, CheckCircle, Clock, User, Mail, Phone
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const TraineeLeaderboard = () => {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [filterTimeframe, setFilterTimeframe] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('overall_score');
  const [sortDirection, setSortDirection] = useState('desc');

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
        
        // Fetch trainees and their grades
        const traineesData = await trainerService.getTrainees();
        
        // For each trainee, fetch their grades
        const traineesWithGrades = await Promise.all(
          traineesData.map(async (trainee) => {
            try {
              const grades = await trainerService.getTraineeGrades(trainee.id);
              return {
                ...trainee,
                overall_score: calculateOverallScore(grades),
                quiz_score: calculateQuizScore(grades),
                practical_score: calculatePracticalScore(grades),
                completion_rate: calculateCompletionRate(trainee),
                grades: grades
              };
            } catch (error) {
              console.error(`Error fetching grades for trainee ${trainee.id}:`, error);
              return {
                ...trainee,
                overall_score: 0,
                quiz_score: 0,
                practical_score: 0,
                completion_rate: 0,
                grades: { quizzes: [], practical_exams: [] }
              };
            }
          })
        );
        
        setTrainees(traineesWithGrades);
        
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calculateOverallScore = (grades) => {
    // First check if we have the pre-calculated final grade
    if (grades && grades.final_grade !== undefined) {
      return grades.final_grade;
    }
    
    // Otherwise calculate from components
    const quizScore = calculateQuizScore(grades);
    const practicalScore = calculatePracticalScore(grades);
    
    // Get grade configuration from the API response
    const quizWeight = grades?.grade_config?.quiz_weight || 0.6;
    const practicalWeight = grades?.grade_config?.practical_exam_weight || 0.4;
    
    // Calculate weighted score
    if (quizScore > 0 && practicalScore > 0) {
      return (quizScore * quizWeight) + (practicalScore * practicalWeight);
    } else if (quizScore > 0) {
      return quizScore;
    } else if (practicalScore > 0) {
      return practicalScore;
    }
    
    return 0;
  };

  const calculateQuizScore = (grades) => {
    // First check if we have the pre-calculated average
    if (grades && grades.quiz_average !== undefined) {
      return grades.quiz_average;
    }
    
    // Fall back to calculating from individual quizzes if necessary
    if (grades && grades.quizzes && grades.quizzes.length > 0) {
      const totalScore = grades.quizzes.reduce((sum, quiz) => sum + parseFloat(quiz.score), 0);
      return totalScore / grades.quizzes.length;
    }
    
    return 0;
  };
  const calculatePracticalScore = (grades) => {
    // First check if we have the pre-calculated average
    if (grades && grades.practical_average !== undefined) {
      return grades.practical_average;
    }
    
    // Fall back to calculating from individual exams if necessary
    if (grades && grades.practical_attempts && grades.practical_attempts.length > 0) {
      const totalScore = grades.practical_attempts.reduce((sum, exam) => sum + parseFloat(exam.score), 0);
      return totalScore / grades.practical_attempts.length;
    }
    
    return 0;
  };
  const calculateCompletionRate = (trainee) => {
    if (!trainee.programs || trainee.programs.length === 0) {
      return 0;
    }
    
    const totalPrograms = trainee.programs.length;
    const completedPrograms = trainee.programs.filter(program => 
      program.completion_status === 'completed'
    ).length;
    
    const inProgressPrograms = trainee.programs.filter(program => 
      program.completion_status === 'in_progress'
    ).length;
    
    if (completedPrograms === totalPrograms) {
      return 100;
    } else {
      const completedPercentage = (completedPrograms / totalPrograms) * 100;
      const inProgressContribution = (inProgressPrograms / totalPrograms) * 
        (trainee.programs
          .filter(program => program.completion_status === 'in_progress')
          .reduce((sum, program) => sum + (program.completion_percentage || 0), 0) / 
          (inProgressPrograms || 1));
      
      return Math.round(completedPercentage + inProgressContribution);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleProgramFilterChange = (e) => {
    setFilterProgram(e.target.value);
  };

  const handleTimeframeFilterChange = (e) => {
    setFilterTimeframe(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for leaderboard
    }
  };

  const filteredTrainees = trainees
    .filter(trainee => {
      const searchMatch = trainee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      let programMatch = true;
      if (filterProgram !== 'all') {
        programMatch = trainee.programs?.some(program => 
          program.id.toString() === filterProgram
        ) || false;
      }
      
      let timeframeMatch = true;
      if (filterTimeframe !== 'all') {
        // Implement timeframe filtering based on quiz and exam dates
        const now = new Date();
        let cutoffDate = new Date();
        
        if (filterTimeframe === 'week') {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (filterTimeframe === 'month') {
          cutoffDate.setMonth(now.getMonth() - 1);
        } else if (filterTimeframe === 'quarter') {
          cutoffDate.setMonth(now.getMonth() - 3);
        }
        
        // Check if any quiz or exam attempt is within the timeframe
        const hasRecentQuiz = trainee.grades?.quizzes?.some(quiz => 
          new Date(quiz.attempt_date) >= cutoffDate
        );
        
        const hasRecentExam = trainee.grades?.practical_exams?.some(exam => 
          new Date(exam.submitted_at) >= cutoffDate
        );
        
        timeframeMatch = hasRecentQuiz || hasRecentExam;
      }
      
      return searchMatch && programMatch && timeframeMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortField === 'overall_score') {
        comparison = (b.overall_score || 0) - (a.overall_score || 0);
      } else if (sortField === 'quiz_score') {
        comparison = (b.quiz_score || 0) - (a.quiz_score || 0);
      } else if (sortField === 'practical_score') {
        comparison = (b.practical_score || 0) - (a.practical_score || 0);
      } else if (sortField === 'completion_rate') {
        comparison = (b.completion_rate || 0) - (a.completion_rate || 0);
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    });

  // Get rank badges for top performers
  const getRankBadge = (index) => {
    if (index === 0) {
      return { icon: <Trophy size={16} />, color: '#FFD700', label: '1st' }; // Gold
    } else if (index === 1) {
      return { icon: <Trophy size={16} />, color: '#C0C0C0', label: '2nd' }; // Silver
    } else if (index === 2) {
      return { icon: <Trophy size={16} />, color: '#CD7F32', label: '3rd' }; // Bronze
    } else {
      return { icon: <Award size={16} />, color: '#6c757d', label: `${index + 1}th` };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {error && <AlertBanner message={error} type="error" />}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px' 
        }}>
          <Trophy size={24} style={{ color: '#FFD700' }} />
          <h2 style={{ 
            fontSize: '24px', 
            margin: 0 
          }}>Trainee Leaderboard</h2>
        </div>
        <div>
          <Link 
            to="/trainer/trainees"
            style={{
              padding: '8px 15px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              marginRight: '10px'
            }}
          >
            View All Trainees
          </Link>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: '1', 
          minWidth: '200px' 
        }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }} />
          <input 
            type="text" 
            placeholder="Search trainees..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 10px 8px 35px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button 
          onClick={toggleFilters}
          style={{
            padding: '8px 15px',
            background: showFilters ? '#007bff' : '#f8f9fa',
            color: showFilters ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px'
          }}
        >
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold'
              }} htmlFor="program-filter">Program:</label>
              <select 
                id="program-filter" 
                value={filterProgram}
                onChange={handleProgramFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id.toString()}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold'
              }} htmlFor="timeframe-filter">Timeframe:</label>
              <select 
                id="timeframe-filter" 
                value={filterTimeframe}
                onChange={handleTimeframeFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {filteredTrainees.length > 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          {/* Top performers highlights */}
          {filteredTrainees.length >= 3 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '20px',
              flexWrap: 'wrap',
              gap: '20px',
              borderBottom: '1px solid #eee'
            }}>
              {filteredTrainees.slice(0, 3).map((trainee, index) => (
                <div key={trainee.id} style={{
                  flex: '1',
                  minWidth: '280px',
                  background: index === 0 ? '#fff9e6' : index === 1 ? '#f8f9fa' : '#fff8f5',
                  borderRadius: '8px',
                  padding: '15px',
                  border: `1px solid ${index === 0 ? '#ffeeba' : index === 1 ? '#d6d8db' : '#ffdfc8'}`
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{trainee.full_name}</h3>
                      <div style={{ fontSize: '14px', color: '#666' }}>{trainee.email}</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Overall Score</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {trainee.overall_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Completion</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {trainee.completion_rate}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '70px 2fr 1fr 1fr 1fr 1fr',
            background: '#f8f9fa',
            padding: '10px 15px',
            borderBottom: '1px solid #eee',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>Rank</span>
            </div>
            <div 
              onClick={() => handleSort('name')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'name' ? '#007bff' : '#333'
              }}
            >
              <span>Trainee</span>
              {sortField === 'name' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('overall_score')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'overall_score' ? '#007bff' : '#333'
              }}
            >
              <span>Overall Score</span>
              {sortField === 'overall_score' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('quiz_score')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'quiz_score' ? '#007bff' : '#333'
              }}
            >
              <span>Quiz Avg</span>
              {sortField === 'quiz_score' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('practical_score')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'practical_score' ? '#007bff' : '#333'
              }}
            >
              <span>Practical Avg</span>
              {sortField === 'practical_score' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('completion_rate')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'completion_rate' ? '#007bff' : '#333'
              }}
            >
              <span>Completion</span>
              {sortField === 'completion_rate' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
          </div>
          
          {filteredTrainees.map((trainee, index) => {
            const rankBadge = getRankBadge(index);
            
            return (
              <Link 
                to={`/trainer/trainees/${trainee.id}`} 
                key={trainee.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 2fr 1fr 1fr 1fr 1fr',
                  padding: '15px',
                  borderBottom: '1px solid #eee',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'background 0.2s',
                  background: index < 3 ? (index === 0 ? 'rgba(255, 215, 0, 0.05)' : 
                    index === 1 ? 'rgba(192, 192, 192, 0.05)' : 
                    'rgba(205, 127, 50, 0.05)') : 'transparent'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: index < 3 ? rankBadge.color : '#f8f9fa',
                    color: index < 3 ? 'white' : '#666',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    gap: '4px'
                  }}>
                    {rankBadge.icon}
                    <span>{index + 1}</span>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#007bff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>
                    {trainee.full_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px' }}>{trainee.full_name}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <Mail size={12} />
                      <span>{trainee.email}</span>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: index === 0 ? '#FFD700' : index === 1 ? '#6c757d' : index === 2 ? '#CD7F32' : '#333'
                }}>
                  {trainee.overall_score.toFixed(1)}%
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px'
                }}>
                  {trainee.quiz_score.toFixed(1)}%
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginLeft: '5px' 
                  }}>
                    ({trainee.grades?.quizzes?.length || 0})
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px'
                }}>
                  {trainee.practical_score.toFixed(1)}%
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginLeft: '5px' 
                  }}>
                    ({trainee.grades?.practical_exams?.length || 0})
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  <div style={{
                    width: '80px',
                    height: '6px',
                    background: '#eee',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${trainee.completion_rate}%`,
                      height: '100%',
                      background: trainee.completion_rate === 100 ? '#28a745' : '#007bff',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '14px' }}>{trainee.completion_rate}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Trophy size={48} style={{ 
            color: '#007bff', 
            marginBottom: '15px' 
          }} />
          <h3 style={{ 
            margin: '0 0 10px 0',
            fontSize: '20px'
          }}>No data to display</h3>
          <p style={{ 
            margin: 0,
            color: '#666',
            fontSize: '14px'
          }}>
            {searchQuery || filterProgram !== 'all' || filterTimeframe !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No trainees with assessment data found'}
          </p>
        </div>
      )}
      
      {/* Scoring explanation */}
      <div style={{
        marginTop: '20px',
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '15px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>About the Leaderboard</h4>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Overall Score</strong>: Calculated using the weighted average of quiz scores (60%) and practical exam scores (40%).
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Quiz Avg</strong>: Average score across all quiz attempts.
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Practical Avg</strong>: Average score across all practical exam submissions.
        </p>
        <p style={{ margin: '0' }}>
          <strong>Completion</strong>: Percentage of assigned programs that have been completed.
        </p>
      </div>
    </div>
  );
};

export default TraineeLeaderboard;