import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { GradeManagement } from './AcademicConfiguration';
import './SchoolManager.css';

const GradesManagement = () => {
    const { t } = useTheme();

    return (
        <div className="academic-config-page">
            <div className="school-manager-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="school-manager-title">{t('school.grades.title') || 'Grades'}</h1>
            </div>
            <GradeManagement />
        </div>
    );
};

export default GradesManagement;
