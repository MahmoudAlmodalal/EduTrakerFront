import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    Calendar,
    AlertTriangle,
    Plus,
    Save,
    CheckCircle,
    Search,
    Download
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './SchoolManager.css';

const AcademicConfiguration = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('subjects');

    // --- SHARED STATE (LIFTED) ---
    // We lift state here so tabs can share data (e.g. conflicts need allocations)
    
    // Helper for safe storage
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) { return fallback; }
    };

    const [allocations, setAllocations] = useState(() => safeParse('school_allocations', [
        { id: 1, class: '1-A', subject: 'Mathematics', teacher: 'Mr. Smith' },
        { id: 2, class: '1-A', subject: 'Science', teacher: 'Ms. Johnson' },
        { id: 3, class: '1-B', subject: 'Mathematics', teacher: 'Mr. Smith' },
    ]));

    // Persist allocations whenever they change
    useEffect(() => {
        localStorage.setItem('school_allocations', JSON.stringify(allocations));
    }, [allocations]);


    const [conflicts, setConflicts] = useState([]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'subjects':
                return <SubjectAllocation allocations={allocations} setAllocations={setAllocations} />;
            case 'teachers':
                return <TeacherAllocation allocations={allocations} setAllocations={setAllocations} />;
            case 'timetable':
                return <TimetableGenerator allocations={allocations} />;
            case 'conflicts':
                return <ConflictDetection allocations={allocations} conflicts={conflicts} setConflicts={setConflicts} />;
            default:
                return <SubjectAllocation allocations={allocations} setAllocations={setAllocations} />;
        }
    };

    return (
        <div className="academic-config-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.config.title') || 'Academic Configuration'}</h1>
                <p className="school-manager-subtitle">{t('school.config.subtitle') || 'Manage subjects, teachers, and scheduling.'}</p>
            </div>

            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <TabButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={BookOpen} label="Subject Allocation" />
                <TabButton active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={Users} label="Teacher Allocation" />
                <TabButton active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} icon={Calendar} label="Timetable Generator" />
                <TabButton active={activeTab === 'conflicts'} onClick={() => setActiveTab('conflicts')} icon={AlertTriangle} label="Conflict Detection" color={activeTab === 'conflicts' ? 'var(--color-error)' : undefined} />
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label, color }) => (
    <button
        onClick={onClick}
        style={{
            paddingBottom: '0.5rem',
            color: color || (active ? 'var(--color-primary)' : 'var(--color-text-muted)'),
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: active ? `2px solid ${color || 'var(--color-primary)'}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
        }}
    >
        <Icon size={18} />
        {label}
    </button>
);


// --- Sub-components ---

const SubjectAllocation = ({ allocations, setAllocations }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ class: '', subject: '' });

    const handleSave = (e) => {
        e.preventDefault();
        setAllocations([...allocations, { id: Date.now(), ...formData, teacher: 'Unassigned' }]);
        setIsModalOpen(false);
        setFormData({ class: '', subject: '' });
        alert('Subject allocated successfully!');
    };

    const handleRemove = (id) => {
        if (window.confirm('Are you sure you want to delete this subject allocation?')) {
            setAllocations(allocations.filter(a => a.id !== id));
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Subject Allocations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
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
                                <button onClick={() => handleRemove(item.id)} className="text-red-600 hover:text-red-900" style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px', border: '1px solid var(--color-border)' }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>Allocate Subject to Class</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <select required value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} style={inputStyle}>
                                <option value="">Select Class</option>
                                <option value="1-A">1-A</option>
                                <option value="1-B">1-B</option>
                                <option value="2-A">2-A</option>
                            </select>
                            <select required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={inputStyle}>
                                <option value="">Select Subject</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Science">Science</option>
                                <option value="English">English</option>
                                <option value="History">History</option>
                            </select>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={btnSecondaryStyle}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeacherAllocation = ({ allocations, setAllocations }) => {
    const [editingId, setEditingId] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const handleEdit = (item) => {
        setEditingId(item.id);
        setSelectedTeacher(item.teacher === 'Unassigned' ? '' : item.teacher);
    };

    const handleSave = (id) => {
        const updatedAllocations = allocations.map(a => a.id === id ? { ...a, teacher: selectedTeacher || 'Unassigned' } : a);
        setAllocations(updatedAllocations);
        setEditingId(null);
        alert('Teacher assignment updated!');
    };

    return (
        <div className="management-card">
            <h3 className="chart-title mb-4">Teacher Allocations</h3>
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
                                {editingId === item.id ? (
                                    <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={inputStyle}>
                                        <option value="">Select Teacher</option>
                                        <option value="Mr. Smith">Mr. Smith</option>
                                        <option value="Ms. Johnson">Ms. Johnson</option>
                                        <option value="Mrs. Davis">Mrs. Davis</option>
                                    </select>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={avatarStyle}>{item.teacher.charAt(0)}</span> {item.teacher}
                                    </span>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleSave(item.id)} style={{ color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer' }}><CheckCircle size={18}/></button>
                                        <button onClick={() => setEditingId(null)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleEdit(item)} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TimetableGenerator = ({ allocations }) => {
    const [schedule, setSchedule] = useState({});
    const [isGenerated, setIsGenerated] = useState(false);

    const generateSchedule = () => {
        // Simple mock generation algorithm: Assign slots sequentially
        const newSchedule = {};
        const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        let slotIndex = 0;
        let dayIndex = 0;

        allocations.forEach(alloc => {
            if (alloc.teacher === 'Unassigned') return;
             // Assign specific logic for demo: e.g. Math always at 8 AM
            const time = timeSlots[slotIndex % timeSlots.length];
            const day = days[dayIndex % days.length];
            const key = `${day}-${time}`;
            
            // Simple string concatenation for display cells
            if (!newSchedule[key]) newSchedule[key] = [];
            newSchedule[key].push(`${alloc.subject} (${alloc.class})`);

            slotIndex++;
            if (slotIndex >= timeSlots.length) {
                slotIndex = 0;
                dayIndex++;
            }
        });

        setSchedule(newSchedule);
        setIsGenerated(true);
        // Persist
        localStorage.setItem('school_timetable', JSON.stringify(newSchedule));
        alert('Timetable generated successfully!');
    };

    const handleDownload = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schedule, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "school_timetable.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Timetable downloaded as JSON (Mock PDF)!');
    };

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="management-card p-6" style={{ padding: '1.5rem' }}>
                <h3 className="chart-title mb-4">Generate Weekly Schedule</h3>
                <div className="flex gap-4" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn-primary" onClick={generateSchedule}>
                        <Calendar size={18} /> {isGenerated ? 'Regenerate' : 'Generate Timetable'}
                    </button>
                    {isGenerated && (
                        <button className="btn-secondary" onClick={handleDownload} style={btnSecondaryStyle}>
                            <Download size={18} /> Download
                        </button>
                    )}
                </div>
            </div>

            {isGenerated && (
                <div className="management-card">
                    <h3 className="chart-title mb-4">Timetable Preview</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Time / Day</th>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <th key={d} style={thStyle}>{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'].map(time => (
                                    <tr key={time}>
                                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{time}</td>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                            <td key={day} style={tdStyle}>
                                                {(schedule[`${day}-${time}`] || []).map((item, i) => (
                                                    <div key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px', borderRadius: '4px', margin: '2px 0', fontSize: '11px' }}>
                                                        {item}
                                                    </div>
                                                ))}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const ConflictDetection = ({ allocations, conflicts, setConflicts }) => {
    const runCheck = () => {
        const newConflicts = [];
        
        // 1. Check for Unassigned Teachers
        const unassigned = allocations.filter(a => a.teacher === 'Unassigned');
        if (unassigned.length > 0) {
            newConflicts.push({
                id: Date.now(),
                type: 'Unassigned Teachers',
                description: `${unassigned.length} subjects have no teacher assigned.`,
                severity: 'Medium'
            });
        }

        // 2. Check for Duplicate Teacher Assignments (Mock logic: if smith has > 3 classes)
        const teacherCounts = {};
        allocations.forEach(a => {
            if (a.teacher !== 'Unassigned') {
                teacherCounts[a.teacher] = (teacherCounts[a.teacher] || 0) + 1;
            }
        });
        
        Object.entries(teacherCounts).forEach(([teacher, count]) => {
            if (count > 4) { // Arbitrary limit for demo
                newConflicts.push({
                    id: Date.now() + Math.random(),
                    type: 'Teacher Check',
                    description: `${teacher} is assigned to ${count} classes (Heavy Load).`,
                    severity: 'Low'
                });
            }
        });

        if (newConflicts.length === 0) {
           alert('No conflicts detected!');
        }
        
        setConflicts(newConflicts);
    };

    const resolveConflict = (id) => {
        setConflicts(conflicts.filter(c => c.id !== id));
        alert('Conflict marked as resolved (Note: Change allocation to truly fix).');
    };

    return (
        <div className="management-card">
            <div className="table-header-actions" style={{ justifyContent: 'space-between' }}>
                <h3 className="chart-title">System Alerts & Conflicts</h3>
                <button className="btn-primary" onClick={runCheck} style={{ background: 'var(--color-warning)', color: '#000' }}>
                    Run Conflict Check
                </button>
            </div>

            {conflicts.length > 0 ? (
                <div>
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-error)' }}><AlertTriangle size={20} /></div>
                            <div>
                                <h4 style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{conflict.type}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{conflict.description}</p>
                                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', background: '#fee2e2', color: '#991b1b', marginTop: '4px', display: 'inline-block' }}>{conflict.severity}</span>
                            </div>
                            <button onClick={() => resolveConflict(conflict.id)} style={{ marginLeft: 'auto', ...btnSecondaryStyle }}>Resolve</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No active conflicts.</p>
                </div>
            )}
        </div>
    );
};


// --- Styles ---
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' };
const btnSecondaryStyle = { padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' };
const avatarStyle = { width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-text-main)' };
const thStyle = { padding: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', textAlign: 'center' };
const tdStyle = { padding: '0.75rem', border: '1px solid var(--color-border)', textAlign: 'center' };

export default AcademicConfiguration;
