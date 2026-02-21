import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getRoleConfig, getBasePath } from '../config/roleConfig';
import authService from '../services/authService';
import { sessionCache } from '../utils/sessionCache';
import SessionManager from '../utils/sessionManager';
import { api } from '../utils/api';
import { getStoredUserRaw, setStoredUser, clearStoredUser } from '../utils/userStorage';

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

const normalizeRoleKey = (role) => {
    if (role === null || role === undefined) {
        return '';
    }

    const normalizedRole = String(role).trim().toLowerCase();
    if (!normalizedRole) {
        return '';
    }

    return ROLE_MAP[normalizedRole] || normalizedRole.toUpperCase();
};

const normalizeUser = (rawUser) => {
    if (!rawUser || typeof rawUser !== 'object') {
        return null;
    }

    const displayNameCandidate =
        (typeof rawUser.displayName === 'string' && rawUser.displayName.trim())
            ? rawUser.displayName
            : (rawUser.full_name || rawUser.email || '');

    return {
        ...rawUser,
        role: normalizeRoleKey(rawUser.role),
        displayName: String(displayNameCandidate || '').trim() || 'User'
    };
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(() => {
        const savedUser = getStoredUserRaw();
        if (!savedUser) {
            return null;
        }

        try {
            return normalizeUser(JSON.parse(savedUser));
        } catch (error) {
            console.warn('Failed to parse saved user session:', error);
            clearStoredUser();
            return null;
        }
    });
    const [permissions, setPermissions] = useState([]);
    const [portalType, setPortalType] = useState(null); // 'PORTAL' or 'WORKSTREAM'
    const [workstreamId, setWorkstreamId] = useState(null);
    const navigate = useNavigate();

    // Restore session on load and check for extension
    useEffect(() => {
        const checkAndRestoreSession = async () => {
            const accessToken = sessionStorage.getItem('accessToken');
            const refreshToken = sessionStorage.getItem('refreshToken');
            const savedUser = getStoredUserRaw();
            const savedPortalType = sessionStorage.getItem('portalType');
            const savedWorkstreamId = sessionStorage.getItem('workstreamId');

            if (accessToken && savedUser) {
                try {
                    const normalizedUser = normalizeUser(JSON.parse(savedUser));
                    if (!normalizedUser?.role) {
                        throw new Error('Saved user session is missing a valid role.');
                    }
                    const roleConfig = getRoleConfig(normalizedUser?.role);

                    // Check if session tracking exists
                    const sessionInfo = SessionManager.getSessionInfo();

                    // If no session info, user just logged in - skip check
                    if (!sessionInfo) {
                        setUser(normalizedUser);
                        setPermissions(roleConfig?.permissions || []);
                        setPortalType(savedPortalType);
                        setWorkstreamId(savedWorkstreamId);
                        setStoredUser(normalizedUser);
                        return;
                    }

                    // Check session status
                    const sessionCheck = SessionManager.checkSession();

                    if (!sessionCheck.isValid) {
                        // Session expired and cannot extend - force logout
                        console.warn('⛔ Session expired:', sessionCheck.reason);
                        clearStoredUser();
                        sessionStorage.clear();
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
                            sessionStorage.setItem('accessToken', response.access);
                            if (response.refresh) {
                                sessionStorage.setItem('refreshToken', response.refresh);
                            }

                            // Extend session
                            const extensionResult = SessionManager.extendSession();

                            if (!extensionResult.success) {
                                console.error('❌ Failed to extend session:', extensionResult.reason);
                                clearStoredUser();
                                sessionStorage.clear();
                                sessionCache.clear();
                                SessionManager.clearSession();
                                navigate('/login');
                                return;
                            }
                        } catch (error) {
                            console.error('❌ Token refresh failed:', error);
                            clearStoredUser();
                            sessionStorage.clear();
                            sessionCache.clear();
                            SessionManager.clearSession();
                            navigate('/login');
                            return;
                        }
                    }

                    // Session is valid - restore user
                    setUser(normalizedUser);
                    setPermissions(roleConfig?.permissions || []);
                    setPortalType(savedPortalType);
                    setWorkstreamId(savedWorkstreamId);
                    setStoredUser(normalizedUser);

                } catch (e) {
                    console.error('Failed to restore session:', e);
                    clearStoredUser();
                    sessionStorage.clear();
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

        // Start each authenticated session with a clean client-side data cache.
        queryClient.clear();
        sessionCache.clear();

        // 1. Store tokens and metadata
        sessionStorage.setItem('accessToken', tokens.access);
        sessionStorage.setItem('refreshToken', tokens.refresh);
        sessionStorage.setItem('portalType', type);
        if (wsId) sessionStorage.setItem('workstreamId', wsId.toString());

        // 2. Normalize and store authenticated user data
        const userData = normalizeUser(backendUser);
        if (!userData?.role) {
            throw new Error('Unable to resolve your account role. Please contact support.');
        }
        const roleConfig = getRoleConfig(userData?.role);
        setUser(userData);
        setPortalType(type);
        setWorkstreamId(wsId);

        // Persist user data for the current browser session only (exclude tokens)
        setStoredUser(userData);

        // 3. Set permissions
        setPermissions(roleConfig?.permissions || []);

        // 4. Initialize session tracking
        SessionManager.initSession();

        // 5. Redirect to the role's base path
        const basePath = getBasePath(userData?.role);
        navigate(basePath);
    }, [navigate, queryClient]);

    const logout = useCallback(async () => {
        const refreshToken = sessionStorage.getItem('refreshToken');
        const savedPortalType = sessionStorage.getItem('portalType');
        const savedWorkstreamId = sessionStorage.getItem('workstreamId');

        // Determine the correct login path before clearing storage
        let loginPath = '/login/portal'; // Default to portal login
        if (savedPortalType === 'WORKSTREAM' && savedWorkstreamId) {
            loginPath = `/login/workstream/${savedWorkstreamId}`;
        }

        // Preserve the latest portal context for correct redirect after logout/back navigation
        if (savedPortalType) {
            sessionStorage.setItem('lastPortalType', savedPortalType);
        }
        if (savedWorkstreamId) {
            sessionStorage.setItem('lastWorkstreamId', savedWorkstreamId);
        }

        // 1. Attempt to notify backend (best effort, before clearing state)
        if (refreshToken) {
            try {
                await authService.logout(refreshToken);
            } catch (e) {
                console.warn('Backend logout failed, continuing with session cleanup', e);
            }
        }

        // 2. Clear session storage immediately
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        clearStoredUser();
        sessionStorage.removeItem('portalType');
        sessionStorage.removeItem('workstreamId');

        // 3. Clear session cache and manager
        sessionCache.clear();
        queryClient.clear();
        SessionManager.clearSession();

        // 4. Reset React state
        setUser(null);
        setPermissions([]);
        setPortalType(null);
        setWorkstreamId(null);

        // 5. Redirect to the appropriate login page
        navigate(loginPath, { replace: true });
    }, [navigate, queryClient]);

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
