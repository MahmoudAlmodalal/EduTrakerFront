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
import studentService from '../services/studentService';

const StudentDataContext = createContext(null);

export const StudentDataProvider = ({ children }) => {
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
            const response = await studentService.getDashboardStats();
            const stats = response?.statistics || response || null;
            setDashboardData(stats);
            return stats;
        } catch (err) {
            setError(err?.message || 'Failed to load student dashboard data.');
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
        <StudentDataContext.Provider value={value}>
            {children}
        </StudentDataContext.Provider>
    );
};

export const useStudentData = () => {
    const context = useContext(StudentDataContext);
    if (!context) {
        throw new Error('useStudentData must be used within StudentDataProvider');
    }
    return context;
};

export default StudentDataContext;
