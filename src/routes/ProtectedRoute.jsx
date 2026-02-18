import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => {
    if (role === null || role === undefined) {
        return '';
    }

    return String(role).trim().toUpperCase();
};

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const normalizedAllowedRoles = React.useMemo(
        () => allowedRoles.map(normalizeRole),
        [allowedRoles]
    );
    const normalizedUserRole = normalizeRole(user?.role);

    const resolveLoginPath = React.useCallback(() => {
        const portalType =
            localStorage.getItem('portalType') || localStorage.getItem('lastPortalType');
        const workstreamSlug =
            localStorage.getItem('workstreamId') || localStorage.getItem('lastWorkstreamId');

        const isWorkstreamPath = location.pathname.startsWith('/workstream');
        const shouldUseWorkstreamLogin =
            (portalType === 'WORKSTREAM' || isWorkstreamPath) && !!workstreamSlug;

        return shouldUseWorkstreamLogin
            ? `/login/workstream/${workstreamSlug}`
            : '/login/portal';
    }, [location.pathname]);

    React.useEffect(() => {
        if (!user) return;

        const isDashboardPath =
            location.pathname === '/super-admin' || location.pathname.endsWith('/dashboard');
        if (!isDashboardPath) return;

        // Add a guard history entry so browser Back is captured on dashboard routes.
        if (!window.history.state?.dashboardBackGuard) {
            window.history.pushState(
                { ...(window.history.state || {}), dashboardBackGuard: true },
                '',
                window.location.href
            );
        }

        const handleBackNavigation = () => {
            navigate(resolveLoginPath(), { replace: true });
        };

        window.addEventListener('popstate', handleBackNavigation);
        return () => {
            window.removeEventListener('popstate', handleBackNavigation);
        };
    }, [location.pathname, navigate, resolveLoginPath, user]);

    if (!user) {
        return <Navigate to={resolveLoginPath()} replace />;
    }

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedUserRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
