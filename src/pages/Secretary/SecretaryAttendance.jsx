import React, { useState } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('1-A');

    // Load Students from Shared Storage
    const [students] = useState(() => {
        const savedStudents = localStorage.getItem('sec_students');
        // Fallback or use what's there. Attendance needs all students, or filtered by class.
        // For this demo, we'll use all students found or a default list if admissions hasn't run yet.
        return savedStudents ? JSON.parse(savedStudents) : [
             { id: 1, name: 'Alice Johnson', status: 'Present', time: '08:00 AM' }, // Fallback mock
             { id: 2, name: 'Bob Smith', status: 'Absent', time: '-' },
        ];
    });

    // Attendance State
    const [attendanceRecords, setAttendanceRecords] = useState(() => {
        const saved = localStorage.getItem('sec_attendance');
        return saved ? JSON.parse(saved) : {}; 
        // Structure: { "2025-12-27": { studentId: { status: 'Present', time: '...' } } }
    });

    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        localStorage.setItem('sec_attendance', JSON.stringify(attendanceRecords));
    }, [attendanceRecords]);

    // Derived state: Combine Students + Today's Attendance
    const getStudentAttendance = (studentId) => {
        const todayRecord = attendanceRecords[date];
        if (todayRecord && todayRecord[studentId]) {
            return todayRecord[studentId];
        }
        return { status: 'Pending', time: '-' }; // Default
    };

    const handleMarkAttendance = (studentId, status) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAttendanceRecords(prev => ({
            ...prev,
            [date]: {
                ...(prev[date] || {}),
                [studentId]: { status, time: status === 'Absent' ? '-' : time }
            }
        }));
    };

    const displayedStudents = students
        .filter(s => {
            const matchesClass = selectedClass ? s.class === selectedClass : true;
            const matchesName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesClass && matchesName;
        })
        .map(s => ({
            ...s,
            ...getStudentAttendance(s.id)
        }));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'text-green-600 bg-green-50 border-green-200';
            case 'Absent': return 'text-red-600 bg-red-50 border-red-200';
            case 'Late': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Excused': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusTranslation = (status) => {
        switch (status) {
            case 'Present': return 'Present';
            case 'Absent': return 'Absent';
            case 'Late': return 'Late';
            case 'Excused': return 'Excused';
            default: return status;
        }
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Attendance Management</h1>
                <p>Track and manage student daily attendance.</p>
            </header>

            <div className="management-card">
                <div className="table-controls">
                    <div className="flex gap-4 items-center">
                        <div className="form-group mb-0">
                            <input
                                type="date"
                                className="form-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <select
                                className="form-select"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="1-A">Class 1-A</option>
                                <option value="1-B">Class 1-B</option>
                                <option value="2-A">Class 2-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search student..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Arrival Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedStudents.length === 0 ? (
                                <tr><td colspan="4" className="text-center p-4 text-gray-400">No students found</td></tr>
                            ) : displayedStudents.map((student) => (
                                <tr key={student.id}>
                                    <td className="font-medium">{student.name}</td>
                                    <td className="text-gray-500">{student.time}</td>
                                    <td>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(student.status)}`}>
                                            {getStatusTranslation(student.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-icon" title="Mark Present" onClick={() => handleMarkAttendance(student.id, 'Present')}>
                                                <CheckCircle size={18} className="text-green-600" />
                                            </button>
                                            <button className="btn-icon" title="Mark Absent" onClick={() => handleMarkAttendance(student.id, 'Absent')}>
                                                <XCircle size={18} className="text-red-600" />
                                            </button>
                                            <button className="btn-icon" title="Mark Late" onClick={() => handleMarkAttendance(student.id, 'Late')}>
                                                <Clock size={18} className="text-orange-600" />
                                            </button>
                                        </div>
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

export default SecretaryAttendance;
