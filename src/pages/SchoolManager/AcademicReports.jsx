import React, { useState, useEffect } from 'react';
import {
    FileText,
    TrendingUp,
    Users,
    Download,
    Filter,
    Search,
    ChevronRight,
    Calendar,
    BookOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import managerService from '../../services/managerService';
import reportService from '../../services/reportService';
import './SchoolManager.css';

const getActiveCountFromListResponse = (payload) => {
    const teachers = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload)
            ? payload
            : null;

    if (teachers) {
        return teachers.filter((teacher) => teacher?.is_active !== false).length;
    }

    const countValue = Number(payload?.count);
    return Number.isFinite(countValue) ? countValue : null;
};

const AcademicReports = () => {
    const { t, theme } = useTheme();
    const { user } = useAuth();
    const schoolId = user?.school_id || user?.school?.id || user?.school;
    const [stats, setStats] = useState(null);
    const [subjectPerformance, setSubjectPerformance] = useState([]);
    const [activeTeachersCount, setActiveTeachersCount] = useState(null);
    const [subjectPerformanceError, setSubjectPerformanceError] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const isDarkTheme = theme === 'dark';
    const iconSvgProps = {
        strokeWidth: isDarkTheme ? 3 : 2.6,
        absoluteStrokeWidth: true,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none'
    };
    const iconTone = (lightBg, lightColor, darkBg, darkColor) => ({
        backgroundColor: isDarkTheme ? darkBg : lightBg,
        color: isDarkTheme ? darkColor : lightColor,
        border: isDarkTheme ? `1px solid ${darkColor}33` : '1px solid transparent'
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setSubjectPerformanceError('');
            try {
                const teacherParams = { include_inactive: true };
                if (schoolId) {
                    teacherParams.school_id = schoolId;
                }

                const [dashboardResult, schoolPerformanceResult, activeTeachersResult] = await Promise.allSettled([
                    managerService.getDashboardStats(),
                    reportService.getSchoolPerformance(),
                    managerService.getTeachers(teacherParams)
                ]);

                if (dashboardResult.status !== 'fulfilled') {
                    throw dashboardResult.reason;
                }
                if (schoolPerformanceResult.status !== 'fulfilled') {
                    throw schoolPerformanceResult.reason;
                }

                setStats(dashboardResult.value);
                setSubjectPerformance(
                    Array.isArray(schoolPerformanceResult.value?.subject_performance)
                        ? schoolPerformanceResult.value.subject_performance
                        : []
                );

                if (activeTeachersResult.status === 'fulfilled') {
                    setActiveTeachersCount(getActiveCountFromListResponse(activeTeachersResult.value));
                } else {
                    setActiveTeachersCount(null);
                    console.warn('Failed to fetch active teachers count:', activeTeachersResult.reason);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                setSubjectPerformance([]);
                setSubjectPerformanceError(error?.message || 'Failed to load subject performance data.');
                setActiveTeachersCount(null);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [schoolId]);

    const reportTypes = [
        {
            id: 'attendance',
            backendId: 'attendance',
            name: t('school.reports.attendanceTrends') || 'Attendance Trends',
            description: t('school.reports.attendanceDesc') || 'Monthly student and teacher attendance overview.',
            icon: Calendar,
            iconStyle: iconTone('var(--color-info-light)', 'var(--color-info)', 'rgba(96, 165, 250, 0.22)', '#BFDBFE')
        },
        {
            id: 'performance',
            backendId: 'student_performance',
            name: t('school.reports.academicPerformance') || 'Academic Performance',
            description: t('school.reports.performanceDesc') || 'Grade distribution and subject performance metrics.',
            icon: TrendingUp,
            iconStyle: iconTone('var(--color-success-light)', 'var(--color-success)', 'rgba(52, 211, 153, 0.2)', '#86EFAC')
        },
        {
            id: 'enrollment',
            backendId: 'student_list',
            name: t('school.reports.enrollmentReport') || 'Enrollment Report',
            description: t('school.reports.enrollmentDesc') || 'New admissions and student retention statistics.',
            icon: Users,
            iconStyle: iconTone('var(--color-primary-light)', 'var(--color-primary)', 'rgba(129, 140, 248, 0.22)', '#C7D2FE')
        },
        {
            id: 'teacher',
            backendId: 'teacher_evaluations',
            name: t('school.reports.teacherEvaluations') || 'Teacher Evaluations',
            description: t('school.reports.teacherEvaluationsDesc') || 'Summary of annual teacher performance reviews.',
            icon: FileText,
            iconStyle: iconTone('var(--color-warning-light)', 'var(--color-warning)', 'rgba(251, 191, 36, 0.22)', '#FDE68A')
        }
    ];

    const handleDownload = async (report) => {
        if (downloading) return;
        setDownloading(report.id);
        try {
            await reportService.exportReport('pdf', report.backendId);
        } catch (error) {
            console.error('Failed to download report:', error);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <div className="academic-reports-page">Loading...</div>;

    return (
        <div className="academic-reports-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.reports.title') || 'Academic Insights & Reports'}</h1>
                <p className="school-manager-subtitle">{t('school.reports.subtitle') || 'Generate and analyze school performance data and metrics.'}</p>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-primary-light)', 'var(--color-primary)', 'rgba(129, 140, 248, 0.22)', '#C7D2FE')}>
                            <TrendingUp size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">
                        {stats?.statistics?.course_count || '0'}
                    </div>
                    <div className="stat-label">{t('school.reports.totalCourses') || 'Total Courses'}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-success-light)', 'var(--color-success)', 'rgba(52, 211, 153, 0.2)', '#86EFAC')}>
                            <Users size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{stats?.statistics?.total_students || '0'}</div>
                    <div className="stat-label">{t('school.dashboard.totalStudents') || 'Total Students'}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-warning-light)', 'var(--color-warning)', 'rgba(251, 191, 36, 0.22)', '#FDE68A')}>
                            <FileText size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{activeTeachersCount ?? '0'}</div>
                    <div className="stat-label">{t('activeTeachers') || 'Active Teachers'}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-error-light)', 'var(--color-error)', 'rgba(248, 113, 113, 0.22)', '#FCA5A5')}>
                            <BookOpen size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{stats?.statistics?.classroom_count || '0'}</div>
                    <div className="stat-label">{t('classrooms') || 'Classrooms'}</div>
                </div>
            </div>

            {/* Quick Reports Section */}
            <div className="reports-section">
                <div className="section-header">
                    <h2 className="section-title">{t('school.reports.availableReports') || 'Available Reports'}</h2>
                    <div className="header-actions">
                        <button className="btn-secondary">
                            <Filter size={18} />
                            {t('school.reports.manageReports') || 'Manage Reports'}
                        </button>
                    </div>
                </div>

                <div className="reports-grid">
                    {reportTypes.map((report) => (
                        <div
                            key={report.id}
                            className="report-type-card"
                            onClick={() => handleDownload(report)}
                            style={{
                                backgroundColor: 'var(--color-bg-surface)',
                                padding: '1.5rem',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                transition: 'all 0.2s ease',
                                cursor: downloading === report.id ? 'wait' : 'pointer',
                                opacity: downloading && downloading !== report.id ? 0.7 : 1,
                                transform: downloading === report.id ? 'scale(0.98)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    ...report.iconStyle
                                }}>
                                    <report.icon size={24} {...iconSvgProps} />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(report);
                                    }}
                                    disabled={downloading === report.id}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: downloading === report.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={18} {...iconSvgProps} className={downloading === report.id ? 'animate-bounce' : ''} />
                                </button>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{report.name}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>{report.description}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {downloading === report.id ? t('school.reports.preparingDownload') || 'Preparing download...' : t('school.reports.clickToDownload') || 'Click to download'}
                                </span>
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--color-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    {t('school.reports.viewReport') || 'View Report'}
                                    <ChevronRight size={16} {...iconSvgProps} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Insights */}
            <div className="management-card" style={{ marginTop: '2rem' }}>
                <div className="table-header-actions">
                    <h3 className="chart-title">{t('school.reports.subjectDistribution') || 'Subject Performance Distribution'}</h3>
                    <div className="sm-search-control">
                        <Search size={16} {...iconSvgProps} className="sm-search-control-icon" />
                        <input
                            type="text"
                            placeholder={t('school.reports.filterSubjects') || 'Filter subjects...'}
                            className="sm-search-control-input"
                            value={subjectFilter}
                            onChange={(event) => setSubjectFilter(event.target.value)}
                            style={{ fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {(() => {
                        const normalizedFilter = subjectFilter.trim().toLowerCase();
                        const subjects = subjectPerformance
                            .map((item) => {
                                const subjectName = typeof item?.subject === 'string'
                                    ? item.subject.trim()
                                    : '';
                                const rawScore = Number(item?.score ?? item?.avg_score ?? 0);

                                return {
                                    subject: subjectName || 'N/A',
                                    score: Number.isFinite(rawScore) ? rawScore : 0
                                };
                            })
                            .filter((item) => item.subject.toLowerCase().includes(normalizedFilter));
                        const maxScore = Math.max(...subjects.map((item) => item.score), 1);

                        if (subjectPerformanceError && subjectPerformance.length === 0) {
                            return (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                                    <TrendingUp size={40} style={{ opacity: 0.3 }} {...iconSvgProps} />
                                    <p style={{ margin: 0 }}>{t('school.reports.failedToLoadPerformance') || 'Failed to load subject performance'}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem' }}>{subjectPerformanceError}</p>
                                </div>
                            );
                        }

                        if (subjects.length === 0) {
                            return (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                                    <TrendingUp size={40} style={{ opacity: 0.3 }} {...iconSvgProps} />
                                    <p style={{ margin: 0 }}>
                                        {normalizedFilter ? (t('school.reports.noSubjectsMatch') || 'No subjects match this filter') : (t('school.reports.noPerformanceData') || 'No subject performance data yet')}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem' }}>
                                        {normalizedFilter ? (t('school.reports.tryDifferentSubject') || 'Try a different subject name') : (t('school.reports.dataAfterGrades') || 'Data appears once students receive grades')}
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
                                {subjects.map((item, index) => {
                                    const score = Number(item?.score) || 0;
                                    const barHeight = maxScore > 0 ? (score / maxScore) * 100 : 0;
                                    return (
                                        <div key={`${item?.subject || 'subject'}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '80px' }}>
                                            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                                {score.toFixed(1)}%
                                            </span>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: `${Math.max(barHeight, 2)}%`,
                                                    backgroundColor: 'var(--color-primary)',
                                                    borderRadius: '4px 4px 0 0',
                                                    opacity: 0.8,
                                                    transition: 'height 0.3s ease',
                                                    minHeight: '4px'
                                                }}
                                                title={`${item?.subject || 'Subject'}: ${score.toFixed(1)}%`}
                                            />
                                            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                {item?.subject || 'N/A'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default AcademicReports;
