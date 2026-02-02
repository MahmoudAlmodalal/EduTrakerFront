import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user } = useAuth();

    console.log('ProtectedRoute check:', { user, allowedRoles });

    if (!user) {
        console.log('No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User authorized but not for this specific route
        console.log('User not authorized for this route:', { userRole: user.role, allowedRoles });
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('User authorized, rendering protected content');
    return <Outlet />;
};

export default ProtectedRoute;
