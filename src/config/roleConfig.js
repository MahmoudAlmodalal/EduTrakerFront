/**
 * Role Configuration File
 * Centralized configuration for all user roles in EduTracker
 */

// Icon names that map to lucide-react icons
export const roleConfigs = {
    SUPER_ADMIN: {
        basePath: '/super-admin',
        brandIcon: 'Shield',
        displayName: 'Super Admin',
        permissions: ['*'], // Full access
        navigation: [
            { path: '', labelKey: 'superadmin.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'users', labelKey: 'superadmin.nav.users', icon: 'Users' },
            { path: 'workstreams', labelKey: 'superadmin.nav.workstreams', icon: 'Briefcase' },
            { path: 'reports', labelKey: 'superadmin.nav.reports', icon: 'BarChart3' },
            { path: 'communication', labelKey: 'superadmin.nav.communication', icon: 'MessageSquare' },
            { path: 'support', labelKey: 'superadmin.nav.support', icon: 'HelpCircle' },
            { path: 'activity', labelKey: 'superadmin.nav.activity', icon: 'Activity' },
            { path: 'settings', labelKey: 'superadmin.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['total-users', 'total-schools', 'total-workstreams', 'notifications'],
            quickActions: ['add-user', 'add-school', 'view-reports', 'system-settings']
        }
    },

    WORKSTREAM_MANAGER: {
        basePath: '/workstream',
        brandIcon: 'Briefcase',
        displayName: 'Workstream Manager',
        permissions: [
            'view-schools', 'manage-schools',
            'view-school-managers', 'assign-school-managers',
            'view-reports', 'export-reports',
            'send-messages'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'workstream.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'schools', labelKey: 'workstream.nav.schools', icon: 'School' },
            { path: 'assignments', labelKey: 'workstream.nav.assignments', icon: 'UserCheck' },
            { path: 'reports', labelKey: 'workstream.nav.reports', icon: 'BarChart3' },
            { path: 'communication', labelKey: 'workstream.nav.communication', icon: 'MessageSquare' },
            { path: 'settings', labelKey: 'workstream.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['total-schools', 'active-teachers', 'student-count', 'attendance-rate'],
            quickActions: ['add-school', 'assign-manager', 'view-reports']
        }
    },

    SCHOOL_MANAGER: {
        basePath: '/school-manager',
        brandIcon: 'School',
        displayName: 'School Manager',
        permissions: [
            'view-teachers', 'manage-teachers',
            'view-secretaries', 'manage-secretaries',
            'view-departments', 'manage-departments',
            'view-academic-config', 'manage-academic-config',
            'view-reports', 'export-reports'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'schoolManager.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'configuration', labelKey: 'schoolManager.nav.configuration', icon: 'Cog' },
            { path: 'reports', labelKey: 'schoolManager.nav.reports', icon: 'BarChart3' },
            { path: 'teachers', labelKey: 'schoolManager.nav.teachers', icon: 'Users' },
            { path: 'departments', labelKey: 'schoolManager.nav.departments', icon: 'Building' },
            { path: 'secretaries', labelKey: 'schoolManager.nav.secretaries', icon: 'UserCheck' },
            { path: 'settings', labelKey: 'schoolManager.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['total-teachers', 'total-students', 'total-classes', 'attendance-today'],
            quickActions: ['add-teacher', 'configure-timetable', 'view-reports']
        }
    },

    SECRETARY: {
        basePath: '/secretary',
        brandIcon: 'ClipboardList',
        displayName: 'Secretary',
        permissions: [
            'view-students', 'manage-students',
            'view-guardians', 'manage-guardians',
            'view-attendance', 'mark-attendance',
            'send-messages'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'secretary.nav.overview', icon: 'LayoutDashboard' },
            { path: 'admissions', labelKey: 'secretary.nav.admissions', icon: 'UserPlus' },
            { path: 'guardians', labelKey: 'secretary.nav.guardians', icon: 'Users' },
            { path: 'attendance', labelKey: 'secretary.nav.attendance', icon: 'FileText' },
            { path: 'communication', labelKey: 'secretary.nav.communication', icon: 'MessageSquare' },
            { path: 'settings', labelKey: 'secretary.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['pending-admissions', 'attendance-today', 'unlinked-guardians', 'messages'],
            quickActions: ['add-student', 'link-guardian', 'mark-attendance']
        }
    },

    TEACHER: {
        basePath: '/teacher',
        brandIcon: 'GraduationCap',
        displayName: 'Teacher',
        permissions: [
            'view-students', 'view-classes',
            'edit-grades', 'view-grades',
            'mark-attendance', 'view-attendance',
            'create-assessments', 'manage-lesson-plans',
            'send-messages'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'teacher.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'classes', labelKey: 'teacher.nav.classes', icon: 'Users' },
            { path: 'assessments', labelKey: 'teacher.nav.assessments', icon: 'FileText' },
            { path: 'lesson-plans', labelKey: 'teacher.nav.lessonPlans', icon: 'BookOpen' },
            { path: 'communication', labelKey: 'teacher.nav.communication', icon: 'MessageSquare' },
            { path: 'settings', labelKey: 'teacher.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['my-classes', 'pending-grades', 'attendance-summary', 'upcoming-lessons'],
            quickActions: ['record-attendance', 'add-grades', 'create-assignment']
        }
    },

    STUDENT: {
        basePath: '/student',
        brandIcon: 'BookOpen',
        displayName: 'Student',
        permissions: [
            'view-grades', 'view-attendance',
            'view-subjects', 'view-schedule',
            'submit-assignments', 'view-resources'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'student.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'subjects', labelKey: 'student.nav.subjects', icon: 'BookOpen' },
            { path: 'results', labelKey: 'student.nav.results', icon: 'Award' },
            { path: 'attendance', labelKey: 'student.nav.attendance', icon: 'Calendar' },
            { path: 'settings', labelKey: 'student.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['daily-schedule', 'upcoming-assignments', 'attendance-alert', 'grades-summary'],
            quickActions: ['view-schedule', 'check-grades', 'view-assignments']
        }
    },

    GUARDIAN: {
        basePath: '/guardian',
        brandIcon: 'ShieldCheck',
        displayName: 'Guardian',
        permissions: [
            'view-children', 'view-grades',
            'view-attendance', 'view-reports',
            'send-messages', 'view-fees'
        ],
        navigation: [
            { path: 'dashboard', labelKey: 'guardian.nav.dashboard', icon: 'LayoutDashboard' },
            { path: 'monitoring', labelKey: 'guardian.nav.monitoring', icon: 'Users' },
            { path: 'communication', labelKey: 'guardian.nav.communication', icon: 'MessageSquare' },
            { path: 'settings', labelKey: 'guardian.nav.settings', icon: 'Settings' },
        ],
        dashboard: {
            widgets: ['children-overview', 'attendance-summary', 'grades-summary', 'upcoming-events'],
            quickActions: ['view-child-progress', 'message-teacher', 'view-reports']
        }
    }
};

/**
 * Get configuration for a specific role
 * @param {string} role - The role key (e.g., 'SUPER_ADMIN', 'TEACHER')
 * @returns {object|null} Role configuration or null if not found
 */
export const getRoleConfig = (role) => {
    return roleConfigs[role] || null;
};

/**
 * Get navigation items for a role
 * @param {string} role - The role key
 * @returns {array} Navigation items array
 */
export const getNavigation = (role) => {
    return roleConfigs[role]?.navigation || [];
};

/**
 * Get permissions for a role
 * @param {string} role - The role key
 * @returns {array} Permissions array
 */
export const getPermissions = (role) => {
    return roleConfigs[role]?.permissions || [];
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The role key
 * @param {string} permission - The permission to check
 * @returns {boolean} True if role has permission
 */
export const roleHasPermission = (role, permission) => {
    const permissions = getPermissions(role);
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
};

/**
 * Get all role keys
 * @returns {array} Array of role keys
 */
export const getAllRoles = () => {
    return Object.keys(roleConfigs);
};

/**
 * Get base path for a role
 * @param {string} role - The role key
 * @returns {string} Base path
 */
export const getBasePath = (role) => {
    return roleConfigs[role]?.basePath || '/';
};

export default roleConfigs;
