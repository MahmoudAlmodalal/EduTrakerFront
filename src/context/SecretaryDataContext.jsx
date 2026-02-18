/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { useAuth } from './AuthContext';
import secretaryService from '../services/secretaryService';

const SecretaryDataContext = createContext(null);

export const SecretaryDataProvider = ({ children }) => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadDashboardData = useCallback(async () => {
        if (!user?.id) {
            setDashboardData(null);
            setError(null);
            setLoading(false);
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await secretaryService.getSecretaryDashboardStats()
                .catch(() => secretaryService.getDashboardStats());
            const stats = response?.statistics || response || null;
            setDashboardData(stats);
            return stats;
        } catch (err) {
            setError(err?.message || 'Failed to load secretary dashboard data.');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            setDashboardData(null);
            setError(null);
            setLoading(false);
            return;
        }

        void loadDashboardData();
    }, [loadDashboardData, user?.id]);

    const value = useMemo(() => ({
        dashboardData,
        loading,
        error,
        refreshData: loadDashboardData
    }), [dashboardData, loading, error, loadDashboardData]);

    return (
        <SecretaryDataContext.Provider value={value}>
            {children}
        </SecretaryDataContext.Provider>
    );
};

export const useSecretaryData = () => {
    const context = useContext(SecretaryDataContext);
    if (!context) {
        throw new Error('useSecretaryData must be used within SecretaryDataProvider');
    }
    return context;
};

export default SecretaryDataContext;
