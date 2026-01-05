import React from 'react';
import { Calendar, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Workstream.css';

const WorkstreamReports = () => {
    const { t } = useTheme();

    const attendanceData = [
        { school: 'Springfield Elementary', attendance: 92, absent: 8 },
        { school: 'Shelbyville High', attendance: 88, absent: 12 },
        { school: 'Ogdenville Tech', attendance: 95, absent: 5 },
    ];

    const resourceData = [
        { school: 'Springfield Elementary', teachers: 45, classrooms: 50, utilization: 90 },
        { school: 'Shelbyville High', teachers: 110, classrooms: 100, utilization: 110 },
        { school: 'Ogdenville Tech', teachers: 15, classrooms: 20, utilization: 75 },
    ];

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
                    <div className="stat-value">91.6%</div>
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
                    <div className="stat-value">1:24</div>
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
                    <div className="stat-value">92%</div>
                    <div className="stat-trend trend-down">
                        <span>High utilization warning</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Attendance Report Table */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.monthlyAttendance')}</h3>
                        <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}>
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
                            {attendanceData.map((data, index) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Resource Utilization */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">{t('workstream.reports.resourceUtilization')}</h3>
                        <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}>
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
                            {resourceData.map((data, index) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkstreamReports;
