import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Search,
    TrendingUp,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import reportService from '../../services/reportService';
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

const getStudentName = (student) => {
    const fallback = [student?.first_name, student?.last_name].filter(Boolean).join(' ');
    return student?.full_name || fallback || student?.email || 'Student';
};

const getStudentFilterId = (student) => {
    const candidate = student?.user_id ?? student?.id;
    const parsed = Number.parseInt(String(candidate || ''), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSearchText = (value = '') => (
    String(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
);

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const { user } = useAuth();

    const initialDate = new Date().toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState(initialDate);
    const [dateTo, setDateTo] = useState(initialDate);
    const [statusFilter, setStatusFilter] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentQuery, setStudentQuery] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [studentLoading, setStudentLoading] = useState(false);
    const [error, setError] = useState('');
    const [debouncedFilters, setDebouncedFilters] = useState({
        dateFrom: initialDate,
        dateTo: initialDate,
        studentId: null,
    });
    const attendanceRequestRef = useRef(0);
    const studentSearchRequestRef = useRef(0);
    const dropdownRef = useRef(null);
    const schoolId = useMemo(() => {
        const candidate = user?.school_id ?? user?.school?.id ?? user?.school;
        const parsed = Number.parseInt(String(candidate || ''), 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }, [user?.school, user?.school_id]);

    const normalizeListResponse = useCallback((payload) => {
        if (Array.isArray(payload?.results)) {
            return payload.results;
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters((previous) => {
                const selectedStudentId = selectedStudent?.id || null;
                if (
                    previous.dateFrom === dateFrom
                    && previous.dateTo === dateTo
                    && previous.studentId === selectedStudentId
                ) {
                    return previous;
                }

                return {
                    dateFrom,
                    dateTo,
                    studentId: selectedStudentId,
                };
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [dateFrom, dateTo, selectedStudent]);

    useEffect(() => {
        const trimmedQuery = studentQuery.trim();
        const selectedName = (selectedStudent?.name || '').trim();

        if (!trimmedQuery) {
            studentSearchRequestRef.current += 1;
            setStudentResults([]);
            setShowDropdown(false);
            setStudentLoading(false);
            return;
        }

        if (selectedStudent && normalizeSearchText(trimmedQuery) === normalizeSearchText(selectedName)) {
            studentSearchRequestRef.current += 1;
            setStudentResults([]);
            setShowDropdown(false);
            setStudentLoading(false);
            return;
        }

        const requestId = studentSearchRequestRef.current + 1;
        studentSearchRequestRef.current = requestId;

        const timeoutId = setTimeout(async () => {
            try {
                setStudentLoading(true);
                const data = await secretaryService.getStudents({
                    ...(schoolId ? { school_id: schoolId } : {}),
                    search: trimmedQuery,
                    page_size: 10,
                });

                if (studentSearchRequestRef.current !== requestId) {
                    return;
                }

                const matchedStudents = normalizeListResponse(data)
                    .filter((student) => Boolean(getStudentFilterId(student)))
                    .slice(0, 10);
                setStudentResults(matchedStudents);
                setShowDropdown(true);
            } catch (searchError) {
                if (studentSearchRequestRef.current !== requestId) {
                    return;
                }
                console.error('Error searching attendance students:', searchError);
                setStudentResults([]);
            } finally {
                if (studentSearchRequestRef.current === requestId) {
                    setStudentLoading(false);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [normalizeListResponse, schoolId, selectedStudent, studentQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStudentQueryChange = useCallback((event) => {
        const query = event.target.value;
        setStudentQuery(query);
        setSearchTerm(query);
        setShowDropdown(true);

        if (!selectedStudent) {
            return;
        }

        const selectedName = normalizeSearchText(selectedStudent.name || '');
        if (normalizeSearchText(query) !== selectedName) {
            setSelectedStudent(null);
        }
    }, [selectedStudent]);

    const handleStudentSelect = useCallback((student) => {
        const studentId = getStudentFilterId(student);
        if (!studentId) {
            return;
        }

        const studentName = getStudentName(student);
        setSelectedStudent({
            id: studentId,
            name: studentName,
            code: student?.student_id || '',
        });
        setStudentQuery(studentName);
        setSearchTerm(studentName);
        setShowDropdown(false);
    }, []);

    const clearSelectedStudent = useCallback(() => {
        setSelectedStudent(null);
        setStudentQuery('');
        setSearchTerm('');
        setStudentResults([]);
        setShowDropdown(false);
    }, []);

    const fetchAttendance = useCallback(async (filters) => {
        const requestId = attendanceRequestRef.current + 1;
        attendanceRequestRef.current = requestId;

        try {
            setLoading(true);
            setError('');

            if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
                setRecords([]);
                setError('From Date cannot be after To Date.');
                return;
            }

            const params = {};
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.studentId) params.student_id = filters.studentId;

            const data = await secretaryService.getAllAttendance({
                ...params,
                page_size: 100,
            });
            if (attendanceRequestRef.current !== requestId) {
                return;
            }
            setRecords(Array.isArray(data) ? data : []);
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

    const studentFilteredRecords = useMemo(() => {
        const search = normalizeSearchText(searchTerm);

        if (!search) {
            return records;
        }

        return records.filter((record) => {
            const studentName = normalizeSearchText(record.student_name || '');
            const studentCode = normalizeSearchText(record.student_id || '');
            return studentName.includes(search) || studentCode.includes(search);
        });
    }, [records, searchTerm]);

    const filteredRecords = useMemo(() => {
        if (!statusFilter) {
            return studentFilteredRecords;
        }

        return studentFilteredRecords.filter((record) => record.status === statusFilter);
    }, [studentFilteredRecords, statusFilter]);

    const statCards = useMemo(() => {
        const totalPresent = studentFilteredRecords.filter((record) => record.status === 'present').length;
        const totalAbsent = studentFilteredRecords.filter((record) => record.status === 'absent').length;
        const totalLate = studentFilteredRecords.filter((record) => record.status === 'late').length;
        const attendanceRate = studentFilteredRecords.length > 0
            ? Math.round((totalPresent / studentFilteredRecords.length) * 100)
            : 0;

        return [
            { title: 'Present', value: totalPresent, icon: CheckCircle, color: 'green' },
            { title: 'Absent', value: totalAbsent, icon: XCircle, color: 'rose' },
            { title: 'Late', value: totalLate, icon: Clock, color: 'amber' },
            { title: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'indigo' },
        ];
    }, [studentFilteredRecords]);

    const emptyStateMessage = useMemo(() => {
        if (searchTerm.trim() || statusFilter || selectedStudent) {
            return 'No attendance records found for the selected filters.';
        }

        return 'No attendance records found for this date range.';
    }, [searchTerm, statusFilter, selectedStudent]);

    const handleExportPdf = useCallback(async () => {
        if (filteredRecords.length === 0) {
            setError('No attendance records available to export for the selected filters.');
            return;
        }

        try {
            setIsExportingPdf(true);
            setError('');

            const exportRows = filteredRecords.map((record) => ({
                student_name: record.student_name || '',
                classroom_name: record.classroom_name || '',
                date: record.date || '',
                status: getStatusLabel(record.status),
                note: record.note || '',
                recorded_by: record.recorded_by_name || '',
            }));

            await reportService.exportReport('pdf', 'secretary_attendance', exportRows);
        } catch (err) {
            console.error('Error exporting attendance PDF:', err);
            setError('Failed to export attendance PDF.');
        } finally {
            setIsExportingPdf(false);
        }
    }, [filteredRecords, getStatusLabel]);

    return (
        <div className="secretary-dashboard">
            <PageHeader
                title={t('secretary.attendance.title') || 'Attendance Management'}
                subtitle={t('secretary.attendance.subtitle') || 'View and manage student attendance records'}
                action={(
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleExportPdf}
                        disabled={isExportingPdf || filteredRecords.length === 0}
                    >
                        <Download size={16} />
                        <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                    </button>
                )}
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

                    <div className="sec-field sec-field--grow sec-attendance-search-field" ref={dropdownRef}>
                        <label htmlFor="attendance-search" className="form-label">Search Student</label>
                        <div className="search-wrapper sec-search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                id="attendance-search"
                                type="text"
                                className="search-input"
                                placeholder="Type first letter(s) of student name..."
                                value={studentQuery}
                                onChange={handleStudentQueryChange}
                                onFocus={() => {
                                    const trimmedQuery = studentQuery.trim();
                                    const selectedName = normalizeSearchText(selectedStudent?.name || '');
                                    if (trimmedQuery.length >= 1 && normalizeSearchText(trimmedQuery) !== selectedName) {
                                        setShowDropdown(true);
                                    }
                                }}
                            />
                        </div>

                        {showDropdown ? (
                            <div className="student-search-dropdown">
                                {studentLoading ? (
                                    <div className="student-search-option text-muted">Loading students...</div>
                                ) : studentResults.length > 0 ? (
                                    studentResults.map((studentOption) => {
                                        const optionId = getStudentFilterId(studentOption);
                                        const optionName = getStudentName(studentOption);
                                        return (
                                            <button
                                                key={optionId || `${optionName}-${studentOption?.student_id || ''}`}
                                                type="button"
                                                className="student-search-option"
                                                onClick={() => handleStudentSelect(studentOption)}
                                            >
                                                <AvatarInitial name={optionName} size="sm" />
                                                <span>{optionName}</span>
                                                <span className="text-muted">
                                                    {studentOption?.student_id || `#${optionId || '-'}`}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="student-search-option text-muted">No students found</div>
                                )}
                            </div>
                        ) : null}

                        {selectedStudent ? (
                            <div className="selected-student-badge">
                                <AvatarInitial name={selectedStudent.name} size="sm" />
                                <span>{selectedStudent.name}</span>
                                {selectedStudent.code ? (
                                    <span className="text-muted">({selectedStudent.code})</span>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={clearSelectedStudent}
                                    aria-label="Clear selected student"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : null}
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
                                        <th>Classroom</th>
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
                                                <td>{record.classroom_name || '-'}</td>
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
                                                    message={emptyStateMessage}
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
