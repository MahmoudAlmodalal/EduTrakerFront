import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('1'); // Use ID 1 for Class 1-A
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, [date, selectedClass]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const data = await secretaryService.getAttendance(date, selectedClass);
            setStudents(data.results || data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (studentId, status) => {
        try {
            await secretaryService.recordAttendance({
                student_id: studentId,
                date: date,
                status: status,
                class_room_id: selectedClass
            });
            fetchAttendance();
        } catch (error) {
            alert('Error recording attendance: ' + error.message);
        }
    };

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
            case 'Present': return t('secretary.attendance.present');
            case 'Absent': return t('secretary.attendance.absent');
            case 'Late': return t('secretary.attendance.late');
            case 'Excused': return t('secretary.attendance.excused');
            default: return status;
        }
    };

    const filteredStudents = students.filter(s =>
        (s.student_name || s.student?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.attendance.title')}</h1>
                <p>{t('secretary.attendance.subtitle')}</p>
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
                                <option value="1">Class 1-A</option>
                                <option value="2">Class 1-B</option>
                                <option value="3">Class 2-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('secretary.attendance.searchStudent')}
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? <p className="text-center p-8">Loading attendance record...</p> : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('secretary.attendance.studentName')}</th>
                                    <th>{t('secretary.attendance.arrivalTime')}</th>
                                    <th>{t('secretary.attendance.status')}</th>
                                    <th>{t('secretary.attendance.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((record) => (
                                    <tr key={record.id}>
                                        <td className="font-medium">{record.student_name || record.student?.full_name}</td>
                                        <td className="text-gray-500">{record.arrival_time || '-'}</td>
                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                                                {getStatusTranslation(record.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn-icon" title={t('secretary.attendance.markPresent')} onClick={() => handleMarkAttendance(record.student_id || record.student?.id, 'Present')}>
                                                    <CheckCircle size={18} className="text-green-600" />
                                                </button>
                                                <button className="btn-icon" title={t('secretary.attendance.markAbsent')} onClick={() => handleMarkAttendance(record.student_id || record.student?.id, 'Absent')}>
                                                    <XCircle size={18} className="text-red-600" />
                                                </button>
                                                <button className="btn-icon" title={t('secretary.attendance.markLate')} onClick={() => handleMarkAttendance(record.student_id || record.student?.id, 'Late')}>
                                                    <Clock size={18} className="text-orange-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr><td colSpan="4" className="text-center p-4">No records found.</td></tr>
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
