// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from './pages/auth/login/Login';
import Register from './pages/auth/register/Register';

// Dashboard Pages
import AdminDashboard from './pages/admin/dashboard/AdminDashboard';
import ApplicantDashboard from './pages/applicant/dashboard/ApplicantDashboard';
import TraineeDashboard from './pages/trainee/dashboard/TraineeDashboard';
import TrainerDashboard from './pages/trainer/dashboard/TrainerDashboard';
import DashboardLayout from './components/shared/DashboardLayout';

// Admin Pages
import UserManagement from './pages/admin/user-management/UserManagement';
import CreateUserForm from './pages/admin/user-management/create/CreateUserForm';
import EditUserForm from './pages/admin/user-management/EditUserForm';
import ExportUsers from './pages/admin/user-management/export/ExportUsers';
import Programs from './pages/admin/programs/Programs';
import CreateProgram from './pages/admin/programs/create/CreateProgram';
import EditProgram from './pages/admin/programs/edit/EditProgram';
import ProgramDetails from './pages/admin/programs/details/ProgramDetails';
import ApplicantPools from './pages/admin/applicant-pools/ApplicantPool';
import CreateApplicantPool from './pages/admin/applicant-pools/create/CreateApplicantPool';
import EditApplicantPool from './pages/admin/applicant-pools/edit/EditApplicantPool';
import ApplicantDetails from './pages/admin/applicant-pools/details/ApplicantDetails';
import ExportApplicants from './pages/admin/applicants/export/ExportApplicants';
import ActivityLog from './pages/admin/activity/ActivityLog';
import SystemHealth from './pages/admin/system/SystemHealth';
import Backups from './pages/admin/backups/Backups';
import CreateBackup from './pages/admin/backups/create/CreateBackup';
import RestoreBackup from './pages/admin/backups/restore/RestoreBackup';
import Reports from './pages/admin/reports/Reports';
import Settings from './pages/admin/system-settings/Settings';
import TaskDetail from './pages/admin/tasks/TaskDetail';
import AdminProfile from './pages/admin/profile/AdminProfile';
import RecordManagement from './pages/admin/records/RecordManagement';
import UploadRecord from './pages/admin/records/upload/UploadRecord';
import RecordDetails from './pages/admin/records/details/RecordDetails';
import PerformanceIncidents from './pages/admin/incidents/PerformanceIncidents';
import CreateIncident from './pages/admin/incidents/create/CreateIncident';
import IncidentDetails from './pages/admin/incidents/details/IncidentDetails';

// Trainer Pages
import TrainerPrograms from './pages/trainer/programs/TrainerPrograms';
import TrainerProgramDetails from './pages/trainer/programs/details/ProgramDetails';
import Quizzes from './pages/trainer/quizzes/Quizzes';
import CreateQuiz from './pages/trainer/quizzes/create/CreateQuiz';
import EditQuiz from './pages/trainer/quizzes/edit/EditQuiz';
import QuizDetails from './pages/trainer/quizzes/details/QuizDetails';
import QuizResults from './pages/trainer/quizzes/results/QuizResults';
import Milestones from './pages/trainer/milestones/Milestones';
import CreateMilestone from './pages/trainer/milestones/create/CreateMilestone';
import EditMilestone from './pages/trainer/milestones/edit/EditMilestone';
import MilestoneDetails from './pages/trainer/milestones/details/MilestoneDetails';
import Trainees from './pages/trainer/trainees/Trainees';
import TraineeDetails from './pages/trainer/trainees/details/TraineeDetails';
import TraineeProgress from './pages/trainer/trainees/progress/TraineeProgress';
import RefresherCourses from './pages/trainer/refresher/RefresherCourses';
import CreateRefresher from './pages/trainer/refresher/create/CreateRefresher';
import RefresherEnrollment from './pages/trainer/refresher/enrollment/RefresherEnrollment';
import TrainerRecords from './pages/trainer/records/TrainerRecords';
import UploadTrainingRecord from './pages/trainer/records/upload/UploadRecord';
import TrainerProfile from './pages/trainer/profile/TrainerProfile';
import QuizAttemptDetails from './pages/trainer/quizzes/attempts/QuizAttemptDetails';
import RefresherCourseDetail from './pages/trainer/refresher/details/RefresherCourseDetail';
import EditRefresherCourse from './pages/trainer/refresher/edit/EditRefresherCourse';
import RecordDetail from './pages/trainer/records/details/RecordDetail';
// Trainee Pages
import TraineePrograms from './pages/trainee/programs/TraineePrograms';
import TraineeProgramDetails from './pages/trainee/programs/details/ProgramDetails';
import TraineeAssessments from './pages/trainee/assessments/TraineeAssessments';
import TakeQuiz from './pages/trainee/assessments/take/TakeQuiz';
import QuizFeedback from './pages/trainee/assessments/feedback/QuizFeedback';
import ProgressTracking from './pages/trainee/progress/ProgressTracking';
import TraineeMilestones from './pages/trainee/milestones/TraineeMilestones';
import Certificates from './pages/trainee/certificates/Certificates';
import CertificateDetails from './pages/trainee/certificates/details/CertificateDetails';
import TraineeProfilePage from './pages/trainee/profile/TraineeProfile';

