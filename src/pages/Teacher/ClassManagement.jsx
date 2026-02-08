import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const ClassManagement = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState([]);
    const [selectedAllocationId, setSelectedAllocationId] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('all');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    // Student Data with Attendance State
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchAllocations = async () => {
            try {
                setLoading(true);
                // Fetch teacher's course allocations (classes)
                const allocationsData = await teacherService.getSchedule(attendanceDate);
                setAllocations(allocationsData || []);

                if (allocationsData && allocationsData.length > 0) {
                    setSelectedAllocationId(allocationsData[0].id.toString());
                }
            } catch (error) {
                console.error("Error fetching class data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllocations();
    }, [user.school_id]);

    useEffect(() => {
        const fetchStudentsForClass = async () => {
            if (!selectedAllocationId) return;

            try {
                const selectedAlloc = allocations.find(a => a.id.toString() === selectedAllocationId);
                if (!selectedAlloc) return;

                // Fetch students enrolled in this classroom
                const studentsData = await teacherService.getStudents({
                    classroom_id: selectedAlloc.class_room_id,
                    school_id: user.school_id
                });

                const studentList = studentsData.results || studentsData || [];

                // Fetch current attendance for this class and date to pre-fill
                const currentAttendance = await teacherService.getAttendance({
                    course_allocation_id: selectedAllocationId,
                    date: attendanceDate
                });

                const attendanceMap = {};
                (currentAttendance.results || currentAttendance || []).forEach(record => {
                    attendanceMap[record.student_id] = {
                        status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
                        id: record.id
                    };
                });

                setStudents(studentList.map(s => ({
                    ...s,
                    attendance_status: attendanceMap[s.user_id]?.status || null,
                    attendance_record_id: attendanceMap[s.user_id]?.id || null
                })));
            } catch (error) {
                console.error("Error fetching students:", error);
            }
        };

        if (allocations.length > 0) {
            fetchStudentsForClass();
        }
    }, [selectedAllocationId, attendanceDate]);

    const handleAttendanceStatus = (studentId, status) => {
        setStudents(prev => prev.map(s => s.user_id === studentId ? { ...s, attendance_status: status } : s));
    };

    const handleSaveAttendance = async () => {
        if (!selectedAllocationId) return;

        try {
            const attendanceRecords = students
                .filter(s => s.attendance_status)
                .map(s => ({
                    student_id: s.user_id,
                    status: s.attendance_status.toLowerCase(),
                    date: attendanceDate,
                    course_allocation_id: parseInt(selectedAllocationId)
                }));

            if (attendanceRecords.length === 0) {
                alert('No attendance marked yet.');
                return;
            }

            // Record each attendance
            await Promise.all(attendanceRecords.map(record => teacherService.recordAttendance(record)));
            alert('Attendance records saved successfully!');

            // Re-fetch to update state with any new IDs (though not strictly necessary for this UI)
            // fetchStudentsForClass(); 
        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Failed to save attendance: " + (error.message || "Unknown error"));
        }
    };

    const handleBehaviorLog = (id, type) => {
        // Local state for behavior since backend model is missing
        setStudents(prev => prev.map(student => {
            if (student.user_id === id) {
                return { ...student, behavior: type };
            }
            return student;
        }));
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Present': return t('teacher.classes.present');
            case 'Absent': return t('teacher.classes.absent');
            case 'Late': return t('teacher.classes.late');
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-teacher-primary" size={48} />
            </div>
        );
    }

    const classrooms = ['all', ...new Set(allocations.map(a => a.classroom_name))];

    const filteredAllocations = selectedClassroom === 'all'
        ? allocations
        : allocations.filter(a => a.classroom_name === selectedClassroom);

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedAllocation = allocations.find(a => a.id.toString() === selectedAllocationId);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('teacher.classes.title')}</h1>
                    <p className="page-subtitle">{t('teacher.classes.subtitle')}</p>
                </div>
                <div className="filter-bar">
                    <select
                        value={selectedClassroom}
                        onChange={(e) => {
                            setSelectedClassroom(e.target.value);
                            // Reset selected allocation if current one is not in new list
                            const newFiltered = e.target.value === 'all'
                                ? allocations
                                : allocations.filter(a => a.classroom_name === e.target.value);
                            if (newFiltered.length > 0 && !newFiltered.some(a => a.id.toString() === selectedAllocationId)) {
                                setSelectedAllocationId(newFiltered[0].id.toString());
                            }
                        }}
                        className="teacher-select"
                    >
                        {classrooms.map(cls => (
                            <option key={cls} value={cls}>
                                {cls === 'all' ? t('teacher.classes.allClasses') || 'All Classrooms' : cls}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedAllocationId}
                        onChange={(e) => setSelectedAllocationId(e.target.value)}
                        className="teacher-select"
                    >
                        {filteredAllocations.map(alloc => (
                            <option key={alloc.id} value={alloc.id}>
                                {alloc.course_name} - {alloc.classroom_name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="teacher-input"
                    />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stat-card" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.totalStudents')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--teacher-text-main)' }}>{students.length}</p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#DBEAFE', color: '#2563EB', borderRadius: '0.5rem' }}>
                        <Users size={24} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.presentToday')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                            {students.filter(s => s.attendance_status === 'Present').length}
                        </p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#DCFCE7', color: '#16A34A', borderRadius: '0.5rem' }}>
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.absentToday')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>
                            {students.filter(s => s.attendance_status === 'Absent').length}
                        </p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem' }}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.lateToday')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#D97706' }}>
                            {students.filter(s => s.attendance_status === 'Late').length}
                        </p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '0.5rem' }}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Student List Table */}
            <div className="glass-panel">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--teacher-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--teacher-text-main)' }}>
                        {t('teacher.classes.studentList')} - {selectedAllocation?.course_name} ({selectedAllocation?.classroom_name})
                    </h2>
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder={t('teacher.classes.searchStudent')}
                            className="teacher-input has-icon"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>{t('teacher.classes.studentName')}</th>
                                <th>{t('teacher.classes.status')}</th>
                                <th>{t('teacher.classes.attendanceAction')}</th>
                                <th>{t('teacher.classes.behaviorLog')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.user_id}>
                                    <td className="font-bold text-slate-800">{student.full_name}</td>
                                    <td>
                                        <span className={`status-badge ${student.attendance_status === 'Present' ? 'success' :
                                            student.attendance_status === 'Absent' ? 'error' :
                                                student.attendance_status === 'Late' ? 'warning' : 'info'
                                            }`}>
                                            {getStatusText(student.attendance_status || t('teacher.classes.notRecorded'))}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => handleAttendanceStatus(student.user_id, 'Present')}
                                                className={`icon-btn ${student.attendance_status === 'Present' ? 'success' : ''}`}
                                                style={student.attendance_status === 'Present' ? { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#15803D' } : {}}
                                                title={t('teacher.classes.present')}
                                            >
                                                P
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceStatus(student.user_id, 'Absent')}
                                                className={`icon-btn ${student.attendance_status === 'Absent' ? 'danger' : ''}`}
                                                style={student.attendance_status === 'Absent' ? { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#DC2626' } : {}}
                                                title={t('teacher.classes.absent')}
                                            >
                                                A
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceStatus(student.user_id, 'Late')}
                                                className={`icon-btn ${student.attendance_status === 'Late' ? 'warning' : ''}`}
                                                style={student.attendance_status === 'Late' ? { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#D97706' } : {}}
                                                title={t('teacher.classes.late')}
                                            >
                                                L
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => handleBehaviorLog(student.user_id, 'Positive')}
                                                className={`icon-btn ${student.behavior === 'Positive' ? 'success' : ''}`}
                                                title="Log Positive Behavior"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleBehaviorLog(student.user_id, 'Negative')}
                                                className={`icon-btn ${student.behavior === 'Negative' ? 'danger' : ''}`}
                                                title="Log Negative Behavior"
                                            >
                                                <AlertTriangle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--teacher-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={handleSaveAttendance}>
                        {t('teacher.classes.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;
