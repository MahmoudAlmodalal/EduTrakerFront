import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import reportService from '../../services/reportService';
import './Workstream.css';

const WorkstreamReports = () => {
    const { t } = useTheme();
    const { showError, showWarning, showSuccess } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await reportService.getComprehensiveStats();
                setStats(data.statistics);
                setError(null);
            } catch (err) {
                console.error('Error fetching workstream stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getSchoolNumberLabel = (school, fallbackIndex) => {
        const schoolName = String(school?.school_name || '');
        const nameMatch = schoolName.match(/[\d\u0660-\u0669]+/);
        if (nameMatch) {
            return nameMatch[0];
        }

        const schoolId = Number.parseInt(school?.school_id, 10);
        if (Number.isInteger(schoolId) && schoolId > 0) {
            return String(schoolId);
        }

        return String(fallbackIndex);
    };

    // Map backend schools in workstream to chart/table format
    const schoolStats = stats?.summary?.by_school?.map((school, index) => ({
        school: school.school_name,
        schoolNumber: getSchoolNumberLabel(school, index + 1),
        attendance: school.attendance_percentage || 0,
        absent: school.absent_percentage || 0,
        teachers: school.teacher_count,
        classrooms: school.classroom_count,
        utilization: Math.round((school.student_count / (school.classroom_count * 30 || 1)) * 100)
    })) || [];

    // Calculate average attendance from real data
    const avgAttendance = schoolStats.length > 0
        ? (schoolStats.reduce((sum, s) => sum + (s.attendance || 0), 0) / schoolStats.length).toFixed(1)
        : 0;

    const handleExport = async (format, section, reportLabel) => {
        if (loading) {
            showWarning(t('workstream.reports.exportWait', { report: reportLabel }));
            return;
        }

        if (!schoolStats.length) {
            showWarning(t('workstream.reports.exportNoData', { report: reportLabel }));
            return;
        }

        try {
            const attendanceRows = schoolStats.map((row) => ({
                school: row.school,
                present_percentage: row.attendance,
                absent_percentage: row.absent,
                status: row.attendance >= 90 ? 'Optimal' : 'Needs Attention',
            }));

            const utilizationRows = schoolStats.map((row) => ({
                school: row.school,
                teachers: row.teachers,
                classrooms: row.classrooms,
                utilization_percentage: row.utilization,
                capacity_state: row.utilization > 100 ? 'Over Capacity' : 'Within Capacity',
            }));

            const exportData = section === 'utilization' ? utilizationRows : attendanceRows;
            const reportType = section === 'utilization'
                ? 'workstream_resource_utilization'
                : 'workstream_attendance';

            await reportService.exportReport(format, reportType, exportData);
            showSuccess(t('workstream.reports.exportSuccess', { report: reportLabel }));
        } catch (err) {
            const rawMessage = String(err?.message || '').toLowerCase();
            if (rawMessage.includes('no data to export') || rawMessage.includes('invalid report type')) {
                showError(t('workstream.reports.exportFailedNoData', { report: reportLabel }));
                return;
            }
            showError(t('workstream.reports.exportFailed', { report: reportLabel, error: err.message }));
        }
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">{t('workstream.reports.title')}</h1>
                <p className="workstream-subtitle">
                    {loading ? t('workstream.reports.fetchingData') : t('workstream.reports.subtitle')}
                </p>
            </div>

            {/* Report Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">{t('workstream.reports.avgAttendance')}</span>
                        <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{loading ? '...' : `${avgAttendance}%`}</div>
                    <div className="stat-trend">
                        <span style={{ color: 'var(--color-text-muted)' }}>
                            {avgAttendance > 0 ? t('workstream.reports.acrossAllSchools') : t('workstream.reports.noDataYet')}
                        </span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">{t('workstream.dashboard.totalSchools')}</span>
                        <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{loading ? '...' : (stats?.summary?.school_count || 0)}</div>
                    <div className="stat-trend">
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('workstream.reports.inYourWorkstream')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">{t('workstream.dashboard.totalStudents')}</span>
                        <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{loading ? '...' : (stats?.summary?.total_students || 0)}</div>
                    <div className="stat-trend">
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('workstream.reports.activeEnrollments')}</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Attendance Report Table */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.monthlyAttendance')}</h3>
                        <button
                            onClick={() => handleExport('pdf', 'attendance', t('workstream.reports.monthlyAttendance'))}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Download size={16} />
                            <span style={{ fontSize: '0.75rem' }}>PDF</span>
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('workstream.reports.table.school')}</th>
                                    <th>{t('workstream.reports.table.present')}</th>
                                    <th>{t('workstream.reports.table.absent')}</th>
                                    <th>{t('workstream.schools.table.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>{t('workstream.reports.loadingData')}</td></tr>
                                ) : schoolStats.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>{t('workstream.reports.noSchoolsFound')}</td></tr>
                                ) : (
                                    schoolStats.map((data, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: '500' }}>{data.school}</td>
                                            <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{data.attendance}%</td>
                                            <td style={{ color: 'var(--color-error)' }}>{data.absent}%</td>
                                            <td>
                                                {data.attendance >= 90 ? (
                                                    <span className="status-badge status-active">{t('workstream.reports.status.optimal')}</span>
                                                ) : (
                                                    <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>{t('workstream.reports.status.attention')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Resource Utilization */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.resourceUtilization')}</h3>
                        <button
                            onClick={() => handleExport('pdf', 'utilization', t('workstream.reports.resourceUtilization'))}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Download size={16} />
                            <span style={{ fontSize: '0.75rem' }}>PDF</span>
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('workstream.reports.table.school')}</th>
                                    <th>{t('workstream.reports.table.teachClass')}</th>
                                    <th>{t('workstream.reports.table.utilization')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>{t('workstream.reports.loadingData')}</td></tr>
                                ) : schoolStats.length === 0 ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>{t('workstream.reports.noSchoolsFound')}</td></tr>
                                ) : (
                                    schoolStats.map((data, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: '500' }}>{data.schoolNumber}</td>
                                            <td>{data.teachers} / {data.classrooms}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                                                        <div style={{
                                                            width: `${Math.min(data.utilization, 100)}%`,
                                                            backgroundColor: data.utilization > 100 ? 'var(--color-error)' : 'var(--color-primary)',
                                                            height: '100%',
                                                            borderRadius: '3px'
                                                        }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', width: '30px' }}>{data.utilization}%</span>
                                                </div>
                                                {data.utilization > 100 && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        <AlertCircle size={12} /> {t('workstream.reports.status.overCapacity')}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkstreamReports;