// Applicant Pages
import ApplicantPrograms from './pages/applicant/programs/ApplicantPrograms';
import ProgramApplication from './pages/applicant/programs/apply/ProgramApplication';
import JobRoles from './pages/applicant/job-roles/JobRoles';
import Applications from './pages/applicant/applications/Applications';
import ApplicationDetails from './pages/applicant/applications/details/ApplicationDetails';
import UploadDocuments from './pages/applicant/upload/UploadDocuments';
import ApplicantProfile from './pages/applicant/profile/ApplicantProfile';
import NotificationsPage from './pages/applicant/notifications/NotificationsPage';
// Shared Pages
import NotFound from './components/shared/NotFound';
import Notifications from './components/shared/Notifications';
import CertificatePrint from './pages/trainee/certificates/CertificatePrint';
import CertificateShare from './pages/trainee/certificates/CertificateShare';

// Protected route component
const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (role && userRole !== role) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'administrator') return <Navigate to="/administrator-dashboard" />;
        if (userRole === 'trainer') return <Navigate to="/trainer-dashboard" />;
        if (userRole === 'trainee') return <Navigate to="/trainee-dashboard" />;
        if (userRole === 'applicant') return <Navigate to="/applicant-dashboard" />;
        return <Navigate to="/login" />;
    }

    return children;
};

