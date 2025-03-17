import React, { useState, useEffect } from 'react';
import { BarChart2, Calendar, Download, Filter, ChevronDown, Users, BookOpen, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import adminService from '../../../services/adminService';

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
            return <div style={{ textAlign: 'center', padding: '32px', fontSize: '16px', color: '#64748b' }}>Loading reports data...</div>;
        }
        
        if (error) {
            return <div style={{ textAlign: 'center', padding: '32px', fontSize: '16px', color: '#e74c3c' }}>{error}</div>;
        }
        
        switch (activeTab) {
            case 'enrollment':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Program Enrollment Statistics</h3>
                        <div style={{ width: '100%', height: '400px', marginBottom: '24px' }}>
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
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Programs</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Enrollments</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Completion Rate</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>33.3%</div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Program Details</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Program Name</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Enrolled</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Completed</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Completion %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Officer Basics</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Regular</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>0</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>0%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Policy Refresher 2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Refresher</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>0</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>0%</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Advanced Loan Training</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Regular</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'quiz':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Quiz Performance Analysis</h3>
                        <div style={{ width: '100%', height: '400px', marginBottom: '24px' }}>
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
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Quizzes</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Quiz Attempts</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Avg. Score</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>81.7%</div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Quiz Performance Details</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Quiz Name</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Program</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Pass Rate</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Avg. Score</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Total Attempts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Basics Quiz</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Officer Basics</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>85%</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>85.0</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Policy Quiz</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Policy Refresher 2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>65%</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>68.0</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Advanced Loan Quiz</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Advanced Loan Training</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>92%</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>92.0</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>1</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'activity':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>User Activity Trends</h3>
                        <div style={{ width: '100%', height: '400px', marginBottom: '24px' }}>
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
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Active Users</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>4</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Logins</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>18</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Attendance Events</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Recent User Activity</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>User</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Role</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Activity</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/14/2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Admin Admin</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Administrator</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Login</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>06:37:18</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/14/2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainer Trainer</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainer</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Login</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>07:12:16</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/14/2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainee Trainee</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainee</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Login</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>07:12:25</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/14/2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainee Trainee</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Trainee</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Attendance</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>07:15:00</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/14/2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Applicant Applicant</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Applicant</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Login</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>07:15:43</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                
            case 'applicants':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Applicant Statistics</h3>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Application Status Distribution</h4>
                                <div style={{ width: '100%', height: '300px' }}>
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
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Evaluation Scores by Role</h4>
                                <div style={{ width: '100%', height: '300px' }}>
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
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Applications</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>3</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Pending Review</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>1</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Shortlisted</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>1</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Rejected</h4>
                                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>1</div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Application Details</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Applicant</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Program</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Job Role</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Evaluation Score</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>FST Score</th>
                                        <th style={{ padding: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Applied Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Applicant Applicant</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Officer Basics</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Officer</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Shortlisted</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>88.50</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>92.00</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/10/2025</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Applicant Applicant</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Policy Refresher 2025</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Financial Educator</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Pending</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>N/A</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>N/A</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/11/2025</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Applicant Applicant</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Advanced Loan Training</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Loan Officer</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>Rejected</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>65.00</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>70.00</td>
                                        <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>03/12/2025</td>
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
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={24} /> Reports
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        Filters
                        <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                    </button>
                    <button 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                        onClick={handleExportData}
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>
            
            {showFilters && (
                <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '14px', color: '#64748b' }}>Date Range:</label>
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '14px', color: '#1e293b', backgroundColor: 'white' }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: '#64748b' }}>From:</label>
                                <input type="date" id="start-date" style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '14px', color: '#1e293b', backgroundColor: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: '#64748b' }}>To:</label>
                                <input type="date" id="end-date" style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '14px', color: '#1e293b', backgroundColor: 'white' }} />
                            </div>
                        </>
                    )}
                    
                    <button 
                        style={{ padding: '8px 16px', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onClick={fetchReportData}
                    >
                        Apply Filters
                    </button>
                </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        backgroundColor: activeTab === 'enrollment' ? '#E3F2FD' : 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        color: activeTab === 'enrollment' ? '#1E88E5' : '#64748b', 
                        cursor: 'pointer', 
                        transition: 'background-color 0.15s ease, color 0.15s ease' 
                    }}
                    onClick={() => setActiveTab('enrollment')}
                >
                    <BookOpen size={16} />
                    Program Enrollment
                </button>
                <button 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        backgroundColor: activeTab === 'quiz' ? '#E3F2FD' : 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        color: activeTab === 'quiz' ? '#1E88E5' : '#64748b', 
                        cursor: 'pointer', 
                        transition: 'background-color 0.15s ease, color 0.15s ease' 
                    }}
                    onClick={() => setActiveTab('quiz')}
                >
                    <Award size={16} />
                    Quiz Performance
                </button>
                <button 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        backgroundColor: activeTab === 'activity' ? '#E3F2FD' : 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        color: activeTab === 'activity' ? '#1E88E5' : '#64748b', 
                        cursor: 'pointer', 
                        transition: 'background-color 0.15s ease, color 0.15s ease' 
                    }}
                    onClick={() => setActiveTab('activity')}
                >
                    <Users size={16} />
                    User Activity
                </button>
                <button 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        backgroundColor: activeTab === 'applicants' ? '#E3F2FD' : 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        color: activeTab === 'applicants' ? '#1E88E5' : '#64748b', 
                        cursor: 'pointer', 
                        transition: 'background-color 0.15s ease, color 0.15s ease' 
                    }}
                    onClick={() => setActiveTab('applicants')}
                >
                    <Calendar size={16} />
                    Applicant Data
                </button>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                {renderReportContent()}
            </div>
        </div>
    );
};

export default Reports;