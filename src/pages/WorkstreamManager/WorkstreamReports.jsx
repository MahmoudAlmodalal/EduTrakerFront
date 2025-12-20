import React from 'react';
import { Calendar, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import './Workstream.css';

const WorkstreamReports = () => {
    const schools = (() => {
        const saved = localStorage.getItem('schools');
        return saved ? JSON.parse(saved) : [
            { name: 'Springfield Elementary', students: 450, capacity: 500 },
            { name: 'Shelbyville High', students: 1100, capacity: 1200 },
            { name: 'Ogdenville Tech', students: 150, capacity: 300 }
        ];
    })();

    const attendanceData = schools.map(school => ({
        school: school.name,
        attendance: Math.floor(Math.random() * (98 - 85) + 85),
        absent: 0 // Will be calculated in render
    })).map(item => ({ ...item, absent: 100 - item.attendance }));

    const resourceData = schools.map(school => {
        const teachers = Math.floor(parseInt(school.students || 0) / 25);
        const classrooms = Math.floor(teachers * 1.2);
        const utilization = Math.round((parseInt(school.students || 0) / parseInt(school.capacity || 1)) * 100);
        return {
            school: school.name,
            teachers: teachers,
            classrooms: classrooms,
            utilization: utilization
        };
    });

    // Calculate Aggregates
    const avgAttendance = Math.round(attendanceData.reduce((acc, curr) => acc + curr.attendance, 0) / (attendanceData.length || 1));
    
    const totalTeachers = resourceData.reduce((acc, curr) => acc + curr.teachers, 0);
    const totalStudents = schools.reduce((acc, curr) => acc + parseInt(curr.students || 0), 0);
    const teacherRatio = totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0;
    
    const avgUtilization = Math.round(resourceData.reduce((acc, curr) => acc + curr.utilization, 0) / (resourceData.length || 1));

    const downloadCSV = (data, filename) => {
        if (!data || !data.length) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">Workstream Reports</h1>
                <p className="workstream-subtitle">Aggregated insights on attendance and resource utilization.</p>
            </div>

            {/* Report Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Avg Attendance</span>
                        <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{avgAttendance}%</div>
                    <div className="stat-trend trend-up">
                        <span>Stable across cluster</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Teacher Ratio</span>
                        <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="stat-value">1:{teacherRatio}</div>
                    <div className="stat-trend">
                        <span style={{ color: 'var(--color-text-muted)' }}>Target is 1:20</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Classroom Usage</span>
                        <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{avgUtilization}%</div>
                    <div className="stat-trend trend-down">
                        <span>Average utilization</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Attendance Report Table */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">Daily Attendance Report</h3>
                        <button 
                            onClick={() => downloadCSV(attendanceData, 'attendance_report.csv')}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}
                            title="Download CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>School</th>
                                <th>Present %</th>
                                <th>Absent %</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((data, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: '500' }}>{data.school}</td>
                                    <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{data.attendance}%</td>
                                    <td style={{ color: 'var(--color-error)' }}>{data.absent}%</td>
                                    <td>
                                        {data.attendance >= 90 ? (
                                            <span className="status-badge status-active">Optimal</span>
                                        ) : (
                                            <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>Attention</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Resource Utilization */}
                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="chart-title">Resource Utilization</h3>
                        <button 
                            onClick={() => downloadCSV(resourceData, 'resource_utilization.csv')}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)' }}
                            title="Download CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>School</th>
                                <th>Teach/Class</th>
                                <th>Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourceData.map((data, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: '500' }}>{data.school}</td>
                                    <td>{data.teachers} / {data.classrooms}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                                                <div style={{
                                                    width: `${Math.min(data.utilization, 100)}%`,
                                                    backgroundColor: data.utilization > 100 ? 'var(--color-error)' : 'var(--color-primary)',
                                                    height: '100%',
                                                    borderRadius: '3px'
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', width: '30px' }}>{data.utilization}%</span>
                                        </div>
                                        {data.utilization > 100 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <AlertCircle size={12} /> Over Capacity
                                            </div>
                                        )}
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

export default WorkstreamReports;
