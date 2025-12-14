import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const login = (userData) => {
        // TODO: Real API integration
        // meaningful mock for now
        setUser(userData);

        // Redirect based on role
        switch (userData.role) {
            case 'SUPER_ADMIN':
                navigate('/super-admin');
                break;
            case 'WORKSTREAM_MANAGER':
                navigate('/workstream');
                break;
            case 'SCHOOL_MANAGER':
                navigate('/school-manager');
                break;
            case 'SECRETARY':
                navigate('/secretary');
                break;
            case 'TEACHER':
                navigate('/teacher');
                break;
            case 'STUDENT':
                navigate('/student');
                break;
            case 'GUARDIAN':
                navigate('/guardian');
                break;
            default:
                navigate('/');
        }
    };

    const logout = () => {
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
