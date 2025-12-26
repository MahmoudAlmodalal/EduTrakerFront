import React, { useState } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('1-A');

    // Mock Data
    const students = [
        { id: 1, name: 'Alice Johnson', status: 'Present', time: '08:00 AM' },
        { id: 2, name: 'Bob Smith', status: 'Absent', time: '-' },
        { id: 3, name: 'Charlie Brown', status: 'Late', time: '08:45 AM' },
        { id: 4, name: 'David Lee', status: 'Present', time: '07:55 AM' },
        { id: 5, name: 'Eva Green', status: 'Excused', time: '-' },
    ];

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
                            placeholder={t('secretary.attendance.searchStudent')}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                            {students.map((student) => (
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
                                            <button className="btn-icon" title={t('secretary.attendance.markPresent')}>
                                                <CheckCircle size={18} className="text-green-600" />
                                            </button>
                                            <button className="btn-icon" title={t('secretary.attendance.markAbsent')}>
                                                <XCircle size={18} className="text-red-600" />
                                            </button>
                                            <button className="btn-icon" title={t('secretary.attendance.markLate')}>
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
