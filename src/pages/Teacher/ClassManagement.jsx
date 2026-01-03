import React, { useState } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ClassManagement = () => {
    const { t } = useTheme();
    const [selectedClass, setSelectedClass] = useState('Grade 10-A');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // Mock Data
    const classes = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];

    // Mock Student Data with Attendance State (Present, Absent, Late)
    const [students, setStudents] = useState([
        { id: 1, name: 'Ahmed Ali', status: 'Present', behavior: 'Neutral' },
        { id: 2, name: 'Sara Khan', status: 'Present', behavior: 'Neutral' },
        { id: 3, name: 'Mohamed Zaki', status: 'Absent', behavior: 'Negative' },
        { id: 4, name: 'Layla Mahmoud', status: 'Late', behavior: 'Positive' },
        { id: 5, name: 'Omar Youssef', status: 'Present', behavior: 'Neutral' },
        { id: 6, name: 'Hana Salem', status: 'Absent', behavior: 'Neutral' },
        { id: 7, name: 'Yarah Ahmed', status: 'Present', behavior: 'Positive' },
    ]);

    const handleAttendanceStatus = (id, status) => {
        setStudents(students.map(student => {
            if (student.id === id) {
                return { ...student, status };
            }
            return student;
        }));
    };

    const handleBehaviorLog = (id, type) => {
        setStudents(students.map(student => {
            if (student.id === id) {
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
                            {students.filter(s => s.status === 'Present').length}
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
                            {students.filter(s => s.status === 'Absent').length}
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
                            {students.filter(s => s.status === 'Late').length}
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
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="font-bold text-slate-800">{student.name}</td>
                                    <td>
                                        <span className={`status-badge ${student.status === 'Present' ? 'success' :
                                            student.status === 'Absent' ? 'error' : 'warning'
                                            }`}>
                                            {getStatusText(student.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => handleAttendanceStatus(student.id, 'Present')}
                                                className={`icon-btn ${student.status === 'Present' ? 'success' : ''}`}
                                                style={student.status === 'Present' ? { backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#15803D' } : {}}
                                                title={t('teacher.classes.present')}
                                            >
                                                P
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceStatus(student.id, 'Absent')}
                                                className={`icon-btn ${student.status === 'Absent' ? 'danger' : ''}`}
                                                style={student.status === 'Absent' ? { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#DC2626' } : {}}
                                                title={t('teacher.classes.absent')}
                                            >
                                                A
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceStatus(student.id, 'Late')}
                                                className={`icon-btn ${student.status === 'Late' ? 'warning' : ''}`}
                                                style={student.status === 'Late' ? { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#D97706' } : {}}
                                                title={t('teacher.classes.late')}
                                            >
                                                L
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => handleBehaviorLog(student.id, 'Positive')}
                                                className={`icon-btn ${student.behavior === 'Positive' ? 'success' : ''}`}
                                                title="Log Positive Behavior"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleBehaviorLog(student.id, 'Negative')}
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
                    <button className="btn-primary" onClick={() => alert('Attendance changes saved successfully!')}>
                        {t('teacher.classes.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;
