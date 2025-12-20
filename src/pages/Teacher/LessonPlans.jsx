import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, Paperclip, MoreVertical, Trash2, Edit2, Save, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LessonPlans = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('plans');
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [plans, setPlans] = useState([
        { id: 1, title: 'Introduction to Algebra', date: '2025-12-16', class: 'Grade 10-A', content: 'algebra_intro.pdf', objectives: 'Understand variables and constants.' },
        { id: 2, title: 'Newton\'s Laws of Motion', date: '2025-12-18', class: 'Grade 11-B', content: 'physics_ch3.ppt', objectives: 'Explain the three laws of motion.' },
        { id: 3, title: 'Quadratic Equations', date: '2025-12-20', class: 'Grade 10-B', content: 'worksheet_4.docx', objectives: 'Solve quadratic equations by factoring.' },
    ]);

    const [resources, setResources] = useState([
        { id: 1, title: 'Mathematics Syllabus 2025', type: 'PDF', size: '2.4 MB', date: '2025-12-01' },
        { id: 2, title: 'Physics Textbook - Part 1', type: 'PDF', size: '15.8 MB', date: '2025-11-20' },
        { id: 3, title: 'Exam Guidelines', type: 'DOCX', size: '500 KB', date: '2025-12-10' },
    ]);

    const [formData, setFormData] = useState({
        title: '',
        class: 'Grade 10-A',
        date: '',
        objectives: '',
        content: ''
    });

    const handleStartCreate = () => {
        setFormData({ title: '', class: 'Grade 10-A', date: '', objectives: '', content: '' });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleStartEdit = (plan) => {
        setFormData({ ...plan });
        setIsCreating(true);
        setEditingId(plan.id);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (activeTab === 'plans') {
            if (editingId) {
                setPlans(plans.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
                alert(`Lesson Plan "${formData.title}" updated successfully!`);
            } else {
                const newPlan = { ...formData, id: plans.length + 1, content: formData.content || 'new_file.pdf' };
                setPlans([...plans, newPlan]);
                alert(`Lesson Plan "${formData.title}" created successfully!`);
            }
        } else {
            const newRes = {
                id: resources.length + 1,
                title: formData.title,
                type: 'PDF',
                size: '1.0 MB',
                date: new Date().toISOString().split('T')[0]
            };
            setResources([newRes, ...resources]);
            alert(`Resource "${formData.title}" uploaded successfully!`);
        }
        setIsCreating(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this?')) {
            if (activeTab === 'plans') {
                setPlans(plans.filter(p => p.id !== id));
            } else {
                setResources(resources.filter(r => r.id !== id));
            }
        }
    };

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

                        {activeTab === 'plans' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.forClass')}</label>
                                        <select
                                            value={formData.class}
                                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                            className="teacher-select w-full"
                                        >
                                            <option>Grade 10-A</option>
                                            <option>Grade 10-B</option>
                                            <option>Grade 11-A</option>
                                            <option>Grade 11-B</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.date')}</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                                    ></textarea>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.lessonPlans.uploadFile')}</label>
                            <div style={{ border: '2px dashed var(--teacher-border)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', color: 'var(--teacher-text-muted)' }}>
                                <Paperclip className="mx-auto mb-2" size={24} />
                                <p className="text-sm">{t('teacher.lessonPlans.uploadHint')}</p>
                                <p className="text-xs">{t('teacher.lessonPlans.fileTypes')}</p>
                            </div>
                        </div>

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
                                <button
                                    className="icon-btn"
                                    style={{ border: 'none' }}
                                    onClick={() => alert(`Options for: ${plan.title}`)}
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>
                                    <Calendar size={16} style={{ color: 'var(--teacher-primary)' }} />
                                    <span>{plan.date}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>
                                    <BookOpen size={16} style={{ color: 'var(--teacher-accent)' }} />
                                    <span>{plan.class}</span>
                                </div>
                            </div>

                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--teacher-bg)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                    <Paperclip size={16} className="flex-shrink-0" style={{ color: 'var(--teacher-text-muted)' }} />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--teacher-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.content}</span>
                                </div>
                                <button
                                    onClick={() => alert(`Opening file: ${plan.content}`)}
                                    style={{ fontSize: '0.75rem', color: 'var(--teacher-primary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                >
                                    {t('teacher.lessonPlans.view')}
                                </button>
                            </div>

                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--teacher-border)', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleStartEdit(plan)}
                                    className="icon-btn"
                                    style={{ flex: 1, justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Edit2 size={16} /> {t('teacher.lessonPlans.edit')}
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="icon-btn danger"
                                    style={{ flex: 1, justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Trash2 size={16} /> {t('teacher.lessonPlans.delete')}
                                </button>
                            </div>
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
                                    <th>{t('teacher.lessonPlans.resourceTable.type')}</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.size')}</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.date')}</th>
                                    <th>{t('teacher.lessonPlans.resourceTable.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map((res) => (
                                    <tr key={res.id}>
                                        <td className="font-bold text-slate-800">{res.title}</td>
                                        <td>
                                            <span className="status-badge info">
                                                {res.type}
                                            </span>
                                        </td>
                                        <td className="text-slate-500">{res.size}</td>
                                        <td className="text-slate-500">{res.date}</td>
                                        <td>
                                            <div className="action-group">
                                                <button
                                                    className="text-sm font-medium"
                                                    style={{ color: 'var(--teacher-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    onClick={() => alert(`Downloading: ${res.title}`)}
                                                >
                                                    {t('teacher.lessonPlans.download')}
                                                </button>
                                                <button onClick={() => handleDelete(res.id)} className="icon-btn danger" style={{ border: 'none' }}><Trash2 size={18} /></button>
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
