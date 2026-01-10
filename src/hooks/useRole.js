import { useAuth } from '../context/AuthContext';
import { getRoleConfig, getBasePath, getNavigation } from '../config/roleConfig';

/**
 * Hook for accessing role-related information and configuration
 * Provides role config, navigation items, and convenience methods
 */
export const useRole = () => {
    const { user, permissions, hasPermission, hasAnyPermission, hasAllPermissions, isRole } = useAuth();

    const role = user?.role || null;
    const config = getRoleConfig(role);
    const navigation = getNavigation(role);
    const basePath = getBasePath(role);

    return {
        // Current role info
        role,
        config,
        navigation,
        basePath,
        permissions,

        // Display helpers
        displayName: config?.displayName || role,
        brandIcon: config?.brandIcon || 'Shield',

        // Dashboard config
        dashboardWidgets: config?.dashboard?.widgets || [],
        quickActions: config?.dashboard?.quickActions || [],

        // Permission helpers (passed through from useAuth)
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,

        // Role checks
        isRole,
        isAdmin: role === 'SUPER_ADMIN',
        isTeacher: role === 'TEACHER',
        isStudent: role === 'STUDENT',
        isGuardian: role === 'GUARDIAN',
        isSecretary: role === 'SECRETARY',
        isSchoolManager: role === 'SCHOOL_MANAGER',
        isWorkstreamManager: role === 'WORKSTREAM_MANAGER',
    };
};

export default useRole;
