import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import RequestPasswordReset from '../pages/Auth/RequestPasswordReset';
import ConfirmPasswordReset from '../pages/Auth/ConfirmPasswordReset';
import RoleSelection from '../pages/Auth/RoleSelection';
import Unauthorized from '../pages/Unauthorized';

// Layouts
import MainLayout from '../components/Layout/MainLayout';

// Super Admin Pages
import Dashboard from '../pages/SuperAdmin/Dashboard';
import UserManagement from '../pages/SuperAdmin/UserManagement';
import WorkstreamManagement from '../pages/SuperAdmin/WorkstreamManagement';
import AnalyticsReports from '../pages/SuperAdmin/AnalyticsReports';
import SystemSettings from '../pages/SuperAdmin/SystemSettings';
import SupportHelpdesk from '../pages/SuperAdmin/SupportHelpdesk';
import ActivityLog from '../pages/SuperAdmin/ActivityLog';
import GeneralCommunication from '../pages/Shared/GeneralCommunication';

// Workstream Manager Pages
import WorkstreamLayout from '../components/WorkstreamLayout';
import WorkstreamDashboard from '../pages/WorkstreamManager/WorkstreamDashboard';
import SchoolManagement from '../pages/WorkstreamManager/SchoolManagement';
import SchoolManagerAssignment from '../pages/WorkstreamManager/SchoolManagerAssignment';

import WorkstreamSettings from '../pages/WorkstreamManager/WorkstreamSettings';
import WorkstreamReports from '../pages/WorkstreamManager/WorkstreamReports';

// School Manager Pages
import SchoolManagerLayout from '../components/SchoolManagerLayout';
import SchoolDashboard from '../pages/SchoolManager/SchoolDashboard';
import GradesManagement from '../pages/SchoolManager/GradesManagement';
import AcademicYearManagementPage from '../pages/SchoolManager/AcademicYearManagementPage';
import AcademicConfiguration from '../pages/SchoolManager/AcademicConfiguration';
import AcademicReports from '../pages/SchoolManager/AcademicReports';
import TeacherMonitoring from '../pages/SchoolManager/TeacherMonitoring';
import SystemActivityLog from '../pages/SchoolManager/SystemActivityLog';
import SecretaryMonitoring from '../pages/SchoolManager/SecretaryMonitoring';
import SchoolManagerSettings from '../pages/SchoolManager/SchoolManagerSettings';

// Secretary Pages
import SecretaryLayout from '../components/SecretaryLayout';
import SecretaryDashboard from '../pages/Secretary/SecretaryDashboard';
import StudentAdmissions from '../pages/Secretary/StudentAdmissions';
import GuardianLinking from '../pages/Secretary/GuardianLinking';
import SecretaryAttendance from '../pages/Secretary/SecretaryAttendance';
import SecretarySettings from '../pages/Secretary/SecretarySettings';


// Student Pages
import StudentLayout from '../pages/Student/StudentLayout';
import StudentDashboard from '../pages/Student/Dashboard/StudentDashboard';
import StudentSubjects from '../pages/Student/Subjects/StudentSubjects';
import StudentResults from '../pages/Student/Results/StudentResults';
import StudentAttendance from '../pages/Student/Attendance/StudentAttendance';
import StudentSettings from '../pages/Student/Settings/StudentSettings';

// Guardian Pages
import GuardianLayout from '../components/GuardianLayout';
import GuardianDashboard from '../pages/Guardian/GuardianDashboard';
import ChildrenMonitoring from '../pages/Guardian/ChildrenMonitoring';
import GuardianSettings from '../pages/Guardian/GuardianSettings';

// Teacher Pages
import TeacherLayout from '../components/TeacherLayout';
import TeacherDashboard from '../pages/Teacher/TeacherDashboard';
import ClassManagement from '../pages/Teacher/ClassManagement';
import Assessments from '../pages/Teacher/Assessments';
import LessonPlans from '../pages/Teacher/LessonPlans';
import TeacherSettings from '../pages/Teacher/TeacherSettings';

const AppRoutes = () => {
    return (
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
            <Route path="/register/workstream/:workstreamSlug" element={<Register role="WORKSTREAM" />} />

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
                    <Route path="communication" element={<GeneralCommunication />} />
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
                    <Route path="academic-year" element={<AcademicYearManagementPage />} />
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
                    <Route path="guardians" element={<GuardianLinking />} />
                    <Route path="attendance" element={<SecretaryAttendance />} />
                    <Route path="communication" element={<GeneralCommunication />} />
                    <Route path="settings" element={<SecretarySettings />} />
                </Route>
            </Route>

            {/* Protected Routes - Student */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'STUDENT']} />}>
                <Route path="/student" element={<StudentLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="subjects" element={<StudentSubjects />} />
                    <Route path="results" element={<StudentResults />} />
                    <Route path="attendance" element={<StudentAttendance />} />
                    <Route path="communication" element={<GeneralCommunication />} />
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
                    <Route path="assignments" element={<Navigate to="/teacher/assessments" replace />} />
                    <Route path="assignments/new" element={<Navigate to="/teacher/assessments?tab=create" replace />} />
                    <Route path="assignment" element={<Navigate to="/teacher/assessments" replace />} />
                    <Route path="assignment/new" element={<Navigate to="/teacher/assessments?tab=create" replace />} />
                    <Route path="lesson-plans" element={<LessonPlans />} />
                    <Route path="communication" element={<GeneralCommunication />} />
                    <Route path="settings" element={<TeacherSettings />} />
                </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
