import React, { useState, useEffect } from 'react';
import {
    Users,
    Star,
    Award,
    Activity,
    Clock,
    Search,
    Plus,
    Mail,
    UserCheck,
    UserX,
    Trash2,
    Edit
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import SearchableSelect from '../../components/ui/SearchableSelect';
import './SchoolManager.css';

const TeacherMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('directory');
    const [teachers, setTeachers] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    const schoolId = user?.school_id || user?.school?.id || user?.school;

    useEffect(() => {
        const fetchData = async () => {
            if (!schoolId) {
                console.warn('No school ID found for user');
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [teachersData, evaluationsData] = await Promise.all([
                    managerService.getTeachers(),
                    managerService.getStaffEvaluations()
                ]);
                setTeachers(teachersData.results || teachersData || []);
                setEvaluations(evaluationsData.results || evaluationsData || []);
            } catch (error) {
                console.error('Failed to fetch teacher monitoring data:', error);
                setTeachers([]);
                setEvaluations([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [schoolId]);

    const fetchEvaluations = async () => {
        try {
            const data = await managerService.getStaffEvaluations();
            setEvaluations(data.results || data);
        } catch (error) {
            console.error('Failed to fetch evaluations:', error);
        }
    }

    const renderTabContent = () => {
        if (loading) return <div>Loading...</div>;
        switch (activeTab) {
            case 'directory':
                return <TeacherDirectory teachers={teachers} setTeachers={setTeachers} t={t} />;
            case 'performance':
                return <PerformanceEvaluation evaluations={evaluations} onEvaluationAdded={fetchEvaluations} teachers={teachers} t={t} />;
            case 'activity':
                return <ActivityLogs teachers={teachers} t={t} />;
            default:
                return <TeacherDirectory teachers={teachers} setTeachers={setTeachers} t={t} />;
        }
    };

    const tabs = [
        { id: 'directory', label: t('school.teachers.directory') || 'Directory', icon: Users },
        { id: 'performance', label: t('school.teachers.performance') || 'Performance', icon: Star },
        { id: 'activity', label: 'Activity Log', icon: Activity },
    ];

    return (
        <div className="teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.teachers.title') || 'Teacher Monitoring'}</h1>
            </div>

            {/* Enhanced Pill-Style Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                padding: '0.25rem',
                backgroundColor: 'var(--color-bg-muted)',
                borderRadius: '0.5rem',
                width: 'fit-content'
            }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease',
                                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                                color: isActive ? 'white' : 'var(--color-text-muted)',
                                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                            }}
                        >
                            <Icon size={18} strokeWidth={2} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Sub-components
const TeacherDirectory = ({ teachers, setTeachers, t }) => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: 'Teacher@123',
        specialization: '',
        employment_status: 'full_time',
        hire_date: new Date().toISOString().split('T')[0]
    });

    const handleDeactivate = async (teacher) => {
        const id = teacher.user_id || teacher.id;
        const name = teacher.full_name || teacher.name || 'this teacher';
        if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
        try {
            await managerService.deactivateTeacher(id);
            const response = await managerService.getTeachers();
            setTeachers(response.results || response || []);
        } catch (error) {
            console.error('Failed to deactivate teacher:', error);
            alert('Failed to deactivate teacher.');
        }
    };

    const handleActivate = async (teacher) => {
        const id = teacher.user_id || teacher.id;
        try {
            await managerService.activateTeacher(id);
            const response = await managerService.getTeachers();
            setTeachers(response.results || response || []);
        } catch (error) {
            console.error('Failed to activate teacher:', error);
            alert('Failed to activate teacher.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const resolvedSchoolId = user?.school_id || user?.school?.id ||
            (typeof user?.school === 'number' ? user.school : null) ||
            localStorage.getItem('school_id');

        if (!resolvedSchoolId) {
            alert('Error: School ID not found. Please log out and log in again.');
            return;
        }

        try {
            await managerService.createTeacher({
                email: formData.email,
                full_name: formData.full_name,
                password: formData.password,
                school_id: parseInt(resolvedSchoolId),
                specialization: formData.specialization,
                employment_status: formData.employment_status,
                hire_date: formData.hire_date,
            });

            const response = await managerService.getTeachers();
            setTeachers(response.results || response || []);
            setIsModalOpen(false);
            setFormData({
                full_name: '', email: '', password: 'Teacher@123',
                specialization: '', employment_status: 'full_time',
                hire_date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Failed to create teacher:', error);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Failed to create teacher: ${errorMsg}`);
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Teacher
                </button>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Specialization</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTeachers.map((teacher) => {
                        const id = teacher.user_id || teacher.id;
                        const isActive = teacher.is_active !== false;
                        return (
                            <tr key={id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '0.875rem'
                                        }}>
                                            {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                {teacher.full_name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {teacher.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: teacher.specialization ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                    {teacher.specialization || 'Not specified'}
                                </td>
                                <td>
                                    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {isActive ? (
                                            <button
                                                onClick={() => handleDeactivate(teacher)}
                                                title="Deactivate Teacher"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(teacher)}
                                                title="Activate Teacher"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-success)' }}
                                            >
                                                <UserCheck size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Create Teacher Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setFormData({
                        full_name: '', email: '', password: 'Teacher@123',
                        specialization: '', employment_status: 'full_time',
                        hire_date: new Date().toISOString().split('T')[0]
                    });
                }}
                title="Add New Teacher"
            >
                <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                        <input
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder="Enter teacher's full name"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder="teacher@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                        <input
                            required
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Specialization</label>
                        <input
                            value={formData.specialization}
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            placeholder="e.g., Mathematics, Science, English"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Employment Status</label>
                        <select
                            required
                            value={formData.employment_status}
                            onChange={e => setFormData({ ...formData, employment_status: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                        >
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="substitute">Substitute</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Hire Date</label>
                        <input
                            required
                            type="date"
                            value={formData.hire_date}
                            onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">Create Teacher</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const PerformanceEvaluation = ({ evaluations, onEvaluationAdded, teachers, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ reviewee_id: '', rating_score: 5, comments: '' });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await managerService.createStaffEvaluation({
                reviewee_id: parseInt(formData.reviewee_id),
                rating_score: parseInt(formData.rating_score),
                comments: formData.comments,
                evaluation_date: new Date().toISOString().split('T')[0]
            });
            onEvaluationAdded();
            setIsModalOpen(false);
            setFormData({ reviewee_id: '', rating_score: 5, comments: '' });
        } catch (error) {
            console.error('Failed to create evaluation:', error);
            alert('Failed to create evaluation');
        }
    };

    const renderStars = (score) => {
        const stars = [];
        for (let i = 1; i <= 10; i++) {
            stars.push(
                <Star
                    key={i}
                    size={14}
                    fill={i <= score ? '#fbbf24' : 'transparent'}
                    stroke={i <= score ? '#fbbf24' : '#d1d5db'}
                />
            );
        }
        return stars;
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Performance Evaluations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    New Evaluation
                </button>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Rating</th>
                        <th>Comments</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {evaluations.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No evaluations yet. Click "New Evaluation" to add one.
                            </td>
                        </tr>
                    ) : (
                        evaluations.map((evalItem) => (
                            <tr key={evalItem.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: '#fef3c7', color: '#d97706',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '0.75rem'
                                        }}>
                                            {(evalItem.reviewee_name || evalItem.reviewee_email)?.charAt(0)?.toUpperCase() || 'T'}
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{evalItem.reviewee_name || evalItem.reviewee_email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {renderStars(evalItem.rating_score)}
                                        </div>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: evalItem.rating_score >= 7 ? 'var(--color-success)' :
                                                   evalItem.rating_score >= 4 ? '#d97706' : 'var(--color-error)'
                                        }}>
                                            {evalItem.rating_score}/10
                                        </span>
                                    </div>
                                </td>
                                <td style={{ maxWidth: '300px' }}>
                                    <p style={{
                                        margin: 0, whiteSpace: 'nowrap', overflow: 'hidden',
                                        textOverflow: 'ellipsis', color: 'var(--color-text-muted)'
                                    }}>
                                        {evalItem.comments || 'No comments'}
                                    </p>
                                </td>
                                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    {new Date(evalItem.evaluation_date).toLocaleDateString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Evaluation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setFormData({ reviewee_id: '', rating_score: 5, comments: '' });
                }}
                title="New Staff Evaluation"
            >
                <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Select Teacher
                        </label>
                        <SearchableSelect
                            options={teachers.map(t => ({
                                value: t.user_id || t.id,
                                label: t.full_name
                            }))}
                            value={formData.reviewee_id}
                            onChange={(val) => setFormData({ ...formData, reviewee_id: val })}
                            placeholder="Select a teacher..."
                            searchPlaceholder="Search teachers..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Rating Score (1-10)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.rating_score}
                                onChange={e => setFormData({ ...formData, rating_score: e.target.value })}
                                style={{ flex: 1 }}
                            />
                            <span style={{
                                fontWeight: 'bold', fontSize: '1.25rem', minWidth: '40px', textAlign: 'center',
                                color: formData.rating_score >= 7 ? 'var(--color-success)' :
                                       formData.rating_score >= 4 ? '#d97706' : 'var(--color-error)'
                            }}>
                                {formData.rating_score}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Comments
                        </label>
                        <textarea
                            required
                            value={formData.comments}
                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                            placeholder="Enter evaluation comments..."
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)', minHeight: '100px', resize: 'vertical'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">Save Evaluation</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const ActivityLogs = ({ teachers, t }) => {
    const getLoginStatus = (lastLogin) => {
        if (!lastLogin) return { text: 'Never logged in', color: 'var(--color-text-muted)', bgColor: '#f3f4f6' };
        const lastLoginDate = new Date(lastLogin);
        const now = new Date();
        const diffDays = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { text: 'Today', color: 'var(--color-success)', bgColor: '#dcfce7' };
        if (diffDays <= 7) return { text: `${diffDays}d ago`, color: '#2563eb', bgColor: '#dbeafe' };
        if (diffDays <= 30) return { text: `${diffDays}d ago`, color: '#d97706', bgColor: '#fef3c7' };
        return { text: `${diffDays}d ago`, color: 'var(--color-error)', bgColor: '#fee2e2' };
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Teacher Activity & Presence</h3>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Last Login</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No teachers found.
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => {
                            const loginStatus = getLoginStatus(teacher.last_login);
                            return (
                                <tr key={teacher.id || teacher.user_id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '0.875rem'
                                            }}>
                                                {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                    {teacher.full_name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} /> {teacher.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={16} color="var(--color-text-muted)" />
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                                {teacher.last_login
                                                    ? new Date(teacher.last_login).toLocaleString()
                                                    : 'Never'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: loginStatus.bgColor,
                                            color: loginStatus.color
                                        }}>
                                            {loginStatus.text}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        {teacher.date_joined
                                            ? new Date(teacher.date_joined).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherMonitoring;

