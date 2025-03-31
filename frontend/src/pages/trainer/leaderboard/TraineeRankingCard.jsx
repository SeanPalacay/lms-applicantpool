import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Star, Medal, 
  PieChart, BookOpen, CheckCircle, User 
} from 'lucide-react';
import trainerService from '../../../services/trainerService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const TraineeRankingCard = ({ traineeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rankings, setRankings] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      
      try {
        const rankingData = await trainerService.getTraineeRanking(traineeId);
        setRankings(rankingData);
      } catch (err) {
        console.error('Error fetching trainee rankings:', err);
        setError('Failed to load ranking data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (traineeId) {
      fetchRankings();
    }
  }, [traineeId]);

  if (loading) {
    return (
      <div className="ranking-card-loading" style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-card-error" style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
      }}>
        <AlertBanner message={error} type="error" />
      </div>
    );
  }

  if (!rankings || !rankings.trainee) {
    return (
      <div className="ranking-card-empty" style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        textAlign: 'center',
      }}>
        <Trophy style={{ color: '#6c757d', marginBottom: '10px' }} size={40} />
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>No Ranking Data</h3>
        <p style={{ margin: 0, color: '#666' }}>
          This trainee has not yet completed any assessments.
        </p>
      </div>
    );
  }

  // Get medal icon based on rank
  const getMedalIcon = (rank) => {
    if (rank === 1) {
      return { icon: <Trophy size={18} />, color: '#FFD700' }; // Gold
    } else if (rank === 2) {
      return { icon: <Trophy size={18} />, color: '#C0C0C0' }; // Silver
    } else if (rank === 3) {
      return { icon: <Trophy size={18} />, color: '#CD7F32' }; // Bronze
    } else {
      return { icon: <Award size={18} />, color: '#6c757d' };
    }
  };

  // Calculate percentile (higher is better)
  const calculatePercentile = (rank, total) => {
    if (total === 0 || rank === 0) return 0;
    return Math.round(((total - rank) / total) * 100);
  };

  // Get color based on percentile
  const getPercentileColor = (percentile) => {
    if (percentile >= 90) return '#28a745'; // Excellent - green
    if (percentile >= 70) return '#17a2b8'; // Good - blue
    if (percentile >= 50) return '#fd7e14'; // Average - orange
    return '#dc3545'; // Below average - red
  };

  // Format rank as ordinal (1st, 2nd, 3rd, etc.)
  const formatRank = (rank) => {
    if (rank === 0) return 'N/A';
    
    const j = rank % 10;
    const k = rank % 100;
    
    if (j === 1 && k !== 11) {
      return rank + "st";
    }
    if (j === 2 && k !== 12) {
      return rank + "nd";
    }
    if (j === 3 && k !== 13) {
      return rank + "rd";
    }
    return rank + "th";
  };

  // Calculate percentiles
  const overallPercentile = calculatePercentile(rankings.overall.rank, rankings.overall.total);
  const quizPercentile = calculatePercentile(rankings.quiz.rank, rankings.quiz.total);
  const practicalPercentile = calculatePercentile(rankings.practical.rank, rankings.practical.total);
  const completionPercentile = calculatePercentile(rankings.completion.rank, rankings.completion.total);

  // Get medal for overall rank
  const overallMedal = getMedalIcon(rankings.overall.rank);

  return (
    <div className="trainee-ranking-card" style={{
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: '#f8f9fa',
        padding: '15px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Trophy size={20} style={{ color: '#007bff' }} />
          <h3 style={{ margin: 0, fontSize: '16px' }}>Performance Ranking</h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#fff',
          padding: '5px 10px',
          borderRadius: '20px',
          border: `2px solid ${overallMedal.color}`
        }}>
          <div style={{ color: overallMedal.color }}>
            {overallMedal.icon}
          </div>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: rankings.overall.rank <= 3 ? overallMedal.color : '#333'
          }}>
            {formatRank(rankings.overall.rank)} of {rankings.overall.total}
          </span>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ padding: '15px' }}>
        {/* Top 3 section */}
        {rankings.top_three && rankings.top_three.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              margin: '0 0 10px 0',
              color: '#666', 
              fontWeight: 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Star size={14} />
              <span>Top Performers</span>
            </h4>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              padding: '5px 0'
            }}>
              {rankings.top_three.map((trainee, index) => (
                <div key={trainee.id} style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${
                    index === 0 ? '#FFD700' : 
                    index === 1 ? '#C0C0C0' : 
                    '#CD7F32'
                  }`,
                  background: index === 0 ? '#fff9e6' : 
                             index === 1 ? '#f8f9fa' : 
                             '#fff8f5',
                  minWidth: '150px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: index === 0 ? '#FFD700' : 
                              index === 1 ? '#C0C0C0' : 
                              '#CD7F32',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      background: '#007bff',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      {trainee.full_name.charAt(0)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100px'
                    }}>
                      {trainee.full_name}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Score:</span>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      {trainee.overall_score.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '3px'
                  }}>
                    <span>Completion:</span>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      {trainee.completion_rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Ranking metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px'
        }}>
          {/* Overall Ranking */}
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f8f9fa',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              height: '5px',
              width: '100%',
              background: '#eee'
            }}>
              <div style={{
                height: '100%',
                width: `${completionPercentile}%`,
                background: getPercentileColor(completionPercentile)
              }}></div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <CheckCircle size={16} style={{ color: '#007bff' }} />
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Program Completion
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {formatRank(rankings.completion.rank)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666'
              }}>
                <span style={{ 
                  color: getPercentileColor(completionPercentile),
                  fontWeight: 'bold'
                }}>
                  {completionPercentile}th
                </span> percentile
              </div>
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginTop: '5px'
            }}>
              Completion Rate: {rankings.trainee.completion_rate}%
            </div>
          </div>
        </div>
        
        {/* Hint about calculation */}
        <div style={{
          marginTop: '20px',
          padding: '10px 15px',
          background: '#e9f5fe',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#0d6efd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <Medal size={16} />
          </div>
          <div>
            Overall score is calculated using quiz ({Math.round(rankings.grade_config.quiz_weight * 100)}%) 
            and practical exam ({Math.round(rankings.grade_config.practical_weight * 100)}%) performance. 
            Passing grade is {rankings.grade_config.passing_grade}%.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineeRankingCard;
