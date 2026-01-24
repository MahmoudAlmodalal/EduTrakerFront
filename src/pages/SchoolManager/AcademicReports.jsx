import React, { useState } from 'react';
import {
    FileText,
    TrendingUp,
    Users,
    Download,
    Search,
    Filter,
    X,
    Eye
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

    // Helper to safe parse from local storage
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch { return fallback; }
    };

    const students = safeParse('sec_students', []);
    const allocations = safeParse('school_allocations', []);

    // "Export All" Functionality
    const handleExportAll = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Name,Grade,Class,Guardian,Contact\n"
            + students.map(s => `${s.id},${s.name},${s.grade},${s.class || 'Unassigned'},${s.guardian},${s.contact}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "school_database_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'performance':
                return <StudentPerformance students={students} />;
            case 'class-comparison':
                return <ClassComparison students={students} allocations={allocations} />;
            case 'progress':
                return <StudentProgress />;
            default:
                return <StudentPerformance students={students} />;
        }
    };

    return (
        <div className="academic-reports-page">
            <div className="school-manager-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="school-manager-title">Academic & Performance Reports</h1>
                        <p className="school-manager-subtitle">Analyze student performance, class statistics, and progress.</p>
                    </div>
                    <button className="btn-primary" onClick={handleExportAll} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                        <Download size={18} />
                        Export All Data
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={FileText} label="Student Performance" />
                <TabButton active={activeTab === 'class-comparison'} onClick={() => setActiveTab('class-comparison')} icon={Users} label="Class Comparison" />
                <TabButton active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} icon={TrendingUp} label="Student Progress" />
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        style={{
            paddingBottom: '0.5rem',
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
        }}
    >
        <Icon size={18} />
        {label}
    </button>
);


// --- Sub-components ---

const StudentPerformance = ({ students }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('All Classes');
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Get unique classes for filter dropdown
    const uniqueClasses = ['All Classes', ...new Set(students.map(s => s.class).filter(Boolean))];

    // Filter Logic
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.id.toString().includes(searchTerm);
        const matchesClass = classFilter === 'All Classes' || s.class === classFilter;
        return matchesSearch && matchesClass;
    });

    // Determine status logic (mocked based on random logic or ID for stability in demo)
    const getStatus = (id) => {
        const val = id % 4;
        if (val === 0) return { label: 'Top Performer', color: '#166534', bg: '#dcfce7' };
        if (val === 1) return { label: 'Excellent', color: '#15803d', bg: '#f0fdf4' };
        if (val === 2) return { label: 'Average', color: '#854d0e', bg: '#fef9c3' };
        return { label: 'At Risk', color: '#991b1b', bg: '#fee2e2' };
    };

    return (
        <div className="management-card">
            <div className="table-header-actions" style={{gap: '1rem', flexWrap: 'wrap'}}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Filter size={18} style={{color: 'var(--color-text-muted)'}} />
                    <select 
                        value={classFilter} 
                        onChange={(e) => setClassFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                    >
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            
            <div style={{overflowX: 'auto'}}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Class</th>
                            <th>GPA (Est.)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? filteredStudents.map((std) => {
                            const status = getStatus(std.id);
                            return (
                                <tr key={std.id}>
                                    <td className="text-gray-500">#{std.id}</td>
                                    <td className="font-medium text-gray-900">{std.name}</td>
                                    <td>{std.class || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                    <td style={{ fontWeight: 'bold' }}>{(3.0 + (std.id % 10)/10).toFixed(1)}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '500',
                                            backgroundColor: status.bg, color: status.color
                                        }}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => setSelectedStudent(std)} className="text-blue-600 hover:text-blue-900" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', items: 'center', gap: '4px' }}>
                                            <Eye size={16}/> Details
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No students found matching filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedStudent && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '500px', border: '1px solid var(--color-border)', position: 'relative' }}>
                        <button onClick={() => setSelectedStudent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Student Details: {selectedStudent.name}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><strong>ID:</strong> {selectedStudent.id}</div>
                            <div><strong>Grade:</strong> {selectedStudent.grade}</div>
                            <div><strong>Class:</strong> {selectedStudent.class || 'N/A'}</div>
                            <div><strong>Gender:</strong> {selectedStudent.gender}</div>
                            <div><strong>Guardian:</strong> {selectedStudent.guardian}</div>
                            <div><strong>Contact:</strong> {selectedStudent.contact}</div>
                            <div><strong>DOB:</strong> {selectedStudent.dob}</div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => setSelectedStudent(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClassComparison = ({ students }) => {
    // Dynamically calculate class stats
    const classStats = {};
    students.forEach(s => {
        if (!s.class) return;
        if (!classStats[s.class]) classStats[s.class] = { name: s.class, count: 0, Math: 0, Science: 0, English: 0 };
        classStats[s.class].count++;
        // Simulate varying averages per class based on class name char code
        const bias = s.class.charCodeAt(s.class.length - 1); 
        classStats[s.class].Math += 70 + (bias % 20);
        classStats[s.class].Science += 72 + (bias % 18);
        classStats[s.class].English += 75 + (bias % 15);
    });

    const data = Object.values(classStats).map(c => ({
        name: c.name,
        Math: Math.round(c.Math / c.count),
        Science: Math.round(c.Science / c.count),
        English: Math.round(c.English / c.count)
    }));

    return (
        <div className="management-card p-6" style={{ padding: '1.5rem' }}>
            <h3 className="chart-title mb-6" style={{ marginBottom: '1.5rem' }}>Class Performance Comparison (Math, Science, English)</h3>
            {data.length > 0 ? (
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Math" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Science" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="English" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500">No class data available for comparison. Assign students to classes first.</div>
            )}
        </div>
    );
};

const StudentProgress = () => {
    // Mock longitudinal data (hard to derive from snapshot state without history DB)
    const data = [
        { term: 'Term 1', 'Grade 1': 75, 'Grade 2': 78, 'Grade 3': 82 },
        { term: 'Term 2', 'Grade 1': 78, 'Grade 2': 80, 'Grade 3': 81 },
        { term: 'Term 3', 'Grade 1': 82, 'Grade 2': 84, 'Grade 3': 85 },
        { term: 'Term 4', 'Grade 1': 85, 'Grade 2': 88, 'Grade 3': 89 },
    ];

    return (
        <div className="management-card p-6" style={{ padding: '1.5rem' }}>
            <h3 className="chart-title mb-6" style={{ marginBottom: '1.5rem' }}>Average Performance Trend (Historical)</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="term" />
                        <YAxis domain={[60, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Grade 1" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Grade 2" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="Grade 3" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
                * Note: Historical progress data is simulated for demonstration purposes as term history is not yet populated.
            </p>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.5rem 0.5rem 2.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-border)'
};

export default AcademicReports;
