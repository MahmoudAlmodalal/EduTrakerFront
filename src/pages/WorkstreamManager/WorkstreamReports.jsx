import React from 'react';
import { Calendar, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Workstream.css';

const WorkstreamReports = () => {
    const { t } = useTheme();

    // Load Schools Data
    const schools = JSON.parse(localStorage.getItem('ws_schools') || '[]');

    // Calculate Dynamic Stats
    const totalAttendance = schools.reduce((acc, s) => acc + (parseInt(s.attendanceRate) || 0), 0);
    const avgAttendance = schools.length ? (totalAttendance / schools.length).toFixed(1) : 0;

    const totalStudents = schools.reduce((acc, s) => acc + (parseInt(s.students) || 0), 0);
    const totalTeachers = schools.reduce((acc, s) => acc + (parseInt(s.teachers) || 0), 0);
    const teacherRatio = totalTeachers ? `1:${Math.round(totalStudents / totalTeachers)}` : '0:0';

    const totalCapacity = schools.reduce((acc, s) => acc + (parseInt(s.capacity) || 0), 0);
    // Classroom usage can be proxy for Capacity Utilization based on registered students vs capacity
    const classroomUsage = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

    // Prep Table Data
    const attendanceData = schools.map(s => ({
        school: s.name,
        attendance: s.attendanceRate || 0,
        absent: 100 - (s.attendanceRate || 0)
    }));

    const resourceData = schools.map(s => ({
        school: s.name,
        teachers: s.teachers || 0,
        classrooms: s.classrooms || 0,
        capacity: s.capacity || 0,
        students: s.students || 0,
        utilization: s.capacity ? Math.round((s.students / s.capacity) * 100) : 0 
    }));

    const handleDownload = (reportType) => {
        let headers, content, filename;

        if (reportType === 'ATTENDANCE') {
            headers = ['School', 'Attendance Rate (%)', 'Absent Rate (%)'];
            content = attendanceData.map(d => [d.school, d.attendance, d.absent].join(','));
            filename = 'attendance_report.csv';
        } else if (reportType === 'RESOURCES') {
            headers = ['School', 'Teachers', 'Classrooms', 'Students', 'Capacity', 'Utilization (%)'];
            content = resourceData.map(d => [d.school, d.teachers, d.classrooms, d.students, d.capacity, d.utilization].join(','));
            filename = 'resource_utilization_report.csv';
        }

        if (headers && content) {
            const csvContent = [headers.join(','), ...content].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        }
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">{t('workstream.reports.title')}</h1>
                <p className="workstream-subtitle">{t('workstream.reports.subtitle')}</p>
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
                    <div className="stat-value">{avgAttendance}%</div>
                    <div className="stat-trend trend-up">
                        <span>Stable across cluster</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">{t('workstream.reports.teacherRatio')}</span>
                        <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{teacherRatio}</div>
                    <div className="stat-trend">
                        <span style={{ color: 'var(--color-text-muted)' }}>Target is 1:20</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">{t('workstream.reports.classroomUsage')}</span>
                        <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{classroomUsage}%</div>
                    <div className="stat-trend trend-down">
                        <span>Capacity Utilization</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Attendance Report Table */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.monthlyAttendance')}</h3>
                        <button 
                            onClick={() => handleDownload('ATTENDANCE')}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}
                            title="Download CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
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
                            {attendanceData.length > 0 ? (
                                attendanceData.map((data, index) => (
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
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>No data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Resource Utilization */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.resourceUtilization')}</h3>
                        <button 
                            onClick={() => handleDownload('RESOURCES')}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}
                            title="Download CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('workstream.reports.table.school')}</th>
                                <th>{t('workstream.reports.table.teachClass')}</th>
                                <th>{t('workstream.reports.table.utilization')}</th>
                            </tr>
                        </thead>
                        <tbody>
                             {resourceData.length > 0 ? (
                                resourceData.map((data, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: '500' }}>{data.school}</td>
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
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>No data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkstreamReports;
