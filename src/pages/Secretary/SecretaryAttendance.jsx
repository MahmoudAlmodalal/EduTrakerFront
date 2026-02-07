import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';

const SecretaryAttendance = () => {
    const { t } = useTheme();
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo, statusFilter]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (statusFilter) params.status = statusFilter;
            const data = await secretaryService.getAttendance(params);
            setRecords(data.results || data || []);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError('Failed to load attendance records.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'text-green-600 bg-green-50 border-green-200';
            case 'absent': return 'text-red-600 bg-red-50 border-red-200';
            case 'late': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'excused': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        const map = {
            present: t('secretary.attendance.present') || 'Present',
            absent: t('secretary.attendance.absent') || 'Absent',
            late: t('secretary.attendance.late') || 'Late',
            excused: t('secretary.attendance.excused') || 'Excused',
        };
        return map[status] || status;
    };

    const filteredRecords = records.filter(r =>
        (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Summary stats
    const totalPresent = records.filter(r => r.status === 'present').length;
    const totalAbsent = records.filter(r => r.status === 'absent').length;
    const totalLate = records.filter(r => r.status === 'late').length;

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.attendance.title')}</h1>
                <p>{t('secretary.attendance.subtitle')}</p>
            </header>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{totalPresent}</div>
                    <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>Present</div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{totalAbsent}</div>
                    <div style={{ fontSize: '0.8rem', color: '#f87171' }}>Absent</div>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{totalLate}</div>
                    <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Late</div>
                </div>
            </div>

            <div className="management-card">
                <div className="table-controls">
                    <div className="flex gap-4 items-center">
                        <div className="form-group mb-0">
                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="text-xs text-gray-500 mb-1 block">Status</label>
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
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
                    {loading ? <p className="text-center p-8">Loading attendance records...</p> : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t('secretary.attendance.studentName')}</th>
                                    <th>Course</th>
                                    <th>Date</th>
                                    <th>{t('secretary.attendance.status')}</th>
                                    <th>Note</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td>#{record.id}</td>
                                        <td className="font-medium">{record.student_name || '-'}</td>
                                        <td>{record.course_name || '-'}</td>
                                        <td className="text-gray-500">{record.date || '-'}</td>
                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                                                {getStatusLabel(record.status)}
                                            </span>
                                        </td>
                                        <td className="text-gray-500 text-sm">{record.note || '-'}</td>
                                        <td className="text-gray-500 text-sm">{record.recorded_by_name || '-'}</td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr><td colSpan="7" className="text-center p-4">No attendance records found for this date range.</td></tr>
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
