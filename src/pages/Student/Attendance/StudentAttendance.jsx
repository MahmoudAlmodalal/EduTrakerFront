import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../../Student/Student.css';

const StudentAttendance = () => {
    const { t } = useTheme();
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock Data
    const attendanceStats = {
        present: 45,
        absent: 3,
        late: 2,
        excused: 1,
        totalDays: 51,
        attendanceRate: 88.2
    };

    const monthlyData = [
        { month: 'Sep', present: 20, absent: 1, late: 0 },
        { month: 'Oct', present: 18, absent: 2, late: 1 },
        { month: 'Nov', present: 21, absent: 0, late: 1 },
        { month: 'Dec', present: 8, absent: 0, late: 0 },
    ];

    const attendanceHistory = [
        { id: 1, date: '2024-12-10', subject: 'Mathematics', statusKey: 'present', time: '08:00 AM' },
        { id: 2, date: '2024-12-10', subject: 'Physics', statusKey: 'present', time: '10:00 AM' },
        { id: 3, date: '2024-12-09', subject: 'Chemistry', statusKey: 'late', time: '08:15 AM' },
        { id: 4, date: '2024-12-08', subject: 'English', statusKey: 'absent', time: '09:00 AM' },
        { id: 5, date: '2024-12-08', subject: 'History', statusKey: 'present', time: '11:00 AM' },
        { id: 6, date: '2024-12-07', subject: 'Biology', statusKey: 'excused', time: '08:00 AM' },
        { id: 7, date: '2024-12-06', subject: 'Mathematics', statusKey: 'present', time: '08:00 AM' },
        { id: 8, date: '2024-12-05', subject: 'Physics', statusKey: 'present', time: '10:00 AM' },
    ];

    const getStatusColor = (statusKey) => {
        switch (statusKey) {
            case 'present': return 'text-green-600 bg-green-50 border-green-100';
            case 'absent': return 'text-red-600 bg-red-50 border-red-100';
            case 'late': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'excused': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (statusKey) => {
        switch (statusKey) {
            case 'present': return <CheckCircle size={16} />;
            case 'absent': return <XCircle size={16} />;
            case 'late': return <Clock size={16} />;
            case 'excused': return <AlertCircle size={16} />;
            default: return null;
        }
    };

    const filterOptions = ['all', 'present', 'absent', 'late'];

    const filteredHistory = filterStatus === 'all'
        ? attendanceHistory
        : attendanceHistory.filter(record => record.statusKey === filterStatus);

    return (
        <div className="student-attendance space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">{t('student.attendance.title')}</h1>
                <p className="text-slate-500">{t('student.attendance.subtitle')}</p>
            </header>

            {/* Warning Banner */}
            {attendanceStats.attendanceRate < 90 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-red-700">{t('student.attendance.attendanceAlert')}</h4>
                        <p className="text-sm text-red-600">
                            {t('student.attendance.lowAttendanceWarning')} <strong>{attendanceStats.attendanceRate}%</strong>.
                            {' '}{t('student.attendance.lowAttendanceAction')}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">{t('student.attendance.totalPresent')}</div>
                    <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                    <div className="text-xs text-slate-400">{t('student.attendance.days')}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">{t('student.attendance.totalAbsent')}</div>
                    <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                    <div className="text-xs text-slate-400">{t('student.attendance.days')}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">{t('student.attendance.lateExcused')}</div>
                    <div className="text-2xl font-bold text-orange-600">{attendanceStats.late + attendanceStats.excused}</div>
                    <div className="text-xs text-slate-400">{t('student.attendance.days')}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">{t('student.attendance.attendanceRate')}</div>
                    <div className={`text-2xl font-bold ${attendanceStats.attendanceRate >= 90 ? 'text-blue-600' : 'text-red-600'}`}>
                        {attendanceStats.attendanceRate}%
                    </div>
                    <div className="text-xs text-slate-400">{t('student.attendance.overall')}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Chart (Visual only for now) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        {t('student.attendance.monthlyBreakdown')}
                    </h3>
                    <div className="space-y-4">
                        {monthlyData.map((data, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700">{data.month}</span>
                                    <span className="text-slate-500">{Math.round((data.present / (data.present + data.absent + data.late)) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(data.present / 25) * 100}%` }} className="bg-green-500 h-full"></div>
                                    <div style={{ width: `${(data.absent / 25) * 100}%` }} className="bg-red-500 h-full"></div>
                                    <div style={{ width: `${(data.late / 25) * 100}%` }} className="bg-orange-500 h-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> {t('student.attendance.present')}</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> {t('student.attendance.absent')}</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {t('student.attendance.late')}</div>
                    </div>
                </div>

                {/* History List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="font-bold text-slate-800">{t('student.attendance.recentHistory')}</h3>

                        {/* Filters */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {filterOptions.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t(`student.attendance.${status}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600">{t('student.attendance.date')}</th>
                                    <th className="p-3 font-semibold text-slate-600">{t('student.attendance.subject')}</th>
                                    <th className="p-3 font-semibold text-slate-600">{t('student.attendance.time')}</th>
                                    <th className="p-3 font-semibold text-slate-600">{t('student.attendance.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">{record.date}</td>
                                        <td className="p-3 text-slate-600">{record.subject}</td>
                                        <td className="p-3 text-slate-500">{record.time}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.statusKey)}`}>
                                                {getStatusIcon(record.statusKey)}
                                                <span>{t(`student.attendance.${record.statusKey}`)}</span>
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400 italic">
                                            {t('student.attendance.noRecords')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