const DashboardWrapper = ({ component: Component, title, role }) => {
    return (
        <DashboardLayout title={title} role={role}>
            <Component />
        </DashboardLayout>
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Shared routes */}
            <Route 
                path="/notifications" 
                element={
                    <ProtectedRoute>
                        <Notifications />
                    </ProtectedRoute>
                } 
            />  

            {/* ========== ADMINISTRATOR ROUTES ========== */}
            <Route
                path="/administrator-dashboard"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={AdminDashboard}
                            title="Administrator Dashboard"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Admin routes - for backward compatibility */}
            <Route path="/admin-dashboard" element={<Navigate to="/administrator-dashboard" />} />

            {/* User Management Routes */}
            <Route
                path="/admin/user-management"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={UserManagement}
                            title="User Management"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/user-management/create"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={CreateUserForm}
                            title="Create User"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/user-management/edit/:userId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={EditUserForm}
                            title="Edit User"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/user-management/export"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ExportUsers}
                            title="Export Users"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Program Management Routes */}
            <Route
                path="/admin/programs"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={Programs}
                            title="Training Programs"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/programs/create"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={CreateProgram}
                            title="Create Program"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/programs/edit/:programId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={EditProgram}
                            title="Edit Program"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/programs/details/:programId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ProgramDetails}
                            title="Program Details"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Applicant Pool Management Routes */}
            <Route
                path="/admin/applicant-pools"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ApplicantPools}
                            title="Applicant Pools"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/applicant-pools/create"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={CreateApplicantPool}
                            title="Create Applicant Pool"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/applicant-pools/edit/:poolId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={EditApplicantPool}
                            title="Edit Applicant Pool"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/applicant-pools/:poolId/applicant/:applicantId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ApplicantDetails}
                            title="Applicant Details"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/applicants/export"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ExportApplicants}
                            title="Export Applicant Data"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Activity Log Route */}
            <Route
                path="/admin/activity"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={ActivityLog}
                            title="Activity Log"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* System Health and Backup Management Routes */}
            <Route
                path="/admin/system"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={SystemHealth}
                            title="System Health"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/backups"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={Backups}
                            title="System Backups"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/backups/create"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={CreateBackup}
                            title="Create Backup"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/backups/restore/:backupId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={RestoreBackup}
                            title="Restore Backup"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Reports Route */}
            <Route
                path="/admin/reports"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={Reports}
                            title="Assessment Reports"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Settings Route */}
            <Route
                path="/admin/settings"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={Settings}
                            title="System Settings"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Records Management */}
            <Route
                path="/admin/records"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={RecordManagement}
                            title="Records Management"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/records/upload"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={UploadRecord}
                            title="Upload Record"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/records/:recordId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={RecordDetails}
                            title="Record Details"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Performance Incidents */}
            <Route
                path="/admin/incidents"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={PerformanceIncidents}
                            title="Performance Incidents"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/incidents/create"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={CreateIncident}
                            title="Record Incident"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/incidents/:incidentId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={IncidentDetails}
                            title="Incident Details"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Task Detail Route (for Alerts) */}
            <Route
                path="/admin/task/:taskId"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={TaskDetail}
                            title="Task Details"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Profile Route */}
            <Route
                path="/admin/profile"
                element={
                    <ProtectedRoute role="administrator">
                        <DashboardWrapper
                            component={AdminProfile}
                            title="Profile"
                            role="administrator"
                        />
                    </ProtectedRoute>
                }
            />

            {/* ========== TRAINER ROUTES ========== */}
            <Route
                path="/trainer-dashboard"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TrainerDashboard}
                            title="Trainer Dashboard"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Programs */}
            <Route
                path="/trainer/programs"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TrainerPrograms}
                            title="Training Programs"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/programs/:programId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TrainerProgramDetails}
                            title="Program Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Quizzes */}
            <Route
                path="/trainer/quizzes"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={Quizzes}
                            title="Quizzes & Assessments"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/quizzes/create"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={CreateQuiz}
                            title="Create Quiz"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/quizzes/edit/:quizId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={EditQuiz}
                            title="Edit Quiz"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/quizzes/:quizId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={QuizDetails}
                            title="Quiz Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/quizzes/:quizId/results"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={QuizResults}
                            title="Quiz Results"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/quizzes/:quizId/attempts/:attemptId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={QuizAttemptDetails}
                            title="Quiz Attempt Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Milestones */}
            <Route
                path="/trainer/milestones"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={Milestones}
                            title="Milestones"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/milestones/create"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={CreateMilestone}
                            title="Create Milestone"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/milestones/edit/:milestoneId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={EditMilestone}
                            title="Edit Milestone"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/milestones/:milestoneId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={MilestoneDetails}
                            title="Milestone Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Management of Trainees */}
            <Route
                path="/trainer/trainees"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={Trainees}
                            title="Trainees"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/trainees/:traineeId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TraineeDetails}
                            title="Trainee Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/trainees/:traineeId/progress"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TraineeProgress}
                            title="Trainee Progress"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Refresher Courses */}
            <Route
                path="/trainer/refresher-courses"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={RefresherCourses}
                            title="Refresher Courses"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
    path="/trainer/refresher-courses/:courseId"
    element={
        <ProtectedRoute role="trainer">
            <DashboardWrapper
                component={RefresherCourseDetail}
                title="Refresher Course Details"
                role="trainer"
            />
        </ProtectedRoute>
    }
/>
<Route
    path="/trainer/refresher-courses/edit/:courseId"
    element={
        <ProtectedRoute role="trainer">
            <DashboardWrapper
                component={EditRefresherCourse}
                title="Refresher Course Edit"
                role="trainer"
            />
        </ProtectedRoute>
    }
