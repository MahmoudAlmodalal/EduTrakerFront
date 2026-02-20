import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import guardianService from '../../../services/guardianService';
import { toList } from '../../../utils/helpers';
import '../Guardian.css';
import StudentSelectorBar from './components/StudentSelectorBar';
import StudentOverviewCard from './components/StudentOverviewCard';
import MonitoringTabs from './components/MonitoringTabs';

const StudentMonitoringPage = () => {
    const { user } = useAuth();
    const { t } = useTheme();

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [activeTab, setActiveTab] = useState('academic');

    const {
        data: linkedStudents = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['guardian', 'children', user?.id],
        queryFn: ({ signal }) => guardianService.getLinkedStudents(user.id, { signal }),
        enabled: Boolean(user?.id),
    });

    const students = useMemo(() => toList(linkedStudents), [linkedStudents]);

    useEffect(() => {
        if (students.length > 0 && !selectedStudentId) {
            setSelectedStudentId(students[0].student_id);
        }
    }, [students, selectedStudentId]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) {
            return null;
        }
        return students.find((student) => student.student_id === selectedStudentId) || null;
    }, [selectedStudentId, students]);

    const handleStudentChange = (studentId) => {
        setSelectedStudentId(studentId);
        setActiveTab('academic');
    };

    if (isLoading) {
        return (
            <div className="guardian-monitoring">
                <h1 className="guardian-page-title">{t('guardian.monitoring.title') || 'Children Monitoring'}</h1>
                <div className="guardian-card monitoring-loader-wrap">
                    <Loader2 className="animate-spin text-primary" size={30} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="guardian-monitoring">
                <h1 className="guardian-page-title">{t('guardian.monitoring.title') || 'Children Monitoring'}</h1>
                <div className="guardian-card monitoring-error-wrap">
                    <div className="monitoring-error-message">
                        <AlertCircle size={20} />
                        <span>{error.message || 'Failed to load linked students.'}</span>
                    </div>
                    <button type="button" className="btn-primary" onClick={() => refetch()}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="guardian-monitoring">
            <h1 className="guardian-page-title">{t('guardian.monitoring.title') || 'Children Monitoring'}</h1>

            <StudentSelectorBar
                students={students}
                selectedId={selectedStudentId}
                onSelect={handleStudentChange}
            />

            {selectedStudentId && (
                <>
                    <StudentOverviewCard studentId={selectedStudentId} student={selectedStudent} />
                    <MonitoringTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        studentId={selectedStudentId}
                    />
                </>
            )}
        </div>
    );
};

export default StudentMonitoringPage;
