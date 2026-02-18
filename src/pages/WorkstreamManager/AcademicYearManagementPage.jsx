import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import managerService from '../../services/managerService';
import { AcademicYearManagement } from '../SchoolManager/AcademicConfiguration';
import '../SchoolManager/SchoolManager.css';
import './Workstream.css';

const parseWorkstreamId = (user) => {
    const rawId = user?.work_stream_id ?? user?.work_stream?.id ?? user?.work_stream;
    const parsed = Number.parseInt(rawId, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const AcademicYearManagementPage = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError } = useToast();
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    const workStreamId = useMemo(() => parseWorkstreamId(user), [user]);

    const fetchAcademicYears = useCallback(async () => {
        if (!workStreamId) {
            setAcademicYears([]);
            setLoading(false);
            return;
        }

        try {
            const data = await managerService.getAcademicYears({
                work_stream_id: workStreamId,
                include_inactive: true
            });
            setAcademicYears(data?.results || data || []);
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
            showError(error?.message || 'Failed to load academic years.');
            setAcademicYears([]);
        } finally {
            setLoading(false);
        }
    }, [workStreamId, showError]);

    useEffect(() => {
        setLoading(true);
        fetchAcademicYears();
    }, [fetchAcademicYears]);

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">{t('school.academicYear.title') || 'Academic Year'}</h1>
                <p className="workstream-subtitle">Manage academic years for your workstream.</p>
            </div>

            {!workStreamId ? (
                <div className="sm-empty-state">Workstream information is missing. Please log in again.</div>
            ) : loading ? (
                <div className="sm-loading-state">Loading academic years...</div>
            ) : (
                <AcademicYearManagement
                    academicYears={academicYears}
                    workStreamId={workStreamId}
                    onUpdated={fetchAcademicYears}
                />
            )}
        </div>
    );
};

export default AcademicYearManagementPage;
