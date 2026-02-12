import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import managerService from '../../services/managerService';
import { AcademicYearManagement } from './AcademicConfiguration';
import './SchoolManager.css';

const AcademicYearManagementPage = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError } = useToast();
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    const schoolId = user?.school_id || user?.school?.id || user?.school;

    const fetchAcademicYears = useCallback(async () => {
        if (!schoolId) {
            setAcademicYears([]);
            setLoading(false);
            return;
        }

        try {
            const data = await managerService.getAcademicYears({ school_id: schoolId, include_inactive: true });
            setAcademicYears(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
            showError(error?.message || 'Failed to load academic years.');
            setAcademicYears([]);
        } finally {
            setLoading(false);
        }
    }, [schoolId, showError]);

    useEffect(() => {
        setLoading(true);
        fetchAcademicYears();
    }, [fetchAcademicYears]);

    return (
        <div className="academic-config-page">
            <div className="school-manager-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="school-manager-title">{t('school.academicYear.title') || 'Academic Year'}</h1>
            </div>

            {!schoolId ? (
                <div className="sm-empty-state">School information is missing. Please log in again.</div>
            ) : loading ? (
                <div className="sm-loading-state">Loading academic years...</div>
            ) : (
                <AcademicYearManagement
                    academicYears={academicYears}
                    schoolId={schoolId}
                    onUpdated={fetchAcademicYears}
                />
            )}
        </div>
    );
};

export default AcademicYearManagementPage;
