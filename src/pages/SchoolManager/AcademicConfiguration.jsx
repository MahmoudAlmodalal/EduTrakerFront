import React, { useState } from 'react';
import {
    BookOpen,
    Users,
    Calendar,
    AlertTriangle,
    Plus,
    Save,
    CheckCircle,
    Search
} from 'lucide-react';
import './SchoolManager.css';

const AcademicConfiguration = () => {
    const [activeTab, setActiveTab] = useState('subjects');

    // Mock Data for Tabs
    const [allocations, setAllocations] = useState([
        { id: 1, class: '1-A', subject: 'Mathematics', teacher: 'Mr. Smith' },
        { id: 2, class: '1-A', subject: 'Science', teacher: 'Ms. Johnson' },
        { id: 3, class: '1-B', subject: 'Mathematics', teacher: 'Mr. Smith' },
    ]);

    const [conflicts, setConflicts] = useState([
        { id: 1, type: 'Room Double Booking', description: 'Room 101 booked for Math 1-A and Sci 1-B at Monday 9:00 AM', severity: 'High' },
        { id: 2, type: 'Teacher Overlap', description: 'Mr. Smith assigned to 1-A and 1-B at Tuesday 10:00 AM', severity: 'High' },
    ]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'subjects':
                return <SubjectAllocation allocations={allocations} />;
            case 'teachers':
                return <TeacherAllocation allocations={allocations} />;
            case 'timetable':
                return <TimetableGenerator />;
            case 'conflicts':
                return <ConflictDetection conflicts={conflicts} />;
            default:
                return <SubjectAllocation allocations={allocations} />;
        }
    };

    return (
        <div className="academic-config-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Academic Configuration</h1>
                <p className="school-manager-subtitle">Manage academic year settings, allocations, and scheduling.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <button
                    className={`pb-2 px-1 ${activeTab === 'subjects' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    style={{
                        paddingBottom: '0.5rem',

                        color: activeTab === 'subjects' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'subjects' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('subjects')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} />
                        Subject Allocation
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'teachers' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'teachers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'teachers' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('teachers')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        Teacher Allocation
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'timetable' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'timetable' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'timetable' ? '2px solid var(--color-primary)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('timetable')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} />
                        Timetable Generator
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'conflicts' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        color: activeTab === 'conflicts' ? 'var(--color-error)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'conflicts' ? '2px solid var(--color-error)' : '2px solid transparent'
                    }}
                    onClick={() => setActiveTab('conflicts')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} />
                        Conflict Detection
                    </div>
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Sub-components for Tabs
const SubjectAllocation = ({ allocations }) => (
    <div className="management-card">
        <div className="table-header-actions">
            <h3 className="chart-title">Subject Allocations</h3>
            <button className="btn-primary">
                <Plus size={18} />
                Allocate Subject
            </button>
        </div>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {allocations.map((item) => (
                    <tr key={item.id}>
                        <td className="font-medium text-gray-900">{item.class}</td>
                        <td>{item.subject}</td>
                        <td>
                            <button className="text-red-600 hover:text-red-900" style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TeacherAllocation = ({ allocations }) => (
    <div className="management-card">
        <div className="table-header-actions">
            <h3 className="chart-title">Teacher Allocations</h3>
            <button className="btn-primary">
                <Plus size={18} />
                Assign Teacher
            </button>
        </div>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Assigned Teacher</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {allocations.map((item) => (
                    <tr key={item.id}>
                        <td>{item.class}</td>
                        <td>{item.subject}</td>
                        <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                    {item.teacher.charAt(0)}
                                </div>
                                {item.teacher}
                            </div>
                        </td>
                        <td>
                            <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TimetableGenerator = () => (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="management-card p-6" style={{ padding: '1.5rem' }}>
            <h3 className="chart-title mb-4" style={{ marginBottom: '1rem' }}>Generate Weekly Schedule</h3>
            <p className="text-gray-500 mb-6" style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Automatically generate the weekly timetable based on subject allocations and teacher availability.
            </p>
            <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary">
                    <Calendar size={18} />
                    Generate Timetable
                </button>
                <button style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'white', cursor: 'pointer' }}>
                    View Constraints
                </button>
            </div>
        </div>

        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Generated Timetable Preview (Grade 1-A)</h3>
            </div>
            <div className="p-6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '0.5rem', border: '2px dashed #cbd5e1' }}>
                    Timetable not yet generated. Click "Generate Timetable" to start.
                </div>
            </div>
        </div>
    </div>
);

const ConflictDetection = ({ conflicts }) => (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="management-card">
            <div className="table-header-actions" style={{ justifyContent: 'space-between' }}>
                <h3 className="chart-title">System Alerts & Conflicts</h3>
                <button className="btn-primary" style={{ background: 'var(--color-warning)', color: '#000' }}>
                    Run Conflict Check
                </button>
            </div>

            {conflicts.length > 0 ? (
                <div style={{ padding: '0' }}>
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{conflict.type}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{conflict.description}</p>
                                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>
                                    {conflict.severity} Severity
                                </span>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                    Resolve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={48} className="text-green-500" style={{ color: 'var(--color-success)' }} />
                    <h3 className="text-lg font-medium">No Conflicts Detected</h3>
                    <p className="text-gray-500">All academic allocations look good.</p>
                </div>
            )}
        </div>
    </div>
);

export default AcademicConfiguration;
