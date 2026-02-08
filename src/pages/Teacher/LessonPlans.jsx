import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, Paperclip, MoreVertical, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const LessonPlans = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans');
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [plans, setPlans] = useState([]);
    const [resources, setResources] = useState([]);
    const [allocations, setAllocations] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        classroom_id: '',
        course_id: '',
        academic_year_id: 1, // Fallback
        date_planned: '',
        objectives: '',
        content: '',
        is_published: true,
        // Resource specific
        description: '',
        file_url: '',
        file_type: 'PDF',
        file_size: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [plansData, materialsData, scheduleData] = await Promise.all([
                    teacherService.getLessonPlans(),
                    teacherService.getLearningMaterials(),
                    teacherService.getSchedule()
                ]);
                setPlans(plansData.results || plansData || []);
                setResources(materialsData.results || materialsData || []);
                setAllocations(scheduleData.results || scheduleData || []);
            } catch (error) {
                console.error("Error fetching lesson plans data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleStartCreate = () => {
        setFormData({
            title: '',
            classroom_id: allocations.length > 0 ? allocations[0].class_room_id : '',
            course_id: allocations.length > 0 ? allocations[0].course_id : '',
            academic_year_id: allocations.length > 0 ? allocations[0].academic_year_id : 1,
            date_planned: new Date().toISOString().split('T')[0],
            objectives: '',
            content: '',
            is_published: true,
            description: '',
            file_url: 'https://example.com/placeholder.pdf', // Mock URL for now as requested
            file_type: 'PDF',
            file_size: 1024 * 1024
        });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleStartEdit = (plan) => {
        setFormData({
            ...plan,
            classroom_id: plan.classroom,
            course_id: plan.course,
            academic_year_id: plan.academic_year
        });
        setIsCreating(true);
        setEditingId(plan.id);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'plans') {
                const payload = {
                    title: formData.title,
                    content: formData.content,
                    objectives: formData.objectives,
                    date_planned: formData.date_planned,
                    is_published: formData.is_published,
                    teacher: user.user_id,
                    classroom: parseInt(formData.classroom_id),
                    course: parseInt(formData.course_id),
                    academic_year: parseInt(formData.academic_year_id) || 1
                };

                if (editingId) {
                    const updated = await teacherService.updateLessonPlan(editingId, payload);
                    setPlans(plans.map(p => p.id === editingId ? updated : p));
                    alert(`Lesson Plan "${formData.title}" updated successfully!`);
                } else {
                    const created = await teacherService.createLessonPlan(payload);
                    setPlans([created, ...plans]);
                    alert(`Lesson Plan "${formData.title}" created successfully!`);
                }
            } else {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    file_url: formData.file_url,
                    file_type: formData.file_type,
                    file_size: formData.file_size,
                    classroom: parseInt(formData.classroom_id),
                    course: parseInt(formData.course_id),
                    academic_year: parseInt(formData.academic_year_id) || 1
                };
                const created = await teacherService.createLearningMaterial(payload);
                setResources([created, ...resources]);
                alert(`Resource "${formData.title}" uploaded successfully!`);
            }
            setIsCreating(false);
            setEditingId(null);
        } catch (error) {
            console.error("Error saving lesson plan/resource:", error);
            alert("Failed to save. Please check all fields.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this?')) {
            try {
                if (activeTab === 'plans') {
                    await teacherService.deleteLessonPlan(id);
                    setPlans(plans.filter(p => p.id !== id));
                } else {
                    await teacherService.deleteLearningMaterial(id);
                    setResources(resources.filter(r => r.id !== id));
                }
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-teacher-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('teacher.lessonPlans.title')}</h1>
                    <p className="page-subtitle">{t('teacher.lessonPlans.subtitle')}</p>
                </div>
                <div className="action-group">
                    <button
                        onClick={handleStartCreate}
                        className="btn-primary"
                    >
                        <Plus size={20} />
                        {activeTab === 'plans' ? t('teacher.lessonPlans.newPlan') : t('teacher.lessonPlans.uploadResource')}
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--teacher-border)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('plans')}
                    style={{
                        padding: '0.75rem 1rem',
                        fontWeight: '500',
                        color: activeTab === 'plans' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                        borderBottom: activeTab === 'plans' ? '2px solid var(--teacher-primary)' : '2px solid transparent',
                        background: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('teacher.lessonPlans.plans')}
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    style={{
                        padding: '0.75rem 1rem',
                        fontWeight: '500',
                        color: activeTab === 'resources' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                        borderBottom: activeTab === 'resources' ? '2px solid var(--teacher-primary)' : '2px solid transparent',
                        background: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('teacher.lessonPlans.resources')}
                </button>
            </div>

            {isCreating && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 className="text-lg font-bold text-slate-800">
                            {activeTab === 'plans'
                                ? (editingId ? t('teacher.lessonPlans.editPlan') : t('teacher.lessonPlans.createPlan'))
                                : t('teacher.lessonPlans.uploadRes')
                            }
                        </h2>
                        <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teacher-text-muted)' }}><X size={20} /></button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSave}>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">
                                {activeTab === 'plans' ? t('teacher.lessonPlans.topic') : t('teacher.lessonPlans.resourceName')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={activeTab === 'plans' ? 'e.g. Photosynthesis' : 'e.g. Syllabus 2025'}
                                className="teacher-input w-full"
                            />
                        </div>

                        {activeTab === 'plans' ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.forClass')}</label>
                                        <select
                                            required
                                            value={formData.classroom_id}
                                            onChange={(e) => {
                                                const alloc = allocations.find(a => a.class_room_id === parseInt(e.target.value));
                                                setFormData({
                                                    ...formData,
                                                    classroom_id: e.target.value,
                                                    course_id: alloc ? alloc.course_id : formData.course_id,
                                                    academic_year_id: alloc ? alloc.academic_year_id : formData.academic_year_id
                                                });
                                            }}
                                            className="teacher-select w-full"
                                        >
                                            <option value="">Select Class</option>
                                            {allocations.map(a => (
                                                <option key={a.id} value={a.class_room_id}>
                                                    {a.classroom_name} - {a.course_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.date')}</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_planned}
                                            onChange={(e) => setFormData({ ...formData, date_planned: e.target.value })}
                                            className="teacher-input w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.objectives')}</label>
                                    <textarea
                                        rows="3"
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                                        className="teacher-input w-full"
                                        placeholder="What should students learn?"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.content')}</label>
                                    <textarea
                                        rows="5"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="teacher-input w-full"
                                        placeholder="Detailed steps and content..."
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Class & Course</label>
                                        <select
                                            required
                                            value={formData.classroom_id}
                                            onChange={(e) => {
                                                const alloc = allocations.find(a => a.class_room_id === parseInt(e.target.value));
                                                setFormData({
                                                    ...formData,
                                                    classroom_id: e.target.value,
                                                    course_id: alloc ? alloc.course_id : formData.course_id,
                                                    academic_year_id: alloc ? alloc.academic_year_id : formData.academic_year_id
                                                });
                                            }}
                                            className="teacher-select w-full"
                                        >
                                            <option value="">Select Class & Course</option>
                                            {allocations.map(a => (
                                                <option key={a.id} value={a.class_room_id}>
                                                    {a.classroom_name} - {a.course_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">File URL</label>
                                        <input
                                            type="url"
                                            required
                                            value={formData.file_url}
                                            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                            placeholder="https://..."
                                            className="teacher-input w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.description') || 'Description'}</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="teacher-input w-full"
                                        placeholder="Enter resource description..."
                                    ></textarea>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>{t('teacher.assessments.cancel')}</button>
                            <button type="submit" className="btn-primary">
                                <Save size={18} /> {activeTab === 'plans' ? t('teacher.lessonPlans.savePlan') : t('teacher.lessonPlans.upload')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'plans' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{plan.title}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleStartEdit(plan)}
                                        className="icon-btn"
                                        title="Edit"
                                        style={{ border: 'none', padding: '4px' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="icon-btn danger"
                                        title="Delete"
                                        style={{ border: 'none', padding: '4px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>
                                    <Calendar size={16} style={{ color: 'var(--teacher-primary)' }} />
                                    <span>{plan.date_planned}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>
                                    <BookOpen size={16} style={{ color: 'var(--teacher-accent)' }} />
                                    <span>{plan.classroom_name} - {plan.course_name}</span>
                                </div>
                            </div>

                            {plan.objectives && (
                                <p className="text-sm text-slate-600 line-clamp-2" style={{ borderTop: '1px solid var(--teacher-border)', paddingTop: '0.5rem' }}>
                                    <strong>Obj:</strong> {plan.objectives}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel">
                    <div className="table-container">
                        <table className="teacher-table">
                            <thead>
                                <tr>
                                    <th>{t('teacher.lessonPlans.resourceTable.name')}</th>
                                    <th>Course / Class</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.type')}</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.date')}</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map((res) => (
                                    <tr key={res.id}>
                                        <td className="font-bold text-slate-800">
                                            <div>{res.title}</div>
                                            <div className="text-xs font-normal text-slate-500">{res.description}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium">{res.course_name}</div>
                                            <div className="text-xs text-slate-500">{res.classroom_name}</div>
                                        </td>
                                        <td>
                                            <span className="status-badge info">
                                                {res.file_type || 'PDF'}
                                            </span>
                                        </td>
                                        <td className="text-slate-500">{new Date(res.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className="icon-btn"
                                                    style={{ border: 'none', cursor: 'pointer', color: 'var(--teacher-primary)' }}
                                                    onClick={() => window.open(res.file_url, '_blank')}
                                                    title="View"
                                                >
                                                    <Paperclip size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(res.id)}
                                                    className="icon-btn danger"
                                                    style={{ border: 'none' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
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

export default LessonPlans;
