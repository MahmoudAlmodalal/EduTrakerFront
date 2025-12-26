import React, { useState } from 'react';
import {
    FileText,
    TrendingUp,
    Users,
    Download,
    Search
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import './SchoolManager.css';

const AcademicReports = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('performance');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'performance':
                return <StudentPerformance />;
            case 'class-comparison':
                return <ClassComparison />;
            case 'progress':
                return <StudentProgress />;
            default:
                return <StudentPerformance />;
        }
    };

    return (
        <div className="academic-reports-page">
            <div className="school-manager-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="school-manager-title">{t('school.reports.title')}</h1>
                        <p className="school-manager-subtitle">{t('school.reports.subtitle')}</p>
                    </div>
                    <button className="btn-primary" style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                        <Download size={18} />
                        {t('school.reports.exportAll')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <button
                    className={`pb-2 px-1 ${activeTab === 'performance' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'performance' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'performance' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('performance')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} />
                        Student Performance
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'class-comparison' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'class-comparison' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'class-comparison' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('class-comparison')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        Class Comparison
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'progress' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'progress' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'progress' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('progress')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} />
                        Student Progress
                    </div>
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Sub-components
const StudentPerformance = () => {
    // Mock Data
    const students = [
        { id: 1, name: 'Alice Johnson', class: '1-A', gpa: 3.8, status: 'Excellent' },
        { id: 2, name: 'Bob Smith', class: '1-A', gpa: 2.5, status: 'Average' },
        { id: 3, name: 'Charlie specific', class: '1-B', gpa: 1.9, status: 'At Risk' },
        { id: 4, name: 'Diana Prince', class: '2-A', gpa: 4.0, status: 'Top Performer' },
        { id: 5, name: 'Evan Wright', class: '2-B', gpa: 3.2, status: 'Good' },
    ];

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search student..."
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}>
                        <option>All Classes</option>
                        <option>1-A</option>
                        <option>1-B</option>
                    </select>
                </div>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>GPA</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((std) => (
                        <tr key={std.id}>
                            <td className="font-medium text-gray-900">{std.name}</td>
                            <td>{std.class}</td>
                            <td style={{ fontWeight: 'bold' }}>{std.gpa}</td>
                            <td>
                                <span className={`status-badge ${std.status === 'At Risk' ? 'status-inactive' :
                                    std.status === 'Top Performer' || std.status === 'Excellent' ? 'status-active' :
                                        ''
                                    }`} style={{
                                        backgroundColor: std.status === 'At Risk' ? '#fee2e2' : std.status === 'Top Performer' ? '#dcfce7' : '#f1f5f9',
                                        color: std.status === 'At Risk' ? '#991b1b' : std.status === 'Top Performer' ? '#166534' : '#475569'
                                    }}>
                                    {std.status}
                                </span>
                            </td>
                            <td>
                                <button className="text-blue-600 hover:text-blue-900" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>View Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ClassComparison = () => {
    const data = [
        { name: '1-A', Math: 85, Science: 82, English: 88 },
        { name: '1-B', Math: 78, Science: 85, English: 80 },
        { name: '2-A', Math: 90, Science: 88, English: 92 },
        { name: '2-B', Math: 82, Science: 80, English: 85 },
    ];

    return (
        <div className="management-card p-6" style={{ padding: '1.5rem' }}>
            <h3 className="chart-title mb-6" style={{ marginBottom: '1.5rem' }}>Class Performance Comparison</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Math" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Science" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="English" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StudentProgress = () => {
    const data = [
        { term: 'Term 1', 'Grade 1': 75, 'Grade 2': 78, 'Grade 3': 82 },
        { term: 'Term 2', 'Grade 1': 78, 'Grade 2': 80, 'Grade 3': 81 },
        { term: 'Term 3', 'Grade 1': 82, 'Grade 2': 84, 'Grade 3': 85 },
        { term: 'Term 4', 'Grade 1': 85, 'Grade 2': 88, 'Grade 3': 89 },
    ];

    return (
        <div className="management-card p-6" style={{ padding: '1.5rem' }}>
            <h3 className="chart-title mb-6" style={{ marginBottom: '1.5rem' }}>Average Performance Trend over Terms</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="term" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Grade 1" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Grade 2" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="Grade 3" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AcademicReports;
