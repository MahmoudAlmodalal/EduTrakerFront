import { useAuth } from '../context/AuthContext';

/**
 * Hook for permission-based access control
 * Used for conditional rendering and action guards
 */
export const usePermissions = () => {
    const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

    /**
     * Check permission and return element or null
     * Useful for conditional rendering
     * @param {string} permission - Permission to check
     * @param {React.ReactNode} element - Element to render if permitted
     * @param {React.ReactNode} fallback - Optional fallback element
     */
    const withPermission = (permission, element, fallback = null) => {
        return hasPermission(permission) ? element : fallback;
    };

    /**
     * Check if user can perform action based on permissions
     * @param {string} action - Action name (maps to permission)
     * @returns {boolean}
     */
    const canPerform = (action) => {
        const actionPermissionMap = {
            // User management
            'create-user': 'manage-users',
            'edit-user': 'manage-users',
            'delete-user': 'manage-users',

            // Student actions
            'view-students': 'view-students',
            'add-student': 'manage-students',
            'edit-student': 'manage-students',

            // Grade actions
            'view-grades': 'view-grades',
            'edit-grades': 'edit-grades',
            'publish-grades': 'edit-grades',

            // Attendance
            'view-attendance': 'view-attendance',
            'mark-attendance': 'mark-attendance',

            // Reports
            'view-reports': 'view-reports',
            'export-reports': 'export-reports',

            // Messaging
            'send-message': 'send-messages',
            'view-messages': 'send-messages',
        };

        const requiredPermission = actionPermissionMap[action] || action;
        return hasPermission(requiredPermission);
    };

    /**
     * Create a permission guard function
     * @param {string|string[]} requiredPerms - Required permission(s)
     * @param {function} callback - Function to execute if permitted
     */
    const createGuard = (requiredPerms, callback) => {
        return (...args) => {
            const permitted = Array.isArray(requiredPerms)
                ? hasAnyPermission(requiredPerms)
                : hasPermission(requiredPerms);

            if (permitted) {
                return callback(...args);
            }
            console.warn(`Permission denied for: ${requiredPerms}`);
            return null;
        };
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        withPermission,
        canPerform,
        createGuard,
        isFullAccess: permissions.includes('*'),
    };
};

export default usePermissions;
