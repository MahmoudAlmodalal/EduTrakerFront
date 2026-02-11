import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const resolveLoginPath = () => {
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
    };

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
    }, [location.pathname, navigate, user]);

    if (!user) {
        return <Navigate to={resolveLoginPath()} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
