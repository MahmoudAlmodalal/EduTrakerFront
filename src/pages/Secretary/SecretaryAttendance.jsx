import React, { useState, useEffect } from 'react';
import { Calendar, Search, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import { getSecretaryIconStyle, getAttendanceStatusStyle, getAttendanceStatusIcon } from '../../utils/secretaryHelpers';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [debouncedFilters, setDebouncedFilters] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        statusFilter: '',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters({ dateFrom, dateTo, statusFilter });
        }, 400);

        return () => clearTimeout(timer);
    }, [dateFrom, dateTo, statusFilter]);

    useEffect(() => {
        fetchAttendance(debouncedFilters);
    }, [debouncedFilters]);

    const fetchAttendance = async (filters) => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.statusFilter) params.status = filters.statusFilter;
            const data = await secretaryService.getAttendance(params);
            setRecords(data.results || data || []);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError('Failed to load attendance records.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        const map = {
            present: t('secretary.attendance.present') || 'Present',
            absent: t('secretary.attendance.absent') || 'Absent',
            late: t('secretary.attendance.late') || 'Late',
            excused: t('secretary.attendance.excused') || 'Excused',
        };
        return map[status] || status;
    };

    const filteredRecords = records.filter(r =>
        (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Summary stats
    const totalPresent = records.filter(r => r.status === 'present').length;
    const totalAbsent = records.filter(r => r.status === 'absent').length;
    const totalLate = records.filter(r => r.status === 'late').length;
    const attendanceRate = records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0;

    const statCards = [
        { label: 'Present', value: totalPresent, icon: CheckCircle, color: 'green' },
        { label: 'Absent', value: totalAbsent, icon: XCircle, color: 'rose' },
        { label: 'Late', value: totalLate, icon: Clock, color: 'amber' },
        { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'indigo' },
    ];

    return (
        <div className="secretary-dashboard">
            {/* Header */}
            <div className="secretary-header">
                <div>
                    <h1>{t('secretary.attendance.title') || 'Attendance Management'}</h1>
                    <p>{t('secretary.attendance.subtitle') || 'View and manage student attendance records'}</p>
                </div>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</p>
                                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>{stat.value}</p>
                            </div>
                            <div style={{
                                ...getSecretaryIconStyle(stat.color),
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Table */}
            <div className="management-card">
                {/* Filters Row */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: '1px solid var(--sec-border)',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            From Date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{ minWidth: '150px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            To Date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={{ minWidth: '150px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            Status
                        </label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ minWidth: '140px' }}
                        >
                            <option value="">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--sec-text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                            Search Student
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sec-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by student name..."
                                className="form-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sec-text-muted)' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '3px solid var(--sec-primary)',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 12px'
                            }}></div>
                            Loading attendance records...
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>ID</th>
                                    <th>{t('secretary.attendance.studentName') || 'Student'}</th>
                                    <th>Course</th>
                                    <th>Date</th>
                                    <th>{t('secretary.attendance.status') || 'Status'}</th>
                                    <th>Note</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => {
                                    const StatusIcon = getAttendanceStatusIcon(record.status);

                                    return (
                                        <tr key={record.id}>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>#{record.id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                                        color: '#4f46e5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: '600',
                                                        fontSize: '13px'
                                                    }}>
                                                        {(record.student_name || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: '500', color: 'var(--sec-text-main)' }}>
                                                        {record.student_name || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--sec-text-main)' }}>{record.course_name || '-'}</td>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>{record.date || '-'}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    ...getAttendanceStatusStyle(record.status)
                                                }}>
                                                    {StatusIcon ? <StatusIcon size={14} /> : null}
                                                    {getStatusLabel(record.status)}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px', maxWidth: '180px' }}>
                                                {record.note || '-'}
                                            </td>
                                            <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>
                                                {record.recorded_by_name || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--sec-text-muted)' }}>
                                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                            <p style={{ margin: 0 }}>No attendance records found for this date range.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecretaryAttendance;
