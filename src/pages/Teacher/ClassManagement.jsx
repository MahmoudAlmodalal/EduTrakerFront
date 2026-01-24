import React, { useState } from 'react';
import { Users, UserCheck, AlertTriangle, Check, Search, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ClassManagement = () => {
    const { t } = useTheme();
    // 1. Core State
    const [selectedClass, setSelectedClass] = useState(''); // Init empty, will set in useEffect
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [classes, setClasses] = useState([]);
    
    // 2. Data State
    const [allStudents, setAllStudents] = useState([]);
    const [displayedStudents, setDisplayedStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    // Safe JSON Parse Helper
    const safeJSONParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            if (!item || item === 'undefined' || item === 'null') return fallback;
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };
    
    // 3. Load Initial Data
    React.useEffect(() => {
        try {
            // Load Classes
            const storedClasses = safeJSONParse('school_classes', []);
            const classList = Array.isArray(storedClasses) && storedClasses.length > 0 ? storedClasses.map(c => c.name) : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
            setClasses(classList);
            if (classList.length > 0) setSelectedClass(classList[0]);

            // Load Students (all)
            const storedStudents = safeJSONParse('sec_students', []);
            setAllStudents(Array.isArray(storedStudents) ? storedStudents : []);
        } catch (err) {
            console.error("ClassMgmt Init Error:", err);
            setError("Failed to load initial data.");
        }
    }, []);

    // 4. Effect: Filter Students & Load Daily Status when Class/Date changes
    React.useEffect(() => {
        if (!selectedClass) return;

        try {
            // A. Filter by Class
            let classStudents = allStudents.filter(s => s.class === selectedClass || (!s.class && selectedClass === 'Grade 10-A')); // Fallback for demo
            
            // If no real students found, strictly use empty to avoid confusion, or minimal demo if preferred.
            if (classStudents.length === 0 && allStudents.length === 0) {
                 classStudents = [
                    { id: 101, name: 'Demo Student 1', class: selectedClass },
                    { id: 102, name: 'Demo Student 2', class: selectedClass }
                ];
            }

            // B. Load Attendance for this Date
            const allAttendance = safeJSONParse('sec_attendance', []);
            const dailyAttendance = Array.isArray(allAttendance) ? allAttendance.filter(r => r.date === attendanceDate) : [];

            // C. Load Behavior Logs
            const allBehavior = safeJSONParse('teacher_behavior_logs', []);
            const dailyBehavior = Array.isArray(allBehavior) ? allBehavior.filter(r => r.date === attendanceDate) : [];

            // D. Merge Data
            const mergedStudents = classStudents.map(student => {
                const attRecord = dailyAttendance.find(r => r.studentId === student.id || r.studentName === student.name);
                const behRecord = dailyBehavior.find(r => r.studentId === student.id || r.studentName === student.name);
                
                return {
                    ...student,
                    status: attRecord ? attRecord.status : 'Present', // Default to Present
                    behavior: behRecord ? behRecord.type : 'Neutral'
                };
            });

            setDisplayedStudents(mergedStudents);
        } catch (err) {
            console.error("ClassMgmt Update Error:", err);
            setError("Error updating view.");
        }
    }, [selectedClass, attendanceDate, allStudents]);

    // 5. Handlers
    const handleAttendanceStatus = (id, status) => {
        setDisplayedStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    const handleBehaviorLog = (id, type) => {
        setDisplayedStudents(prev => prev.map(s => s.id === id ? { ...s, behavior: type } : s));
    };

    const saveChanges = () => {
        try {
            // Prepare Records
            const newAttendanceRecords = displayedStudents.map(s => ({
                id: Date.now() + Math.random(),
                studentId: s.id,
                studentName: s.name,
                class: selectedClass,
                date: attendanceDate,
                status: s.status
            }));

            const newBehaviorRecords = displayedStudents.filter(s => s.behavior !== 'Neutral').map(s => ({
                id: Date.now() + Math.random(),
                studentId: s.id,
                studentName: s.name,
                date: attendanceDate,
                type: s.behavior
            }));

            // 1. Update Attendance Storage
            const allAttendance = safeJSONParse('sec_attendance', []);
            const otherAttendance = Array.isArray(allAttendance) ? allAttendance.filter(r => !(r.date === attendanceDate && r.class === selectedClass)) : [];
            localStorage.setItem('sec_attendance', JSON.stringify([...otherAttendance, ...newAttendanceRecords]));

            // 2. Update Behavior Storage
            const allBehavior = safeJSONParse('teacher_behavior_logs', []);
            const studentIds = displayedStudents.map(s => s.id);
            const otherBehavior = Array.isArray(allBehavior) ? allBehavior.filter(r => !(r.date === attendanceDate && studentIds.includes(r.studentId))) : [];
            localStorage.setItem('teacher_behavior_logs', JSON.stringify([...otherBehavior, ...newBehaviorRecords]));

            alert("Date saved successfully!");
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save data.");
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Present': return t('teacher.classes.present') || 'Present';
            case 'Absent': return t('teacher.classes.absent') || 'Absent';
            case 'Late': return t('teacher.classes.late') || 'Late';
            default: return status;
        }
    };

    if (error) {
        return <div className="p-8 text-center text-red-500">Error loading Class Management: {error}</div>;
    }

    // Filter by Search
    const filteredList = displayedStudents.filter(s => s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                        className="teacher-select"
                        onChange={(e) => {
                           const grade = e.target.value;
                           const startList = safeJSONParse('school_classes', []).map(c => c.name) || ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
                           
                           if (grade === 'All') {
                               setClasses(startList);
                               if(startList.length > 0) setSelectedClass(startList[0]);
                           } else {
                               const filtered = startList.filter(c => c.includes(grade));
                               setClasses(filtered);
                               if(filtered.length > 0) setSelectedClass(filtered[0]);
                               else setSelectedClass('');
                           }
                        }}
                    >
                        <option value="All">All Grades</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                    </select>

                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="teacher-select"
                    >
                        {classes.length > 0 ? classes.map(cls => <option key={cls} value={cls}>{cls}</option>) : <option>No Classes</option>}
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
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--teacher-text-main)' }}>{filteredList.length}</p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#DBEAFE', color: '#2563EB', borderRadius: '0.5rem' }}>
                        <Users size={24} />
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>{t('teacher.classes.presentToday')}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                            {filteredList.filter(s => s.status === 'Present').length}
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
                            {filteredList.filter(s => s.status === 'Absent').length}
                        </p>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem' }}>
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
                            placeholder={t('teacher.classes.searchStudent') || "Search student..."}
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
                            {filteredList.length > 0 ? filteredList.map((student) => (
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
                                                style={student.behavior === 'Positive' ? { backgroundColor: '#DCFCE7', color: '#15803D' } : {}}
                                                title="Log Positive Behavior"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleBehaviorLog(student.id, 'Negative')}
                                                className={`icon-btn ${student.behavior === 'Negative' ? 'danger' : ''}`}
                                                style={student.behavior === 'Negative' ? { backgroundColor: '#FEE2E2', color: '#DC2626' } : {}}
                                                title="Log Negative Behavior"
                                            >
                                                <AlertTriangle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                        No students found in this class.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--teacher-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={saveChanges}>
                        {t('teacher.classes.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement;
