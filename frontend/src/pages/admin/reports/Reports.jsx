import React, { useState, useEffect } from 'react';
import { BarChart2, Calendar, Download, Filter, ChevronDown, Users, BookOpen, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import adminService from '../../../services/adminService';
import './styles/Reports.css';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('enrollment');
    const [dateRange, setDateRange] = useState('month');
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [quizData, setQuizData] = useState([]);
    const [userActivityData, setUserActivityData] = useState([]);
    const [applicationData, setApplicationData] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchReportData();
    }, [dateRange, activeTab]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch data from API endpoint using adminService
            const reportType = activeTab === 'enrollment' ? 'enrollment' : 
                              activeTab === 'quiz' ? 'quiz' : 
                              activeTab === 'activity' ? 'activity' : 
                              activeTab === 'applicants' ? 'applicants' : 'all';
            
            // Get date parameters based on selected range
            let startDate = null;
            let endDate = null;
            
            if (dateRange === 'custom' && document.getElementById('start-date') && document.getElementById('end-date')) {
                startDate = document.getElementById('start-date').value;
                endDate = document.getElementById('end-date').value;
            }
            
            try {
                // Call the API service
                const data = await adminService.getReportsData(reportType, dateRange, startDate, endDate);
                
                // Process enrollment data if available
                if (data.enrollment && data.enrollment.programs) {
                    const formattedData = data.enrollment.programs.map(program => ({
                        name: program.program_name,
                        enrolled: parseInt(program.enrolled_count),
                        completed: parseInt(program.completed_count),
                        inProgress: parseInt(program.in_progress_count)
                    }));
                    setEnrollmentData(formattedData);
                } else if (reportType === 'enrollment' || reportType === 'all') {
                    // If enrollment data is expected but not found, use mock data
                    setEnrollmentData([
                        { name: 'Loan Officer Basics', enrolled: 1, completed: 0, inProgress: 1 },
                        { name: 'Policy Refresher 2025', enrolled: 1, completed: 0, inProgress: 0 },
                        { name: 'Advanced Loan Training', enrolled: 1, completed: 1, inProgress: 0 }
                    ]);
                }
                
                // Process quiz data if available
                if (data.quiz && data.quiz.quizzes) {
                    const formattedData = data.quiz.quizzes.map(quiz => ({
                        name: quiz.quiz_name,
                        passRate: parseFloat(quiz.pass_rate),
                        averageScore: parseFloat(quiz.average_score),
                        attempts: parseInt(quiz.attempt_count)
                    }));
                    setQuizData(formattedData);
                } else if (reportType === 'quiz' || reportType === 'all') {
                    // If quiz data is expected but not found, use mock data
                    setQuizData([
                        { name: 'Loan Basics Quiz', passRate: 85, averageScore: 85, attempts: 1 },
                        { name: 'Policy Quiz', passRate: 65, averageScore: 68, attempts: 1 },
                        { name: 'Advanced Loan Quiz', passRate: 92, averageScore: 92, attempts: 1 }
                    ]);
                }
                
                // Process activity data if available
                if (data.activity && data.activity.chartData) {
                    const formattedData = data.activity.chartData.map(item => ({
                        date: new Date(item.date).toLocaleDateString(),
                        logins: parseInt(item.logins),
                        attendance: parseInt(item.attendance)
                    }));
                    setUserActivityData(formattedData);
                } else if (reportType === 'activity' || reportType === 'all') {
                    // If activity data is expected but not found, use mock data
                    setUserActivityData([
                        { date: '03/09/2025', logins: 4, attendance: 0 },
                        { date: '03/10/2025', logins: 3, attendance: 1 },
                        { date: '03/11/2025', logins: 2, attendance: 0 },
                        { date: '03/12/2025', logins: 3, attendance: 1 },
                        { date: '03/13/2025', logins: 2, attendance: 0 },
                        { date: '03/14/2025', logins: 4, attendance: 1 }
                    ]);
                }
                
                // Process applicant data if available
                if (data.applicants && data.applicants.statusData) {
                    setApplicationData(data.applicants.statusData);
                } else if (reportType === 'applicants' || reportType === 'all') {
                    // If applicant data is expected but not found, use mock data
                    setApplicationData([
                        { name: 'Pending', value: 1 },
                        { name: 'Shortlisted', value: 1 },
                        { name: 'Hired', value: 0 },
                        { name: 'Rejected', value: 1 }
                    ]);
                }
                
                setLoading(false);
            } catch (apiError) {
                console.error("API Error:", apiError);
                
                // Fallback to mock data if API fails
                setEnrollmentData([
                    { name: 'Loan Officer Basics', enrolled: 1, completed: 0, inProgress: 1 },
                    { name: 'Policy Refresher 2025', enrolled: 1, completed: 0, inProgress: 0 },
                    { name: 'Advanced Loan Training', enrolled: 1, completed: 1, inProgress: 0 }
                ]);
                
                setQuizData([
                    { name: 'Loan Basics Quiz', passRate: 85, averageScore: 85, attempts: 1 },
                    { name: 'Policy Quiz', passRate: 65, averageScore: 68, attempts: 1 },
                    { name: 'Advanced Loan Quiz', passRate: 92, averageScore: 92, attempts: 1 }
                ]);
                
                setUserActivityData([
                    { date: '03/09/2025', logins: 4, attendance: 0 },
                    { date: '03/10/2025', logins: 3, attendance: 1 },
                    { date: '03/11/2025', logins: 2, attendance: 0 },
                    { date: '03/12/2025', logins: 3, attendance: 1 },
                    { date: '03/13/2025', logins: 2, attendance: 0 },
                    { date: '03/14/2025', logins: 4, attendance: 1 }
                ]);
                
                setApplicationData([
                    { name: 'Pending', value: 1 },
                    { name: 'Shortlisted', value: 1 },
                    { name: 'Hired', value: 0 },
                    { name: 'Rejected', value: 1 }
                ]);
                
                setError("Using fallback data. API connection failed: " + apiError.message);
                setLoading(false);
            }
        } catch (err) {
            console.error("Error in report data handling:", err);
            setError("Failed to load report data. Please try again later.");
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            // Create filters object based on dateRange
            const filters = {
                range: dateRange
            };
            
            // If custom date range, add start and end dates
            if (dateRange === 'custom' && document.getElementById('start-date') && document.getElementById('end-date')) {
                filters.start = document.getElementById('start-date').value;
                filters.end = document.getElementById('end-date').value;
            }
            
            // Call export API
            await adminService.exportReport(activeTab, 'csv', filters);
        } catch (error) {
            console.error("Export error:", error);
            alert("Failed to export data: " + error.message);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // Render different report tabs based on activeTab state
    const renderReportContent = () => {
        if (loading) {
            return <div className="loading-spinner">Loading reports data...</div>;
        }
        
        if (error) {
            return <div className="error-message">{error}</div>;
        }
        
        switch (activeTab) {
            case 'enrollment':
                return (
                    <div className="report-section">
                        <h3>Program Enrollment Statistics</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={enrollmentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="enrolled" fill="#8884d8" name="Total Enrolled" />
                                    <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                                    <Bar dataKey="inProgress" fill="#ffc658" name="In Progress" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="stats-summary">
                            <div className="stat-card">
                                <h4>Total Programs</h4>
                                <div className="stat-value">3</div>
                            </div>
                            <div className="stat-card">
                                <h4>Total Enrollments</h4>
                                <div className="stat-value">3</div>
                            </div>
                            <div className="stat-card">
                                <h4>Completion Rate</h4>
                                <div className="stat-value">33.3%</div>
                            </div>
                        </div>
                        
                        <div className="data-table-container">
                            <h4>Program Details</h4>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Program Name</th>
                                        <th>Type</th>
                                        <th>Enrolled</th>
                                        <th>Completed</th>
                                        <th>Completion %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Loan Officer Basics</td>
                                        <td>Regular</td>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>0%</td>
                                    </tr>
                                    <tr>
                                        <td>Policy Refresher 2025</td>
                                        <td>Refresher</td>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>0%</td>
                                    </tr>
                                    <tr>
                                        <td>Advanced Loan Training</td>
                                        <td>Regular</td>
                                        <td>1</td>
                                        <td>1</td>
                                        <td>100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'quiz':
                return (
                    <div className="report-section">
                        <h3>Quiz Performance Analysis</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={quizData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="passRate" fill="#8884d8" name="Pass Rate %" />
                                    <Bar dataKey="averageScore" fill="#82ca9d" name="Average Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="stats-summary">
                            <div className="stat-card">
                                <h4>Total Quizzes</h4>
                                <div className="stat-value">3</div>
                            </div>
                            <div className="stat-card">
                                <h4>Quiz Attempts</h4>
                                <div className="stat-value">3</div>
                            </div>
                            <div className="stat-card">
                                <h4>Avg. Score</h4>
                                <div className="stat-value">81.7%</div>
                            </div>
                        </div>
                        
                        <div className="data-table-container">
                            <h4>Quiz Performance Details</h4>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Quiz Name</th>
                                        <th>Program</th>
                                        <th>Pass Rate</th>
                                        <th>Avg. Score</th>
                                        <th>Total Attempts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Loan Basics Quiz</td>
                                        <td>Loan Officer Basics</td>
                                        <td>85%</td>
                                        <td>85.0</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>Policy Quiz</td>
                                        <td>Policy Refresher 2025</td>
                                        <td>65%</td>
                                        <td>68.0</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>Advanced Loan Quiz</td>
                                        <td>Advanced Loan Training</td>
                                        <td>92%</td>
                                        <td>92.0</td>
                                        <td>1</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'activity':
                return (
                    <div className="report-section">
                        <h3>User Activity Trends</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={userActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="logins" stroke="#8884d8" name="Logins" />
                                    <Line type="monotone" dataKey="attendance" stroke="#82ca9d" name="Attendance" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="stats-summary">
                            <div className="stat-card">
                                <h4>Active Users</h4>
                                <div className="stat-value">4</div>
                            </div>
                            <div className="stat-card">
                                <h4>Total Logins</h4>
                                <div className="stat-value">18</div>
                            </div>
                            <div className="stat-card">
                                <h4>Attendance Events</h4>
                                <div className="stat-value">3</div>
                            </div>
                        </div>
                        
                        <div className="data-table-container">
                            <h4>Recent User Activity</h4>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Activity</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>03/14/2025</td>
                                        <td>Admin Admin</td>
                                        <td>Administrator</td>
                                        <td>Login</td>
                                        <td>06:37:18</td>
                                    </tr>
                                    <tr>
                                        <td>03/14/2025</td>
                                        <td>Trainer Trainer</td>
                                        <td>Trainer</td>
                                        <td>Login</td>
                                        <td>07:12:16</td>
                                    </tr>
                                    <tr>
                                        <td>03/14/2025</td>
                                        <td>Trainee Trainee</td>
                                        <td>Trainee</td>
                                        <td>Login</td>
                                        <td>07:12:25</td>
                                    </tr>
                                    <tr>
                                        <td>03/14/2025</td>
                                        <td>Trainee Trainee</td>
                                        <td>Trainee</td>
                                        <td>Attendance</td>
                                        <td>07:15:00</td>
                                    </tr>
                                    <tr>
                                        <td>03/14/2025</td>
                                        <td>Applicant Applicant</td>
                                        <td>Applicant</td>
                                        <td>Login</td>
                                        <td>07:15:43</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'applicants':
                return (
                    <div className="report-section">
                        <h3>Applicant Statistics</h3>
                        <div className="chart-container">
                            <div className="pie-chart-wrapper">
                                <h4>Application Status Distribution</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={applicationData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {applicationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="bar-chart-wrapper">
                                <h4>Evaluation Scores by Role</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={[
                                            { name: 'Loan Officer', evaluation: 76.75, fst: 81.00 },
                                            { name: 'Financial Educator', evaluation: 0, fst: 0 }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="evaluation" fill="#8884d8" name="Evaluation Score" />
                                        <Bar dataKey="fst" fill="#82ca9d" name="FST Score" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        <div className="stats-summary">
                            <div className="stat-card">
                                <h4>Total Applications</h4>
                                <div className="stat-value">3</div>
                            </div>
                            <div className="stat-card">
                                <h4>Pending Review</h4>
                                <div className="stat-value">1</div>
                            </div>
                            <div className="stat-card">
                                <h4>Shortlisted</h4>
                                <div className="stat-value">1</div>
                            </div>
                            <div className="stat-card">
                                <h4>Rejected</h4>
                                <div className="stat-value">1</div>
                            </div>
                        </div>
                        
                        <div className="data-table-container">
                            <h4>Application Details</h4>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Program</th>
                                        <th>Job Role</th>
                                        <th>Status</th>
                                        <th>Evaluation Score</th>
                                        <th>FST Score</th>
                                        <th>Applied Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Applicant Applicant</td>
                                        <td>Loan Officer Basics</td>
                                        <td>Loan Officer</td>
                                        <td>Shortlisted</td>
                                        <td>88.50</td>
                                        <td>92.00</td>
                                        <td>03/10/2025</td>
                                    </tr>
                                    <tr>
                                        <td>Applicant Applicant</td>
                                        <td>Policy Refresher 2025</td>
                                        <td>Financial Educator</td>
                                        <td>Pending</td>
                                        <td>N/A</td>
                                        <td>N/A</td>
                                        <td>03/11/2025</td>
                                    </tr>
                                    <tr>
                                        <td>Applicant Applicant</td>
                                        <td>Advanced Loan Training</td>
                                        <td>Loan Officer</td>
                                        <td>Rejected</td>
                                        <td>65.00</td>
                                        <td>70.00</td>
                                        <td>03/12/2025</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            default:
                return <div>Select a report type to view data</div>;
        }
    };

    return (
        <div className="reports">
            <div className="section-header">
                <h2><BarChart2 size={24} className="icon-inline" /> Reports</h2>
                <div className="header-actions">
                    <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} />
                        Filters
                        <ChevronDown size={16} className={showFilters ? 'rotate' : ''} />
                    </button>
                    <button className="export-btn" onClick={handleExportData}>
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>
            
            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-group">
                        <label>Date Range:</label>
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="quarter">Last Quarter</option>
                            <option value="year">Last Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    
                    {dateRange === 'custom' && (
                        <>
                            <div className="filter-group">
                                <label>From:</label>
                                <input type="date" id="start-date" />
                            </div>
                            <div className="filter-group">
                                <label>To:</label>
                                <input type="date" id="end-date" />
                            </div>
                        </>
                    )}
                    
                    <button 
                        className="apply-filters-btn" 
                        onClick={fetchReportData}
                    >
                        Apply Filters
                    </button>
                </div>
            )}
            
            <div className="reports-tabs">
                <button 
                    className={activeTab === 'enrollment' ? 'active' : ''}
                    onClick={() => setActiveTab('enrollment')}
                >
                    <BookOpen size={16} />
                    Program Enrollment
                </button>
                <button 
                    className={activeTab === 'quiz' ? 'active' : ''}
                    onClick={() => setActiveTab('quiz')}
                >
                    <Award size={16} />
                    Quiz Performance
                </button>
                <button 
                    className={activeTab === 'activity' ? 'active' : ''}
                    onClick={() => setActiveTab('activity')}
                >
                    <Users size={16} />
                    User Activity
                </button>
                <button 
                    className={activeTab === 'applicants' ? 'active' : ''}
                    onClick={() => setActiveTab('applicants')}
                >
                    <Calendar size={16} />
                    Applicant Data
                </button>
            </div>
            
            <div className="reports-content">
                {renderReportContent()}
            </div>
        </div>
    );
};

export default Reports;