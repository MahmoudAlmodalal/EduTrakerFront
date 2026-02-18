import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import RequestPasswordReset from '../pages/Auth/RequestPasswordReset';
import ConfirmPasswordReset from '../pages/Auth/ConfirmPasswordReset';
import RoleSelection from '../pages/Auth/RoleSelection';
import Unauthorized from '../pages/Unauthorized';

// Layouts (kept eager — they are lightweight shells)
import MainLayout from '../components/Layout/MainLayout';
import WorkstreamLayout from '../components/WorkstreamLayout';
import SchoolManagerLayout from '../components/SchoolManagerLayout';
import SecretaryLayout from '../components/SecretaryLayout';
import StudentLayout from '../pages/Student/StudentLayout';
import GuardianLayout from '../components/GuardianLayout';
import TeacherLayout from '../components/TeacherLayout';

// Shared (used across many roles)
import GeneralCommunication from '../pages/Shared/GeneralCommunication';

// ─── Lazy-loaded pages (code-split per role) ───────────────────────

// Super Admin
const Dashboard = React.lazy(() => import('../pages/SuperAdmin/Dashboard'));
const UserManagement = React.lazy(() => import('../pages/SuperAdmin/UserManagement'));
const WorkstreamManagement = React.lazy(() => import('../pages/SuperAdmin/WorkstreamManagement'));
const AnalyticsReports = React.lazy(() => import('../pages/SuperAdmin/AnalyticsReports'));
const SystemSettings = React.lazy(() => import('../pages/SuperAdmin/SystemSettings'));
const SupportHelpdesk = React.lazy(() => import('../pages/SuperAdmin/SupportHelpdesk'));
const ActivityLog = React.lazy(() => import('../pages/SuperAdmin/ActivityLog'));

// Workstream Manager
const WorkstreamDashboard = React.lazy(() => import('../pages/WorkstreamManager/WorkstreamDashboard'));
const SchoolManagement = React.lazy(() => import('../pages/WorkstreamManager/SchoolManagement'));
const SchoolManagerAssignment = React.lazy(() => import('../pages/WorkstreamManager/SchoolManagerAssignment'));
const WorkstreamSettings = React.lazy(() => import('../pages/WorkstreamManager/WorkstreamSettings'));
const WorkstreamReports = React.lazy(() => import('../pages/WorkstreamManager/WorkstreamReports'));
const WorkstreamAcademicYearManagementPage = React.lazy(() => import('../pages/WorkstreamManager/AcademicYearManagementPage'));

// School Manager
const SchoolDashboard = React.lazy(() => import('../pages/SchoolManager/SchoolDashboard'));
const GradesManagement = React.lazy(() => import('../pages/SchoolManager/GradesManagement'));
const AcademicConfiguration = React.lazy(() => import('../pages/SchoolManager/AcademicConfiguration'));
const AcademicReports = React.lazy(() => import('../pages/SchoolManager/AcademicReports'));
const TeacherMonitoring = React.lazy(() => import('../pages/SchoolManager/TeacherMonitoring'));
const SystemActivityLog = React.lazy(() => import('../pages/SchoolManager/SystemActivityLog'));
const SecretaryMonitoring = React.lazy(() => import('../pages/SchoolManager/SecretaryMonitoring'));
const SchoolManagerSettings = React.lazy(() => import('../pages/SchoolManager/SchoolManagerSettings'));

// Secretary
const SecretaryDashboard = React.lazy(() => import('../pages/Secretary/SecretaryDashboard'));
const StudentAdmissions = React.lazy(() => import('../pages/Secretary/StudentAdmissions'));
const StudentApplicationReview = React.lazy(() => import('../pages/Secretary/StudentApplicationReview'));
const GuardianLinking = React.lazy(() => import('../pages/Secretary/GuardianLinking'));
const SecretaryAttendance = React.lazy(() => import('../pages/Secretary/SecretaryAttendance'));
const SecretaryInfo = React.lazy(() => import('../pages/Secretary/Info/SecretaryInfo'));
const SecretarySettings = React.lazy(() => import('../pages/Secretary/SecretarySettings'));

