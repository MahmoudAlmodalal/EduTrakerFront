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
    Edit,
    Trash
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import './SchoolManager.css';

const TeacherMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('directory');
    const [teachers, setTeachers] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    const schoolId = user?.school;

    useEffect(() => {
        const fetchData = async () => {
            if (!schoolId) return;
            setLoading(true);
            try {
                const [teachersData, evaluationsData] = await Promise.all([
                    api.get(`/teacher/teachers/`),
                    api.get('/manager/staff-evaluations/')
                ]);
                setTeachers(teachersData.results || teachersData);
                setEvaluations(evaluationsData.results || evaluationsData);
            } catch (error) {
                console.error('Failed to fetch teacher monitoring data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [schoolId]);

    const renderTabContent = () => {
        if (loading) return <div>Loading...</div>;
        switch (activeTab) {
            case 'directory':
                return <TeacherDirectory teachers={teachers} setTeachers={setTeachers} t={t} />;
            case 'performance':
                return <PerformanceEvaluation evaluations={evaluations} setEvaluations={setEvaluations} teachers={teachers} t={t} />;
            case 'activity':
                return <ActivityLogs teachers={teachers} t={t} />;
            default:
                return <TeacherDirectory teachers={teachers} setTeachers={setTeachers} t={t} />;
        }
    };

    return (
        <div className="teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.teachers.title')}</h1>
                <p className="school-manager-subtitle">{t('school.teachers.subtitle')}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <button
                    className={`pb-2 px-1 ${activeTab === 'directory' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'directory' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'directory' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('directory')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        {t('school.teachers.directory')}
                    </div>
                </button>
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
                        <Star size={18} />
                        {t('school.teachers.performance')}
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'activity' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'activity' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'activity' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('activity')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} />
                        Activities
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
const TeacherDirectory = ({ teachers, setTeachers, t }) => {
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this teacher?')) {
            try {
                await api.post(`/teacher/teachers/${id}/deactivate/`);
                setTeachers(teachers.filter(t => t.id !== id));
            } catch (error) {
                console.error('Failed to deactivate teacher:', error);
            }
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td className="font-medium text-gray-900">{teacher.full_name}</td>
                            <td>{teacher.email}</td>
                            <td>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    background: teacher.is_active ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                    color: teacher.is_active ? 'var(--color-success)' : 'var(--color-error)'
                                }}>
                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleDelete(teacher.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PerformanceEvaluation = ({ evaluations, setEvaluations, teachers, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ staff_id: '', score: 5, comments: '' });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/manager/staff-evaluations/create/', formData);
            setEvaluations([...evaluations, response]);
            setIsModalOpen(false);
            setFormData({ staff_id: '', score: 5, comments: '' });
        } catch (error) {
            console.error('Failed to create evaluation:', error);
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Latest Evaluations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    New Evaluation
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Score</th>
                        <th>Comments</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {evaluations.map((evalItem) => (
                        <tr key={evalItem.id}>
                            <td className="font-medium text-gray-900">{evalItem.staff_name}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Star size={16} fill="gold" stroke="gold" />
                                    <span style={{ fontWeight: 'bold' }}>{evalItem.score}</span>
                                </div>
                            </td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {evalItem.comments}
                            </td>
                            <td>{new Date(evalItem.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>New Staff Evaluation</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Staff</label>
                                <select
                                    required
                                    value={formData.staff_id}
                                    onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                >
                                    <option value="">Select Staff Member</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Score (1-10)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    required
                                    value={formData.score}
                                    onChange={e => setFormData({ ...formData, score: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Comments</label>
                                <textarea
                                    required
                                    value={formData.comments}
                                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', minHeight: '100px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Evaluation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActivityLogs = ({ teachers, t }) => {
    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Teacher Presence</h3>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Email</th>
                        <th>Last Login</th>
                        <th>Join Date</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td className="font-medium text-gray-900">{teacher.full_name}</td>
                            <td>{teacher.email}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} className="text-gray-400" />
                                    {teacher.last_login ? new Date(teacher.last_login).toLocaleString() : 'Never'}
                                </div>
                            </td>
                            <td>{new Date(teacher.date_joined).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherMonitoring;

