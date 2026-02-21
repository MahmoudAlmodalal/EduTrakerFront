import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import guardianService from '../../../services/guardianService';
import { toList } from '../../../utils/helpers';
import '../Guardian.css';
import StudentSelectorBar from './components/StudentSelectorBar';
import StudentOverviewCard from './components/StudentOverviewCard';
import MonitoringTabs from './components/MonitoringTabs';

const VALID_TABS = new Set(['academic', 'assessments', 'attendance', 'behavior']);

const toValidTab = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    return VALID_TABS.has(normalized) ? normalized : 'academic';
};

const parseStudentIdQuery = (searchParams) => {
    const rawId = searchParams.get('studentId') || searchParams.get('student_id');
    const parsedId = Number.parseInt(rawId || '', 10);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
};

const StudentMonitoringPage = () => {
    const { user } = useAuth();
    const { t } = useTheme();
    const [searchParams] = useSearchParams();

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [activeTab, setActiveTab] = useState(() => toValidTab(searchParams.get('tab')));

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
        const requestedTab = toValidTab(searchParams.get('tab'));
        setActiveTab((currentTab) => (currentTab === requestedTab ? currentTab : requestedTab));
    }, [searchParams]);

    useEffect(() => {
        if (students.length === 0) {
            return;
        }

        const requestedStudentId = parseStudentIdQuery(searchParams);
        const hasRequestedStudent = requestedStudentId
            ? students.some((student) => student.student_id === requestedStudentId)
            : false;

        setSelectedStudentId((currentStudentId) => {
            if (hasRequestedStudent && currentStudentId !== requestedStudentId) {
                return requestedStudentId;
            }

            if (!currentStudentId) {
                return students[0].student_id;
            }

            return currentStudentId;
        });
    }, [searchParams, students]);

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
