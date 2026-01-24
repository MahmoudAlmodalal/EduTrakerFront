import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, Paperclip, MoreVertical, Trash2, Edit2, Save, X, Download, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LessonPlans = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'resources'
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Core Data
    const [classes, setClasses] = useState([]);
    const [plans, setPlans] = useState([]);
    const [resources, setResources] = useState([]);

    // Load Initial Data
    useEffect(() => {
        // Classes
        const storedClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
        const classNames = storedClasses.length > 0 ? storedClasses.map(c => c.name) : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
        setClasses(classNames);

        // Plans
        const storedPlans = JSON.parse(localStorage.getItem('teacher_lesson_plans') || '[]');
        if (storedPlans.length === 0) {
             const seeds = [
                { id: 1, title: 'Introduction to Algebra', date: '2025-12-16', class: 'Grade 10-A', content: 'algebra_intro.pdf', objectives: 'Understand variables and constants.' },
                { id: 2, title: 'Newton\'s Laws of Motion', date: '2025-12-18', class: 'Grade 11-B', content: 'physics_ch3.ppt', objectives: 'Explain the three laws of motion.' }
            ];
            setPlans(seeds);
            localStorage.setItem('teacher_lesson_plans', JSON.stringify(seeds));
        } else {
            setPlans(storedPlans);
        }

        // Resources
        const storedResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
        if (storedResources.length === 0) {
            const resSeeds = [
                { id: 1, title: 'Mathematics Syllabus 2025', type: 'PDF', size: '2.4 MB', date: '2025-12-01' },
                { id: 2, title: 'Physics Formula Sheet', type: 'PDF', size: '15.8 MB', date: '2025-11-20' },
            ];
            setResources(resSeeds);
            localStorage.setItem('teacher_resources', JSON.stringify(resSeeds));
        } else {
            setResources(storedResources);
        }
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        class: '',
        date: '',
        objectives: '',
        content: '',
        file: null // For simulate upload
    });

    const handleStartCreate = () => {
        setFormData({ title: '', class: classes[0] || 'Grade 10-A', date: '', objectives: '', content: '', file: null });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleStartEdit = (plan) => {
        setFormData({ ...plan, file: null });
        setIsCreating(true);
        setEditingId(plan.id);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Limit file size to 500KB for localStorage demo
            if (file.size > 500 * 1024) {
                alert("For this prototype, file size is limited to 500KB to save to browser storage.");
                e.target.value = ""; // Clear input
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                // Auto-fill title if empty
                const fileNameNoExt = file.name.split('.').slice(0, -1).join('.') || file.name;
                const newTitle = formData.title ? formData.title : fileNameNoExt;

                setFormData({ 
                    ...formData, 
                    title: newTitle,
                    file: file, 
                    content: file.name,
                    fileData: event.target.result // Store Base64 string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        
        if (activeTab === 'plans') {
            let updatedPlans;
            if (editingId) {
                updatedPlans = plans.map(p => p.id === editingId ? { ...formData, file: undefined, fileData: undefined, id: editingId } : p);
                alert(`Lesson Plan updated successfully!`);
            } else {
                const newPlan = { 
                    ...formData, 
                    id: Date.now(), 
                    content: formData.content || 'untitled_doc.pdf',
                    file: undefined,
                    fileData: formData.fileData // Save the actual file content for Plans too
                };
                updatedPlans = [newPlan, ...plans];
                alert(`Lesson Plan created successfully!`);
            }
            setPlans(updatedPlans);
            localStorage.setItem('teacher_lesson_plans', JSON.stringify(updatedPlans));
        } else {
            // Saving Resource
            const newRes = {
                id: Date.now(),
                title: formData.title,
                type: formData.content.split('.').pop().toUpperCase() || 'FILE',
                size: (formData.file ? (formData.file.size / 1024 / 1024).toFixed(2) : '0.01') + ' MB',
                date: new Date().toISOString().split('T')[0],
                fileData: formData.fileData // Save the actual file content
            };
            const updatedRes = [newRes, ...resources];
            setResources(updatedRes);
            localStorage.setItem('teacher_resources', JSON.stringify(updatedRes));
            alert(`Resource uploaded successfully!`);
        }

        setIsCreating(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            if (activeTab === 'plans') {
                const updated = plans.filter(p => p.id !== id);
                setPlans(updated);
                localStorage.setItem('teacher_lesson_plans', JSON.stringify(updated));
            } else {
                const updated = resources.filter(r => r.id !== id);
                setResources(updated);
                localStorage.setItem('teacher_resources', JSON.stringify(updated));
            }
        }
    };

    const handleViewFile = (plan) => {
        if (plan.fileData) {
            const element = document.createElement("a");
            element.href = plan.fileData; // Base64 data
            element.download = plan.content; // Use stored filename
            document.body.appendChild(element); 
            element.click();
            document.body.removeChild(element);
        } else {
            alert(`Simulating opening file: ${plan.content}\n\n(This is a demo item without a real file attached. Create a new plan with a file to test download.)`);
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
                    onClick={() => { setActiveTab('plans'); setIsCreating(false); }}
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
                    onClick={() => { setActiveTab('resources'); setIsCreating(false); }}
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
                                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
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
                            <div style={{ border: '2px dashed var(--teacher-border)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', color: 'var(--teacher-text-muted)', position: 'relative' }}>
                                <input 
                                    type="file" 
                                    onChange={handleFileChange}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                                    }}
                                />
                                <Paperclip className="mx-auto mb-2" size={24} />
                                <p className="text-sm">{formData.content ? `Selected: ${formData.content}` : t('teacher.lessonPlans.uploadHint')}</p>
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
                                    onClick={() => handleStartEdit(plan)}
                                >
                                    <Edit2 size={18} style={{color: 'var(--teacher-primary)'}} />
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
                                    onClick={() => handleViewFile(plan)}
                                    style={{ fontSize: '0.75rem', color: 'var(--teacher-primary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                >
                                    {t('teacher.lessonPlans.view')}
                                </button>
                            </div>

                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--teacher-border)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="icon-btn danger"
                                    style={{ justifyContent: 'center', border: 'none' }}
                                    title="Delete Plan"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && <p className="col-span-full text-center text-slate-500">No lesson plans found.</p>}
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
                                        <td className="font-bold text-slate-800" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            <FileText size={16} className="text-slate-400"/>
                                            {res.title}
                                        </td>
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
                                                    className="icon-btn success"
                                                    style={{ border: 'none', backgroundColor: '#F0FDF4', color: '#15803D' }}
                                                    onClick={() => {
                                                        if (res.fileData) {
                                                            const element = document.createElement("a");
                                                            element.href = res.fileData; // Base64 data
                                                            element.download = res.title + (res.title.includes('.') ? '' : '.txt'); // Fallback extension
                                                            document.body.appendChild(element); 
                                                            element.click();
                                                            document.body.removeChild(element);
                                                        } else {
                                                            alert("This is a demo file. Only newly uploaded files can be downloaded with content.");
                                                        }
                                                    }}
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(res.id)} className="icon-btn danger" style={{ border: 'none' }} title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {resources.length === 0 && (
                                    <tr><td colSpan="5" className="text-center p-4 text-slate-500">No resources uploaded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonPlans;
