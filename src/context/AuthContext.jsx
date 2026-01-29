import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleConfig, getBasePath } from '../config/roleConfig';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [permissions, setPermissions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const roleConfig = getRoleConfig(user.role);
            setPermissions(roleConfig?.permissions || []);
        }
    }, [user]);

    const login = useCallback(async (email, password, role) => {
        try {
            const response = await api.post('/portal/auth/login/', {
                email,
                password
            });

            const { access, user: userData } = response.data;
            
            // Save token and user data
            localStorage.setItem('token', access);
            localStorage.setItem('user', JSON.stringify(userData));

            const roleConfig = getRoleConfig(userData.role);

            // Set user with role config
            setUser({
                ...userData,
                displayName: roleConfig?.displayName || userData.role
            });

            // Set permissions from role config
            setPermissions(roleConfig?.permissions || []);

            // Redirect based on role
            const basePath = getBasePath(userData.role);
            navigate(basePath);
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.detail || 'Login failed. Please check your credentials.' 
            };
        }
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setPermissions([]);
        navigate('/login');
    }, [navigate]);

    /**
     * Check if current user has a specific permission
     * @param {string} permission - The permission to check
     * @returns {boolean} True if user has permission
     */
    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        if (permissions.includes('*')) return true;
        return permissions.includes(permission);
    }, [user, permissions]);

    /**
     * Check if current user has any of the specified permissions
     * @param {string[]} perms - Array of permissions to check
     * @returns {boolean} True if user has at least one permission
     */
    const hasAnyPermission = useCallback((perms) => {
        if (!user) return false;
        if (permissions.includes('*')) return true;
        return perms.some(p => permissions.includes(p));
    }, [user, permissions]);

    /**
     * Check if current user has all of the specified permissions
     * @param {string[]} perms - Array of permissions to check
     * @returns {boolean} True if user has all permissions
     */
    const hasAllPermissions = useCallback((perms) => {
        if (!user) return false;
        if (permissions.includes('*')) return true;
        return perms.every(p => permissions.includes(p));
    }, [user, permissions]);

    /**
     * Check if current user is a specific role
     * @param {string|string[]} roles - Role(s) to check
     * @returns {boolean} True if user matches role
     */
    const isRole = useCallback((roles) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    }, [user]);

    const value = {
        user,
        permissions,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isRole,
        isAuthenticated: !!user
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
