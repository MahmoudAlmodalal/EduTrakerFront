import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleConfig, getBasePath } from '../config/roleConfig';

// Map Django backend roles to frontend role keys
const ROLE_MAP = {
    'admin': 'SUPER_ADMIN',
    'manager_workstream': 'WORKSTREAM_MANAGER',
    'manager_school': 'SCHOOL_MANAGER',
    'secretary': 'SECRETARY',
    'teacher': 'TEACHER',
    'student': 'STUDENT',
    'guardian': 'GUARDIAN',
    'guest': 'GUEST',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const navigate = useNavigate();

    // Restore session on load
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        if (accessToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const roleConfig = getRoleConfig(parsedUser.role);
                setUser(parsedUser);
                setPermissions(roleConfig?.permissions || []);
            } catch (e) {
                console.error('Failed to parse user data', e);
                localStorage.clear();
            }
        }
    }, []);

    const login = useCallback((authData) => {
        // 1. Store tokens for subsequent API requests
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);

        // Map backend role to frontend role key
        const backendRole = authData.role?.toLowerCase();
        const roleKey = ROLE_MAP[backendRole] || backendRole?.toUpperCase();
        const roleConfig = getRoleConfig(roleKey);

        // 2. Set the authenticated user state
        const userData = {
            ...authData,
            role: roleKey, // Normalize role in state
            displayName: roleConfig?.displayName || authData.full_name || authData.role
        };
        setUser(userData);

        // Persist user data for reload
        // Removing sensitive tokens from the user object if they are duplicated there
        const userToSave = { ...userData, accessToken: undefined, refreshToken: undefined };
        localStorage.setItem('user', JSON.stringify(userToSave));

        // 3. Set permissions from the configuration
        setPermissions(roleConfig?.permissions || []);

        // 4. Redirect to the role's base path
        const basePath = getBasePath(roleKey);
        navigate(basePath);
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setPermissions([]);
        navigate('/login');
    }, [navigate]);

    const isAuthenticated = !!user;

    const value = {
        user,
        permissions,
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