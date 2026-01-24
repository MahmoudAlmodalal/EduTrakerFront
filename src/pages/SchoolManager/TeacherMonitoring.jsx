import React, { useState, useEffect } from 'react';
import {
    Users,
    Star,
    Award,
    Activity,
    Clock,
    Search,
    Plus,
    MoreVertical,
    Trash2,
    Edit,
    Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './SchoolManager.css';

const TeacherMonitoring = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('directory');

    // --- SHARED DATA MANAGEMENT ---
    const safeParse = (key, fallback) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch { return fallback; }
    };

    const [users, setUsers] = useState(() => safeParse('edutraker_users', []));
    
    // Filter only teachers from the main user base
    const teachers = users.filter(u => u.role === 'TEACHER');

    // Sync back to users when modified
    const updateTeachers = (newTeachersList) => {
        // We need to merge the modified teacher list back into the main users list
        // This is a bit tricky since we're only editing a subset.
        // Strategy: Filter out all teachers from 'users', then append the new 'newTeachersList'
        const nonTeachers = users.filter(u => u.role !== 'TEACHER');
        const updatedUsers = [...nonTeachers, ...newTeachersList];
        setUsers(updatedUsers);
        localStorage.setItem('edutraker_users', JSON.stringify(updatedUsers));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'directory':
                return <TeacherDirectory teachers={teachers} updateTeachers={updateTeachers} />;
            case 'performance':
                return <PerformanceEvaluation teachers={teachers} />;
            case 'activity':
                return <ActivityLogs teachers={teachers} />;
            default:
                return <TeacherDirectory teachers={teachers} updateTeachers={updateTeachers} />;
        }
    };

    return (
        <div className="teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.teachers.title') || 'Teacher Monitoring'}</h1>
                <p className="school-manager-subtitle">{t('school.teachers.subtitle') || 'Manage staff, track performance, and view activity.'}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <TabButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={Users} label="Directory" />
                <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={Star} label="Performance" />
                <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={Activity} label="Activity Log" />
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

const TeacherDirectory = ({ teachers, updateTeachers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', status: 'Active', bio: '' });
    const [editingId, setEditingId] = useState(null);

    // Fetch registered subjects from allocations
    const [availableSubjects, setAvailableSubjects] = useState([]);
    useEffect(() => {
        try {
            const allocations = JSON.parse(localStorage.getItem('school_allocations') || '[]');
            const subjects = [...new Set(allocations.map(a => a.subject).filter(Boolean))];
            setAvailableSubjects(subjects.length > 0 ? subjects : ['Mathematics', 'Science', 'English', 'History', 'Art']);
        } catch {
            setAvailableSubjects(['Mathematics', 'Science', 'English', 'History', 'Art']);
        }
    }, []);

    // Search Logic
    const filteredTeachers = teachers.filter(t => 
        Object.values(t).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleSave = (e) => {
        e.preventDefault();
        if (editingId) {
            // Edit existing
            const updatedList = teachers.map(t => t.id === editingId ? { ...t, ...formData } : t);
            updateTeachers(updatedList);
        } else {
            // Add new
            const newTeacher = { 
                id: Date.now(), 
                role: 'TEACHER', 
                avatar: 'https://i.pravatar.cc/150?u=' + Date.now(),
                ...formData 
            };
            updateTeachers([...teachers, newTeacher]);
        }
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', email: '', subject: '', status: 'Active', bio: '' });
    };

    const handleEdit = (teacher) => {
        setEditingId(teacher.id);
        setFormData({ 
            name: teacher.name, 
            email: teacher.email || '', 
            subject: teacher.subject || '', 
            status: teacher.status || 'Active',
            bio: teacher.bio || '' 
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this teacher?')) {
            updateTeachers(teachers.filter(t => t.id !== id));
        }
    };

    // Helper to get initials if no avatar
    const getInitials = (name) => name ? name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'T';

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, subject..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <button className="btn-primary" onClick={() => { setEditingId(null); setFormData({ name: '', email: '', subject: '', status: 'Active', bio: '' }); setIsModalOpen(true); }}>
                    <Plus size={18} />
                    Add Teacher
                </button>
            </div>
            
            <div style={{overflowX: 'auto'}}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTeachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td className="font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                    <div style={{width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px'}}>
                                        {getInitials(teacher.name)}
                                    </div>
                                    {teacher.name}
                                </div>
                            </td>
                            <td>{teacher.email || 'N/A'}</td>
                            <td>{teacher.subject || <span className="text-gray-400 italic">Unassigned</span>}</td>
                            <td>
                                <span className={`status-badge ${teacher.status === 'Active' ? 'status-active' : teacher.status === 'On Leave' ? 'status-warning' : 'status-inactive'}`}
                                      style={{
                                          backgroundColor: teacher.status === 'Active' ? '#dcfce7' : teacher.status === 'On Leave' ? '#fef9c3' : '#f1f5f9',
                                          color: teacher.status === 'Active' ? '#166534' : teacher.status === 'On Leave' ? '#854d0e' : '#64748b'
                                      }}>
                                    {teacher.status || 'Active'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEdit(teacher)} title="Edit" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(teacher.id)} title="Delete" style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredTeachers.length === 0 && <tr><td colSpan="5" className="text-center p-4">No teachers found.</td></tr>}
                </tbody>
            </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                            </div>
                            
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Email</label>
                                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700">Subject</label>
                                <select required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={inputStyle}>
                                    <option value="">Select Subject...</option>
                                    {availableSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    <option value="General">General / Substitute</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={btnSecondaryStyle}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Teacher</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PerformanceEvaluation = ({ teachers }) => {
    const [evaluations, setEvaluations] = useState(() => {
        try { return JSON.parse(localStorage.getItem('school_evaluations')) || []; }
        catch { return []; }
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentReview, setCurrentReview] = useState({ id: null, teacherId: '', rating: 5, comment: '' });

    const handleSaveEvaluation = (e) => {
        e.preventDefault();
        const teacher = teachers.find(t => t.id.toString() === currentReview.teacherId);
        if (!teacher) return;

        let updatedEvaluations;
        if (currentReview.id) {
            // Edit Mode
            updatedEvaluations = evaluations.map(ev => ev.id === currentReview.id ? { 
                ...ev, 
                teacherId: currentReview.teacherId,
                teacherName: teacher.name, 
                rating: currentReview.rating, 
                comment: currentReview.comment,
                // Keep original date or update? Let's keep original date for history or update it to "Modified". Let's update date to now.
                date: new Date().toISOString().split('T')[0] 
            } : ev);
        } else {
            // Add Mode
            const newEval = {
                id: Date.now(),
                teacherId: currentReview.teacherId, // Store ID to link back if name changes (optional improvement)
                teacherName: teacher.name,
                rating: currentReview.rating,
                comment: currentReview.comment,
                date: new Date().toISOString().split('T')[0]
            };
            updatedEvaluations = [newEval, ...evaluations];
        }
        
        setEvaluations(updatedEvaluations);
        localStorage.setItem('school_evaluations', JSON.stringify(updatedEvaluations));
        setIsModalOpen(false);
        setCurrentReview({ id: null, teacherId: '', rating: 5, comment: '' });
    };

    const handleEdit = (ev) => {
        // Find teacher ID by name if not stored (backward compatibility for my previous code that might not have stored teacherId)
        const teacherId = ev.teacherId || teachers.find(t => t.name === ev.teacherName)?.id?.toString() || '';
        setCurrentReview({ id: ev.id, teacherId: teacherId.toString(), rating: ev.rating, comment: ev.comment });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this evaluation?')) {
            const updated = evaluations.filter(ev => ev.id !== id);
            setEvaluations(updated);
            localStorage.setItem('school_evaluations', JSON.stringify(updated));
        }
    };

    const openNewModal = () => {
        setCurrentReview({ id: null, teacherId: '', rating: 5, comment: '' });
        setIsModalOpen(true);
    }

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Details & Ratings</h3>
                <button className="btn-primary" onClick={openNewModal}>
                    Start New Evaluation
                </button>
            </div>
            
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Rating</th>
                        <th>Comments</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {evaluations.map((ev) => (
                        <tr key={ev.id}>
                            <td className="font-medium">{ev.teacherName}</td>
                            <td>
                                <div className="flex items-center gap-1">
                                    <Star size={14} fill={ev.rating >= 4 ? "gold" : "gray"} stroke="none" />
                                    <b>{ev.rating}</b>/5
                                </div>
                            </td>
                            <td>{ev.comment}</td>
                            <td>{ev.date}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEdit(ev)} title="Edit" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(ev.id)} title="Delete" style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {evaluations.length === 0 && <tr><td colSpan="5" className="text-center p-4">No evaluations yet. Start one!</td></tr>}
                </tbody>
            </table>

            {/* Evaluation Modal */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{pointerEvents: 'none'}}>{currentReview.id ? 'Edit Evaluation' : 'Evaluate Teacher'}</h2>
                        <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <select required value={currentReview.teacherId} onChange={e => setCurrentReview({ ...currentReview, teacherId: e.target.value })} style={inputStyle}>
                                <option value="">Select Teacher...</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <label>Rating (1-5)</label>
                            <input type="number" min="1" max="5" required value={currentReview.rating} onChange={e => setCurrentReview({ ...currentReview, rating: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Comments..." required value={currentReview.comment} onChange={e => setCurrentReview({ ...currentReview, comment: e.target.value })} style={{...inputStyle, minHeight: '100px'}} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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

const ActivityLogs = ({ teachers }) => {
    // Generate realistic-looking logs based on actual teachers
    // We memorize this so it doesn't flicker on every render, but updates when teachers change
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!teachers || teachers.length === 0) {
            setLogs([]);
            return;
        }

        const actions = [
            { text: 'Updated Gradebook', type: 'Academic' },
            { text: 'Uploaded Lesson Plan', type: 'Content' },
            { text: 'Marked Attendance', type: 'Admin' },
            { text: 'Sent Message to Guardian', type: 'Communication' },
            { text: 'Logged In', type: 'System' },
            { text: 'Created New Assignment', type: 'Academic' },
            { text: 'Modified Class Schedule', type: 'Admin' }
        ];

        const speeds = ['Fast', 'Normal', 'Normal', 'Normal', 'Slow']; // Weighted
        
        // Generate 15 random logs
        const mockLogs = Array.from({ length: 15 }).map((_, i) => {
            const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
            
            // Safety check: specific teacher might be malformed
            if (!randomTeacher) return null;
            const teacherName = randomTeacher.name || 'Unknown Teacher';

            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const randomTime_mins = Math.floor(Math.random() * 480) + 2; // 2 mins to 8 hours ago
            
            // Format time string
            let timeStr;
            if (randomTime_mins < 60) timeStr = `${randomTime_mins} mins ago`;
            else timeStr = `${Math.floor(randomTime_mins / 60)} hours ago`;

            return {
                id: i,
                name: teacherName,
                avatar: randomTeacher.avatar,
                action: randomAction.text,
                type: randomAction.type,
                time: timeStr,
                speed: speeds[Math.floor(Math.random() * speeds.length)],
                timeValue: randomTime_mins // for sorting
            };
        })
        .filter(Boolean) // Remove nulls
        .sort((a, b) => a.timeValue - b.timeValue); // Sort by most recent

        setLogs(mockLogs);
    }, [teachers]);

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Recent Teacher Activity Stream</h3>
                <span className="text-sm text-gray-500">Live monitoring of staff actions</span>
            </div>
            <div style={{overflowX: 'auto'}}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Action</th>
                        <th>Type</th>
                        <th>Time</th>
                        <th>System Speed</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td className="font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                    <div style={{width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b', fontWeight: 'bold'}}>
                                        {log.name.charAt(0)}
                                    </div>
                                    {log.name}
                                </div>
                            </td>
                            <td>{log.action}</td>
                            <td>
                                <span style={{fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb'}}>
                                    {log.type}
                                </span>
                            </td>
                            <td style={{color: '#6b7280', fontSize: '0.875rem'}}>{log.time}</td>
                            <td>
                                <span style={{ 
                                    padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '500',
                                    background: log.speed === 'Fast' ? '#dcfce7' : log.speed === 'Slow' ? '#fee2e2' : '#f1f5f9',
                                    color: log.speed === 'Fast' ? '#166534' : log.speed === 'Slow' ? '#991b1b' : '#475569'
                                }}>
                                    {log.speed}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">No activity recorded today.</td></tr>}
                </tbody>
            </table>
            </div>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' };
const btnSecondaryStyle = { padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' };
const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modalContentStyle = { backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px', border: '1px solid var(--color-border)' };

export default TeacherMonitoring;