// Student
const StudentDashboard = React.lazy(() => import('../pages/Student/Dashboard/StudentDashboard'));
const StudentSubjects = React.lazy(() => import('../pages/Student/Subjects/StudentSubjects'));
const StudentAssignments = React.lazy(() => import('../pages/Student/Assignments/StudentAssignments'));
const StudentResults = React.lazy(() => import('../pages/Student/Results/StudentResults'));
const StudentInfo = React.lazy(() => import('../pages/Student/Info/StudentInfo'));
const StudentSettings = React.lazy(() => import('../pages/Student/Settings/StudentSettings'));

// Guardian
const GuardianDashboard = React.lazy(() => import('../pages/Guardian/GuardianDashboard'));
const ChildrenMonitoring = React.lazy(() => import('../pages/Guardian/ChildrenMonitoring'));
const GuardianInfo = React.lazy(() => import('../pages/Guardian/GuardianInfo'));
const GuardianSettings = React.lazy(() => import('../pages/Guardian/GuardianSettings'));

// Teacher
const TeacherDashboard = React.lazy(() => import('../pages/Teacher/TeacherDashboard'));
const ClassManagement = React.lazy(() => import('../pages/Teacher/ClassManagement'));
const Assessments = React.lazy(() => import('../pages/Teacher/Assessments'));
const AssignmentSubmissions = React.lazy(() => import('../pages/Teacher/AssignmentSubmissions'));
const LessonPlans = React.lazy(() => import('../pages/Teacher/LessonPlans'));
const TeacherContent = React.lazy(() => import('../pages/Teacher/TeacherContent'));
const TeacherCommunication = React.lazy(() => import('../pages/Teacher/TeacherCommunication'));
const TeacherInfo = React.lazy(() => import('../pages/Teacher/TeacherInfo'));
const TeacherSettings = React.lazy(() => import('../pages/Teacher/TeacherSettings'));
const WorkstreamStudentApplication = React.lazy(() => import('../pages/Auth/WorkstreamStudentApplication'));

// Suspense fallback
const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{
                width: 36, height: 36, border: '3px solid #e5e7eb',
                borderTopColor: '#4f46e5', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
            }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
        </div>
    </div>
);

