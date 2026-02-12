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
import managerService from '../../services/managerService';
import reportService from '../../services/reportService';
import './SchoolManager.css';

const AcademicReports = () => {
    const { t, theme } = useTheme();
    const [stats, setStats] = useState(null);
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
            try {
                const data = await managerService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const reportTypes = [
        {
            id: 'attendance',
            backendId: 'attendance',
            name: 'Attendance Trends',
            description: 'Monthly student and teacher attendance overview.',
            icon: Calendar,
            iconStyle: iconTone('var(--color-info-light)', 'var(--color-info)', 'rgba(96, 165, 250, 0.22)', '#BFDBFE')
        },
        {
            id: 'performance',
            backendId: 'student_performance',
            name: 'Academic Performance',
            description: 'Grade distribution and subject performance metrics.',
            icon: TrendingUp,
            iconStyle: iconTone('var(--color-success-light)', 'var(--color-success)', 'rgba(52, 211, 153, 0.2)', '#86EFAC')
        },
        {
            id: 'enrollment',
            backendId: 'student_list',
            name: 'Enrollment Report',
            description: 'New admissions and student retention statistics.',
            icon: Users,
            iconStyle: iconTone('var(--color-primary-light)', 'var(--color-primary)', 'rgba(129, 140, 248, 0.22)', '#C7D2FE')
        },
        {
            id: 'teacher',
            backendId: 'teacher_evaluations',
            name: 'Teacher Evaluations',
            description: 'Summary of annual teacher performance reviews.',
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
                    <div className="stat-label">Total Courses</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-success-light)', 'var(--color-success)', 'rgba(52, 211, 153, 0.2)', '#86EFAC')}>
                            <Users size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{stats?.statistics?.total_students || '0'}</div>
                    <div className="stat-label">Total Students</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-warning-light)', 'var(--color-warning)', 'rgba(251, 191, 36, 0.22)', '#FDE68A')}>
                            <FileText size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{stats?.statistics?.total_teachers || '0'}</div>
                    <div className="stat-label">Total Teachers</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper" style={iconTone('var(--color-error-light)', 'var(--color-error)', 'rgba(248, 113, 113, 0.22)', '#FCA5A5')}>
                            <BookOpen size={20} {...iconSvgProps} />
                        </div>
                        {/* Trend will be calculated from real backend data in future */}
                    </div>
                    <div className="stat-value">{stats?.statistics?.classroom_count || '0'}</div>
                    <div className="stat-label">Classrooms</div>
                </div>
            </div>

            {/* Quick Reports Section */}
            <div className="reports-section">
                <div className="section-header">
                    <h2 className="section-title">Available Reports</h2>
                    <div className="header-actions">
                        <button className="btn-secondary">
                            <Filter size={18} />
                            Manage Reports
                        </button>
                    </div>
                </div>

                <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
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
                                    {downloading === report.id ? 'Preparing download...' : 'Click to download'}
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
                                    View Report
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
                    <h3 className="chart-title">Subject Performance Distribution</h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} {...iconSvgProps} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Filter subjects..."
                            style={{ padding: '0.4rem 0.4rem 0.4rem 2rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {/* Placeholder for a real chart component */}
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem' }}>
                        {stats?.statistics?.by_grade?.length > 0 ? stats.statistics.by_grade.map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: `${Math.floor(80 / (stats.statistics.by_grade?.length || 1))}%` }}>
                                <div style={{
                                    width: '100%',
                                    height: `${Math.min(item.student_count || item.count || 0, 100)}%`,
                                    backgroundColor: 'var(--color-primary)',
                                    opacity: 0.8,
                                    borderRadius: '4px 4px 0 0',
                                    position: 'relative'
                                }}>
                                    <div className="chart-tooltip" style={{
                                        position: 'absolute',
                                        top: '-30px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#000',
                                        color: '#fff',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        whiteSpace: 'nowrap'
                                    }}>{item.student_count || item.count || 0}</div>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{item.grade__name || item.grade_name || 'N/A'}</span>
                            </div>
                        )) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>No performance data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicReports;