/>
            <Route
                path="/trainer/refresher-courses/create"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={CreateRefresher}
                            title="Create Refresher Course"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/refresher-enrollment"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={RefresherEnrollment}
                            title="Refresher Enrollment"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Records */}
            <Route
                path="/trainer/records"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TrainerRecords}
                            title="Training Records"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
             <Route
                path="/trainer/records/:recordId"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={RecordDetail}
                            title="Training Records Details"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainer/records/upload"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={UploadTrainingRecord}
                            title="Upload Training Record"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainer Profile */}
            <Route
                path="/trainer/profile"
                element={
                    <ProtectedRoute role="trainer">
                        <DashboardWrapper
                            component={TrainerProfile}
                            title="Profile"
                            role="trainer"
                        />
                    </ProtectedRoute>
                }
            />

            {/* ========== TRAINEE ROUTES ========== */}
            <Route
                path="/trainee-dashboard"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineeDashboard}
                            title="Trainee Dashboard"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Programs */}
            <Route
                path="/trainee/programs"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineePrograms}
                            title="My Programs"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainee/programs/:programId"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineeProgramDetails}
                            title="Program Details"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Assessments */}
            <Route
                path="/trainee/assessments"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineeAssessments}
                            title="Assessments"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainee/assessments/quiz/:quizId"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TakeQuiz}
                            title="Take Quiz"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainee/assessments/quiz/:quizId/feedback"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={QuizFeedback}
                            title="Quiz Feedback"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Progress */}
            <Route
                path="/trainee/progress"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={ProgressTracking}
                            title="Progress Tracking"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Milestones */}
            <Route
                path="/trainee/milestones"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineeMilestones}
                            title="Milestones"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Certificates */}
            <Route
                path="/trainee/certificates"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={Certificates}
                            title="Certificates"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/trainee/certificates/:certificateId"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={CertificateDetails}
                            title="Certificate Details"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />
              <Route
                path="/trainee/certificate-print/:certificateId"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={CertificatePrint }
                            title="Certificate Details"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

<Route
                path="/certificate/share/:token" 
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={CertificateShare }
                            title="Certificate Details"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Trainee Profile */}
            <Route
                path="/trainee/profile"
                element={
                    <ProtectedRoute role="trainee">
                        <DashboardWrapper
                            component={TraineeProfilePage}
                            title="Profile"
                            role="trainee"
                        />
                    </ProtectedRoute>
                }
            />

            {/* ========== APPLICANT ROUTES ========== */}
            <Route
                path="/applicant-dashboard"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={ApplicantDashboard}
                            title="Applicant Dashboard"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Applicant Programs */}
            <Route
                path="/applicant/programs"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={ApplicantPrograms}
                            title="Available Programs"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/applicant/programs/:programId/apply"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={ProgramApplication}
                            title="Apply for Program"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Job Roles */}
            <Route
                path="/applicant/job-roles"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={JobRoles}
                            title="Job Roles"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />

<Route
    path="/applicant/notifications"
    element={
        <ProtectedRoute role="applicant">
            <DashboardWrapper
                component={NotificationsPage}
                title="Notifications"
                role="applicant"
            />
        </ProtectedRoute>
    }
/>
            {/* Applications */}
            <Route
                path="/applicant/applications"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={Applications}
                            title="My Applications"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/applicant/applications/:applicationId"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={ApplicationDetails}
                            title="Application Details"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Upload Documents */}
            <Route
                path="/applicant/upload"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={UploadDocuments}
                            title="Upload Documents"
                            role="applicant"
                        />
</ProtectedRoute>
                }
            />

            {/* Applicant Profile */}
            <Route
                path="/applicant/profile"
                element={
                    <ProtectedRoute role="applicant">
                        <DashboardWrapper
                            component={ApplicantProfile}
                            title="Profile"
                            role="applicant"
                        />
                    </ProtectedRoute>
                }
            />

            {/* Default route */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* 404 Route */}
            <Route 
                path="*" 
                element={
                    <ProtectedRoute>
                        <NotFound />
                    </ProtectedRoute>
                } 
            />
        </Routes>
    );
};

export default AppRoutes;