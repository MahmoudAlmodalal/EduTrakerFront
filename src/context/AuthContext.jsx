import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleConfig, getBasePath } from '../config/roleConfig';
import authService from '../services/authService';

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
    'guest': 'GUEST',
    'staff': 'SUPER_ADMIN', // Often staff maps to admin capabilities
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [portalType, setPortalType] = useState(null); // 'PORTAL' or 'WORKSTREAM'
    const [workstreamId, setWorkstreamId] = useState(null);
    const navigate = useNavigate();

    // Restore session on load
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        const savedPortalType = localStorage.getItem('portalType');
        const savedWorkstreamId = localStorage.getItem('workstreamId');

        if (accessToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const roleConfig = getRoleConfig(parsedUser.role);
                setUser(parsedUser);
                setPermissions(roleConfig?.permissions || []);
                setPortalType(savedPortalType);
                setWorkstreamId(savedWorkstreamId);
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.clear();
            }
        }
    }, []);

    /**
     * @param {Object} authData - The response from the login API
     * @param {string} type - 'PORTAL' or 'WORKSTREAM'
     * @param {string|number} wsId - Optional workstream ID
     */
    const login = useCallback((authData, type = 'PORTAL', wsId = null) => {
        console.log('AuthContext.login called with:', { authData, type, wsId });

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

        console.log('Role mapping:', { backendRole, roleKey, roleConfig });

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

        // 4. Redirect to the role's base path
        const basePath = getBasePath(roleKey);
        console.log('Navigating to:', basePath);
        navigate(basePath);
    }, [navigate]);

    const logout = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        // Attempt to notify backend (best effort)
        if (refreshToken) {
            try {
                await authService.logout(refreshToken);
            } catch (e) {
                console.warn('Backend logout failed, continuing with local cleanup');
            }
        }

        // 1. Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('portalType');
        localStorage.removeItem('workstreamId');

        // 2. Reset state
        setUser(null);
        setPermissions([]);
        setPortalType(null);
        setWorkstreamId(null);

        // 3. Redirect to login
        navigate('/login');
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