const AppRoutes = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Role Selection (Home) */}
                <Route path="/" element={<RoleSelection />} />

                {/* Portal Login - for Admin & Workstream Manager */}
                <Route path="/login/portal" element={<Login role="PORTAL" />} />
                <Route path="/login" element={<Navigate to="/login/portal" replace />} />

                {/* Portal Registration */}
                <Route path="/register/portal" element={<Register role="PORTAL" />} />
                <Route path="/register" element={<Navigate to="/register/portal" replace />} />

                {/* Workstream Login - URL: /login/workstream/:slug */}
                <Route path="/login/workstream/:workstreamSlug" element={<Login role="WORKSTREAM" />} />

                {/* Workstream Registration */}
                <Route path="/register/workstream/:workstreamSlug" element={<WorkstreamStudentApplication />} />

                {/* Password Reset */}
                <Route path="/password-reset" element={<RequestPasswordReset />} />
                <Route path="/password-reset/confirm" element={<ConfirmPasswordReset />} />

                {/* Protected Routes - Super Admin */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                    <Route path="/super-admin" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="workstreams" element={<WorkstreamManagement />} />
                        <Route path="reports" element={<AnalyticsReports />} />
                        <Route path="settings" element={<SystemSettings />} />
                        <Route path="communication" element={<TeacherCommunication />} />
                        <Route path="support" element={<SupportHelpdesk />} />
                        <Route path="activity" element={<ActivityLog />} />
                    </Route>
                </Route>

                {/* Protected Routes - Workstream Manager */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WORKSTREAM_MANAGER']} />}>
                    <Route path="/workstream" element={<WorkstreamLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<WorkstreamDashboard />} />
                        <Route path="schools" element={<SchoolManagement />} />
                        <Route path="assignments" element={<SchoolManagerAssignment />} />
                        <Route path="academic-year" element={<WorkstreamAcademicYearManagementPage />} />
                        <Route path="reports" element={<WorkstreamReports />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="settings" element={<WorkstreamSettings />} />
                    </Route>
                </Route>

                {/* Protected Routes - School Manager */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_MANAGER']} />}>
                    <Route path="/school-manager" element={<SchoolManagerLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<SchoolDashboard />} />
                        <Route path="grades" element={<GradesManagement />} />
                        <Route path="academic-year" element={<Navigate to="/school-manager/configuration" replace />} />
                        <Route path="configuration" element={<AcademicConfiguration />} />
                        <Route path="reports" element={<AcademicReports />} />
                        <Route path="teachers" element={<TeacherMonitoring />} />
                        <Route path="activity-log" element={<SystemActivityLog />} />
                        <Route path="secretaries" element={<SecretaryMonitoring />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="settings" element={<SchoolManagerSettings />} />
                    </Route>
                </Route>

                {/* Protected Routes - Secretary */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SECRETARY']} />}>
                    <Route path="/secretary" element={<SecretaryLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<SecretaryDashboard />} />
                        <Route path="admissions" element={<StudentAdmissions />} />
                        <Route path="admissions/:applicationId" element={<StudentApplicationReview />} />
                        <Route path="guardians" element={<GuardianLinking />} />
                        <Route path="attendance" element={<SecretaryAttendance />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="info" element={<SecretaryInfo />} />
                        <Route path="settings" element={<SecretarySettings />} />
                    </Route>
                </Route>

                {/* Protected Routes - Student */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'STUDENT']} />}>
                    <Route path="/student" element={<StudentLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<StudentDashboard />} />
                        <Route path="subjects" element={<StudentSubjects />} />
                        <Route path="subjects/:courseId" element={<StudentSubjects />} />
                        <Route path="assignments" element={<StudentAssignments />} />
                        <Route path="assignments/:id" element={<StudentAssignments />} />
                        <Route path="results" element={<StudentResults />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="info" element={<StudentInfo />} />
                        <Route path="settings" element={<StudentSettings />} />
                    </Route>
                </Route>

                {/* Protected Routes - Guardian */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GUARDIAN']} />}>
                    <Route path="/guardian" element={<GuardianLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<GuardianDashboard />} />
                        <Route path="monitoring" element={<ChildrenMonitoring />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="info" element={<GuardianInfo />} />
                        <Route path="settings" element={<GuardianSettings />} />
                    </Route>
                </Route>

                {/* Protected Routes - Teacher */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TEACHER']} />}>
                    <Route path="/teacher" element={<TeacherLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<TeacherDashboard />} />
                        <Route path="classes" element={<ClassManagement />} />
                        <Route path="assessments" element={<Assessments />} />
                        <Route path="assignments/:id/submissions" element={<AssignmentSubmissions />} />
                        <Route path="assignments" element={<Navigate to="/teacher/assessments" replace />} />
                        <Route path="assignments/new" element={<Navigate to="/teacher/assessments?tab=create" replace />} />
                        <Route path="assignment" element={<Navigate to="/teacher/assessments" replace />} />
                        <Route path="assignment/new" element={<Navigate to="/teacher/assessments?tab=create" replace />} />
                        <Route path="lesson-plans" element={<LessonPlans />} />
                        <Route path="content" element={<TeacherContent />} />
                        <Route path="communication" element={<GeneralCommunication />} />
                        <Route path="info" element={<TeacherInfo />} />
                        <Route path="settings" element={<TeacherSettings />} />
                    </Route>
                </Route>

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
