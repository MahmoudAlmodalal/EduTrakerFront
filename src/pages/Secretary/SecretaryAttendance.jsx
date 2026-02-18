import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar,
    CheckCircle,
    Clock,
    Search,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import { getAttendanceStatusIcon } from '../../utils/secretaryHelpers';
import {
    AlertBanner,
    AvatarInitial,
    EmptyState,
    PageHeader,
    SkeletonTable,
    StatCard,
    StatusBadge,
} from './components';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();

    const initialDate = new Date().toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(initialDate);
    const [dateTo, setDateTo] = useState(initialDate);
    const [statusFilter, setStatusFilter] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [debouncedFilters, setDebouncedFilters] = useState({
        dateFrom: initialDate,
        dateTo: initialDate,
        statusFilter: '',
    });
    const attendanceRequestRef = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters((previous) => {
                if (
                    previous.dateFrom === dateFrom
                    && previous.dateTo === dateTo
                    && previous.statusFilter === statusFilter
                ) {
                    return previous;
                }

                return { dateFrom, dateTo, statusFilter };
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [dateFrom, dateTo, statusFilter]);

    const fetchAttendance = useCallback(async (filters) => {
        const requestId = attendanceRequestRef.current + 1;
        attendanceRequestRef.current = requestId;

        try {
            setLoading(true);
            setError('');

            const params = {};
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.statusFilter) params.status = filters.statusFilter;

            const data = await secretaryService.getAttendance(params);
            if (attendanceRequestRef.current !== requestId) {
                return;
            }
            setRecords(data.results || data || []);
            setError('');
        } catch (err) {
            if (attendanceRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching attendance:', err);
            setError('Failed to load attendance records.');
        } finally {
            if (attendanceRequestRef.current === requestId) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchAttendance(debouncedFilters);
    }, [debouncedFilters, fetchAttendance]);

    const getStatusLabel = useCallback(
        (status) => {
            const map = {
                present: t('secretary.attendance.present') || 'Present',
                absent: t('secretary.attendance.absent') || 'Absent',
                late: t('secretary.attendance.late') || 'Late',
                excused: t('secretary.attendance.excused') || 'Excused',
            };

            return map[status] || status;
        },
        [t]
    );

    const filteredRecords = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return records;
        }

        return records.filter((record) => (record.student_name || '').toLowerCase().includes(search));
    }, [records, searchTerm]);

    const statCards = useMemo(() => {
        const totalPresent = records.filter((record) => record.status === 'present').length;
        const totalAbsent = records.filter((record) => record.status === 'absent').length;
        const totalLate = records.filter((record) => record.status === 'late').length;
        const attendanceRate = records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0;

        return [
            { title: 'Present', value: totalPresent, icon: CheckCircle, color: 'green' },
            { title: 'Absent', value: totalAbsent, icon: XCircle, color: 'rose' },
            { title: 'Late', value: totalLate, icon: Clock, color: 'amber' },
            { title: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'indigo' },
        ];
    }, [records]);

    return (
        <div className="secretary-dashboard">
            <PageHeader
                title={t('secretary.attendance.title') || 'Attendance Management'}
                subtitle={t('secretary.attendance.subtitle') || 'View and manage student attendance records'}
            />

            <AlertBanner type="error" message={error} onDismiss={() => setError('')} />

            <section className="sec-stats-grid">
                {statCards.map((card) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </section>

            <section className="management-card">
                <div className="sec-filter-bar">
                    <div className="sec-field">
                        <label htmlFor="attendance-date-from" className="form-label">From Date</label>
                        <input
                            id="attendance-date-from"
                            type="date"
                            className="form-input"
                            value={dateFrom}
                            onChange={(event) => setDateFrom(event.target.value)}
                        />
                    </div>

                    <div className="sec-field">
                        <label htmlFor="attendance-date-to" className="form-label">To Date</label>
                        <input
                            id="attendance-date-to"
                            type="date"
                            className="form-input"
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                        />
                    </div>

                    <div className="sec-field">
                        <label htmlFor="attendance-status" className="form-label">Status</label>
                        <select
                            id="attendance-status"
                            className="form-select"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                        </select>
                    </div>

                    <div className="sec-field sec-field--grow">
                        <label htmlFor="attendance-search" className="form-label">Search Student</label>
                        <div className="search-wrapper sec-search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                id="attendance-search"
                                type="text"
                                className="search-input"
                                placeholder="Search by student name..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="sec-table-wrap">
                    {loading && records.length === 0 ? (
                        <SkeletonTable rows={6} cols={7} />
                    ) : (
                        <div className="sec-table-scroll">
                            <table className="data-table sec-data-table">
                                <thead>
                                    <tr>
                                        <th className="cell-id">ID</th>
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
                                                <td className="cell-id">#{record.id}</td>
                                                <td>
                                                    <div className="sec-row-user">
                                                        <AvatarInitial name={record.student_name || 'Student'} size="sm" color="indigo" />
                                                        <span>{record.student_name || '-'}</span>
                                                    </div>
                                                </td>
                                                <td>{record.course_name || '-'}</td>
                                                <td className="cell-muted">{record.date || '-'}</td>
                                                <td>
                                                    <StatusBadge status={getStatusLabel(record.status)} icon={StatusIcon} />
                                                </td>
                                                <td className="cell-muted cell-ellipsis">{record.note || '-'}</td>
                                                <td className="cell-muted">{record.recorded_by_name || '-'}</td>
                                            </tr>
                                        );
                                    })}

                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="7">
                                                <EmptyState
                                                    icon={Users}
                                                    message="No attendance records found for this date range."
                                                />
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section className="sec-mobile-note">
                <Calendar size={14} />
                <span>Tip: Scroll the table horizontally on mobile to see all columns.</span>
            </section>
        </div>
    );
};

export default SecretaryAttendance;
