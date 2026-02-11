import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { getRoleConfig, getBasePath } from '../config/roleConfig';
import authService from '../services/authService';
import { sessionCache } from '../utils/sessionCache';
import SessionManager from '../utils/sessionManager';
import { api } from '../utils/api';

// Map Django backend roles to frontend role keys
const ROLE_MAP = {
    'admin': 'SUPER_ADMIN',
    'super_admin': 'SUPER_ADMIN',
    'manager_workstream': 'WORKSTREAM_MANAGER',
    'workstream_manager': 'WORKSTREAM_MANAGER',
    'manager_school': 'SCHOOL_MANAGER',
    'school_manager': 'SCHOOL_MANAGER',
    'secretary': 'SECRETARY',
    'teacher': 'TEACHER',
    'student': 'STUDENT',
    'guardian': 'GUARDIAN',
    'guest': 'GUEST'
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [permissions, setPermissions] = useState([]);
    const [portalType, setPortalType] = useState(null); // 'PORTAL' or 'WORKSTREAM'
    const [workstreamId, setWorkstreamId] = useState(null);
    const navigate = useNavigate();

    // Restore session on load and check for extension
    useEffect(() => {
        const checkAndRestoreSession = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const savedUser = localStorage.getItem('user');
            const savedPortalType = localStorage.getItem('portalType');
            const savedWorkstreamId = localStorage.getItem('workstreamId');

            if (accessToken && savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    const roleConfig = getRoleConfig(parsedUser.role);

                    // Check if session tracking exists
                    const sessionInfo = SessionManager.getSessionInfo();

                    // If no session info, user just logged in - skip check
                    if (!sessionInfo) {
                        setUser(parsedUser);
                        setPermissions(roleConfig?.permissions || []);
                        setPortalType(savedPortalType);
                        setWorkstreamId(savedWorkstreamId);
                        return;
                    }

                    // Check session status
                    const sessionCheck = SessionManager.checkSession();

                    if (!sessionCheck.isValid) {
                        // Session expired and cannot extend - force logout
                        console.warn('⛔ Session expired:', sessionCheck.reason);
                        localStorage.clear();
                        sessionCache.clear();
                        SessionManager.clearSession();
                        navigate('/login');
                        return;
                    }

                    if (sessionCheck.shouldExtend) {
                        // Session expired but can extend - refresh token
                        try {
                            const response = await api.post('/auth/token/refresh/', {
                                refresh: refreshToken
                            });

                            // Update tokens
                            localStorage.setItem('accessToken', response.access);

                            // Extend session
                            const extensionResult = SessionManager.extendSession();

                            if (!extensionResult.success) {
                                console.error('❌ Failed to extend session:', extensionResult.reason);
                                localStorage.clear();
                                sessionCache.clear();
                                SessionManager.clearSession();
                                navigate('/login');
                                return;
                            }
                        } catch (error) {
                            console.error('❌ Token refresh failed:', error);
                            localStorage.clear();
                            sessionCache.clear();
                            SessionManager.clearSession();
                            navigate('/login');
                            return;
                        }
                    }

                    // Session is valid - restore user
                    setUser(parsedUser);
                    setPermissions(roleConfig?.permissions || []);
                    setPortalType(savedPortalType);
                    setWorkstreamId(savedWorkstreamId);

                } catch (e) {
                    console.error('Failed to restore session:', e);
                    localStorage.clear();
                    sessionCache.clear();
                    SessionManager.clearSession();
                }
            }
        };

        checkAndRestoreSession();
    }, [navigate]);

    /**
     * @param {Object} authData - The response from the login API
     * @param {string} type - 'PORTAL' or 'WORKSTREAM'
     * @param {string|number} wsId - Optional workstream ID
     */
    const login = useCallback((authData, type = 'PORTAL', wsId = null) => {
        const { user: backendUser, tokens } = authData;

        // 1. Store tokens and metadata
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        localStorage.setItem('portalType', type);
        if (wsId) localStorage.setItem('workstreamId', wsId.toString());

        // Map backend role to frontend role key
        const backendRole = backendUser.role?.toLowerCase();
        const roleKey = ROLE_MAP[backendRole] || backendRole?.toUpperCase();
        const roleConfig = getRoleConfig(roleKey);

        // 2. Set the authenticated user state
        const userData = {
            ...backendUser,
            role: roleKey,
            displayName: backendUser.full_name || backendUser.email
        };
        setUser(userData);
        setPortalType(type);
        setWorkstreamId(wsId);

        // Persist user data for reload (exclude tokens)
        localStorage.setItem('user', JSON.stringify(userData));

        // 3. Set permissions
        setPermissions(roleConfig?.permissions || []);

        // 4. Initialize session tracking
        SessionManager.initSession();

        // 5. Redirect to the role's base path
        const basePath = getBasePath(roleKey);
        navigate(basePath);
    }, [navigate]);

    const logout = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        const savedPortalType = localStorage.getItem('portalType');
        const savedWorkstreamId = localStorage.getItem('workstreamId');

        // Determine the correct login path before clearing storage
        let loginPath = '/login/portal'; // Default to portal login
        if (savedPortalType === 'WORKSTREAM' && savedWorkstreamId) {
            loginPath = `/login/workstream/${savedWorkstreamId}`;
        }

        // Preserve the latest portal context for correct redirect after logout/back navigation
        if (savedPortalType) {
            localStorage.setItem('lastPortalType', savedPortalType);
        }
        if (savedWorkstreamId) {
            localStorage.setItem('lastWorkstreamId', savedWorkstreamId);
        }

        // 1. Clear local storage immediately
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('portalType');
        localStorage.removeItem('workstreamId');

        // 2. Clear session cache and manager
        sessionCache.clear();
        SessionManager.clearSession();

        // 3. Reset React state
        setUser(null);
        setPermissions([]);
        setPortalType(null);
        setWorkstreamId(null);

        // 4. Redirect to the appropriate login page
        navigate(loginPath, { replace: true });

        // 5. Attempt to notify backend (best effort, in background)
        if (refreshToken) {
            try {
                await authService.logout(refreshToken);
            } catch (e) {
                console.warn('Backend logout failed, local cleanup already complete', e);
            }
        }
    }, [navigate]);

    const isAuthenticated = !!user;

    const value = {
        user,
        permissions,
        portalType,
        workstreamId,
        login,
        logout,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
