import { api } from '../utils/api';

const authService = {
    /**
     * Login for both Portal and Workstream
     * @param {Object} credentials - { email, password }
     * @param {string} portalType - 'PORTAL' or 'WORKSTREAM'
     * @param {string|number} workstreamId - Required if portalType is 'WORKSTREAM'
     */
    login: async (credentials, portalType, workstreamSlug = null) => {
        const url = portalType === 'PORTAL'
            ? '/portal/auth/login/'
            : `/workstream/${workstreamSlug}/auth/login/`;

        return await api.post(url, credentials);
    },

    /**
     * Register for both Portal and Workstream
     * @param {Object} userData - { email, full_name, password, password_confirm }
     * @param {string} portalType - 'PORTAL' or 'WORKSTREAM'
     * @param {string|number} workstreamId - Required if portalType is 'WORKSTREAM'
     */
    register: async (userData, portalType, workstreamSlug = null) => {
        const url = portalType === 'PORTAL'
            ? '/portal/auth/register/'
            : `/workstream/${workstreamSlug}/auth/register/`;

        return await api.post(url, userData);
    },

    /**
     * Logout and blacklist refresh token
     * @param {string} refreshToken 
     */
    logout: async (refreshToken) => {
        try {
            return await api.post('/auth/logout/', { refresh: refreshToken });
        } catch (error) {
            // Even if logout fails on server (e.g. token expired), we'll clear local state
            console.error('Server logout failed:', error);
            throw error;
        }
    },

    /**
     * Request password reset
     * @param {string} email 
     */
    requestPasswordReset: async (email) => {
        return await api.post('/auth/password-reset/', { email });
    },

    /**
     * Confirm password reset with token
     * @param {Object} data - { uid, token, new_password, confirm_password }
     */
    confirmPasswordReset: async (data) => {
        return await api.post('/auth/password-reset/confirm/', data);
    }
};

export default authService;
