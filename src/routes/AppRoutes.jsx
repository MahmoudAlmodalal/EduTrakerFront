import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';
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
import Communication from '../pages/SuperAdmin/Communication';

// Workstream Manager Pages
import WorkstreamLayout from '../components/WorkstreamLayout';
import WorkstreamDashboard from '../pages/WorkstreamManager/WorkstreamDashboard';
import SchoolManagement from '../pages/WorkstreamManager/SchoolManagement';
import SchoolManagerAssignment from '../pages/WorkstreamManager/SchoolManagerAssignment';

import WorkstreamSettings from '../pages/WorkstreamManager/WorkstreamSettings';
import WorkstreamReports from '../pages/WorkstreamManager/WorkstreamReports';
import WorkstreamCommunication from '../pages/WorkstreamManager/WorkstreamCommunication';

// School Manager Pages
import SchoolManagerLayout from '../components/SchoolManagerLayout';
import SchoolDashboard from '../pages/SchoolManager/SchoolDashboard';
import AcademicConfiguration from '../pages/SchoolManager/AcademicConfiguration';
import AcademicReports from '../pages/SchoolManager/AcademicReports';
import TeacherMonitoring from '../pages/SchoolManager/TeacherMonitoring';
import DepartmentManagement from '../pages/SchoolManager/DepartmentManagement';
import SecretaryMonitoring from '../pages/SchoolManager/SecretaryMonitoring';
import SchoolManagerSettings from '../pages/SchoolManager/SchoolManagerSettings';

// Secretary Pages
import SecretaryLayout from '../components/SecretaryLayout';
import SecretaryDashboard from '../pages/Secretary/SecretaryDashboard';
import StudentAdmissions from '../pages/Secretary/StudentAdmissions';
import GuardianLinking from '../pages/Secretary/GuardianLinking';
import SecretaryAttendance from '../pages/Secretary/SecretaryAttendance';
import SecretaryCommunication from '../pages/Secretary/SecretaryCommunication';
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
import GuardianCommunication from '../pages/Guardian/Communication';
import GuardianSettings from '../pages/Guardian/GuardianSettings';

// Teacher Pages
import TeacherLayout from '../components/TeacherLayout';
import TeacherDashboard from '../pages/Teacher/TeacherDashboard';
import ClassManagement from '../pages/Teacher/ClassManagement';
import Assessments from '../pages/Teacher/Assessments';
import LessonPlans from '../pages/Teacher/LessonPlans';
import TeacherCommunication from '../pages/Teacher/Communication';
import TeacherSettings from '../pages/Teacher/TeacherSettings';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/login" element={<RoleSelection />} />
            <Route path="/login/super-admin" element={<Login role="SUPER_ADMIN" />} />
            <Route path="/login/workstream-manager" element={<Login role="WORKSTREAM_MANAGER" />} />
            <Route path="/login/school-manager" element={<Login role="SCHOOL_MANAGER" />} />
            <Route path="/login/secretary" element={<Login role="SECRETARY" />} />
            <Route path="/login/teacher" element={<Login role="TEACHER" />} />
            <Route path="/login/student" element={<Login role="STUDENT" />} />
            <Route path="/login/guardian" element={<Login role="GUARDIAN" />} />

            {/* Protected Routes - Super Admin */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/super-admin" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="workstreams" element={<WorkstreamManagement />} />
                    <Route path="reports" element={<AnalyticsReports />} />
                    <Route path="settings" element={<SystemSettings />} />
                    <Route path="communication" element={<Communication />} />
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
                    <Route path="communication" element={<WorkstreamCommunication />} />
                    <Route path="settings" element={<WorkstreamSettings />} />
                </Route>
            </Route>

            {/* Protected Routes - School Manager */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_MANAGER']} />}>
                <Route path="/school-manager" element={<SchoolManagerLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SchoolDashboard />} />
                    <Route path="configuration" element={<AcademicConfiguration />} />
                    <Route path="reports" element={<AcademicReports />} />
                    <Route path="teachers" element={<TeacherMonitoring />} />
                    <Route path="departments" element={<DepartmentManagement />} />
                    <Route path="secretaries" element={<SecretaryMonitoring />} />
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
                    <Route path="communication" element={<SecretaryCommunication />} />
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
                    <Route path="settings" element={<StudentSettings />} />
                </Route>
            </Route>


            {/* Protected Routes - Guardian */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GUARDIAN']} />}>
                <Route path="/guardian" element={<GuardianLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<GuardianDashboard />} />
                    <Route path="monitoring" element={<ChildrenMonitoring />} />
                    <Route path="communication" element={<GuardianCommunication />} />
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
                    <Route path="lesson-plans" element={<LessonPlans />} />
                    <Route path="communication" element={<TeacherCommunication />} />
                    <Route path="settings" element={<TeacherSettings />} />
                </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
