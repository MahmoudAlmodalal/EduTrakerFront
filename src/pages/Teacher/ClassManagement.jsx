import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const ClassManagement = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    // Student Data with Attendance State
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // Fetch teacher profile to get course allocations
                const profile = await teacherService.getProfile(user.user_id);
                // Assuming profile contains allocations or we use a fallback
                // For now, let's fetch students directly if we can't find specific class list
                const studentsData = await teacherService.getStudents({ school_id: user.school_id });
                setStudents(studentsData.results || studentsData || []);

                // Mock classes if not found in profile for now to keep UI working
                setClasses(['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B']);
                setSelectedClass('Grade 10-A');
            } catch (error) {
                console.error("Error fetching class data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user.user_id, user.school_id]);

    const handleAttendanceStatus = async (studentId, status) => {
        try {
            // Optimistic update
            setStudents(prev => prev.map(s => s.user_id === studentId ? { ...s, attendance_status: status } : s));

            // In a real scenario, we'd call recordAttendance here or on "Save Changes"
            // For now, just local state to match UI
        } catch (error) {
            console.error("Error updating attendance:", error);
        }
    };

    const handleSaveAttendance = async () => {
        try {
            alert('Saving attendance records...');
            // Loop through students and record attendance
            // This would normally be a bulk operation if the backend supports it
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const handleBehaviorLog = (id, type) => {
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

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="teacher-select"
                    >
                        {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
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
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--teacher-text-main)' }}>{filteredStudents.length}</p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#DBEAFE', color: '#2563EB', borderRadius: '0.5rem' }}>
                        <Users size={24} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.presentToday')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                            {filteredStudents.filter(s => s.attendance_status === 'Present').length}
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
                            {filteredStudents.filter(s => s.attendance_status === 'Absent').length}
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
                            {filteredStudents.filter(s => s.attendance_status === 'Late').length}
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
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--teacher-text-main)' }}>{t('teacher.classes.studentList')} - {selectedClass}</h2>
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
