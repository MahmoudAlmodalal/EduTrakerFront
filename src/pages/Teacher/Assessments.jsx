import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Send, Users, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const Assessments = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gradebook'); // 'create', 'gradebook'
    const [selectedClass, setSelectedClass] = useState('Grade 10-A');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

    // Mock Data for now
    const classes = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];
    const assessmentTypes = ['homework', 'quiz', 'midterm', 'final', 'project', 'participation', 'assignment'];

    // Real Data
    const [assessments, setAssessments] = useState([]);
    const [grades, setGrades] = useState([]);

    // Form State for New Assessment
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        assignment_type: 'homework',
        due_date: '',
        full_mark: '',
        description: '',
        assignment_code: `ASN-${Date.now().toString().slice(-6)}`
    });

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                setLoading(true);
                const data = await teacherService.getAssignments();
                setAssessments(data.results || data || []);
                if ((data.results || data || []).length > 0) {
                    setSelectedAssessmentId((data.results || data || [])[0].id);
                }
            } catch (error) {
                console.error("Error fetching assessments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    useEffect(() => {
        if (selectedAssessmentId) {
            const fetchGrades = async () => {
                try {
                    const data = await teacherService.getMarks({ assignment_id: selectedAssessmentId });
                    setGrades(data.results || data || []);
                } catch (error) {
                    console.error("Error fetching grades:", error);
                }
            };
            fetchGrades();
        }
    }, [selectedAssessmentId]);

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newAssessment,
                created_by: user.user_id,
                assigned_date: new Date().toISOString().split('T')[0]
            };
            const created = await teacherService.createAssignment(payload);
            setAssessments([created, ...assessments]);
            setSelectedAssessmentId(created.id);
            setActiveTab('gradebook');
            setNewAssessment({
                title: '',
                assignment_type: 'homework',
                due_date: '',
                full_mark: '',
                description: '',
                assignment_code: `ASN-${Date.now().toString().slice(-6)}`
            });
            alert(`Assessment "${created.title}" created successfully!`);
        } catch (error) {
            console.error("Error creating assessment:", error);
            alert("Failed to create assessment");
        }
    };

    const handleGradeChange = (id, value) => {
        setGrades(grades.map(student => {
            if (student.id === id) {
                return { ...student, grade: value, status: value ? 'Graded' : 'Pending' };
            }
            return student;
        }));
    };

    const handleFeedbackChange = (id, value) => {
        setGrades(grades.map(student => {
            if (student.id === id) {
                return { ...student, feedback: value };
            }
            return student;
        }));
    };

    const handlePublishResults = () => {
        const gradedCount = grades.filter(g => g.status === 'Graded').length;
        if (gradedCount === 0) {
            alert('No grades to publish!');
            return;
        }
        alert(`Results published for ${gradedCount} students in ${selectedClass} for ${selectedAssessment}. Notifications sent to students and parents.`);
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
                    <h1 className="page-title">{t('teacher.assessments.title')}</h1>
                    <p className="page-subtitle">{t('teacher.assessments.subtitle')}</p>
                </div>
                <div className="action-group" style={{ gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('gradebook')}
                        style={{
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: activeTab === 'gradebook' ? 'none' : '1px solid var(--teacher-border)',
                            backgroundColor: activeTab === 'gradebook' ? 'var(--teacher-primary)' : 'var(--teacher-surface)',
                            color: activeTab === 'gradebook' ? 'white' : 'var(--teacher-text-main)'
                        }}
                    >
                        {t('teacher.assessments.gradebook')}
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: activeTab === 'create' ? 'none' : '1px solid var(--teacher-border)',
                            backgroundColor: activeTab === 'create' ? 'var(--teacher-primary)' : 'var(--teacher-surface)',
                            color: activeTab === 'create' ? 'white' : 'var(--teacher-text-main)'
                        }}
                    >
                        <Plus size={18} />
                        {t('teacher.assessments.createAssessment')}
                    </button>
                </div>
            </header>

            {activeTab === 'create' && (
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Plus size={20} style={{ color: 'var(--teacher-primary)' }} />
                        {t('teacher.assessments.createNew')}
                    </h2>
                    <form className="space-y-6" onSubmit={handleCreateAssessment}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.assessmentTitle')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newAssessment.title}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    placeholder="e.g. Algebra Quiz 1"
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.type')}</label>
                                <select
                                    value={newAssessment.assignment_type}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, assignment_type: e.target.value })}
                                    className="teacher-select w-full"
                                >
                                    {assessmentTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.dueDate')}</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newAssessment.due_date}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, due_date: e.target.value })}
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.totalPoints')}</label>
                                <input
                                    type="number"
                                    required
                                    value={newAssessment.full_mark}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, full_mark: e.target.value })}
                                    placeholder="100"
                                    className="teacher-input w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.description')}</label>
                            <textarea
                                rows="3"
                                value={newAssessment.description}
                                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                className="teacher-input w-full"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setActiveTab('gradebook')} className="icon-btn" style={{ width: 'auto', padding: '0.625rem 1.25rem' }}>{t('teacher.assessments.cancel')}</button>
                            <button type="submit" className="btn-primary">{t('teacher.assessments.createAssessment')}</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'gradebook' && (
                <div className="glass-panel">
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--teacher-border)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div className="filter-bar">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="teacher-select"
                            >
                                {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            </select>
                            <select
                                value={selectedAssessmentId || ''}
                                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                                className="teacher-select"
                            >
                                <option value="" disabled>Select Assessment</option>
                                {assessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePublishResults}
                                className="icon-btn success"
                                style={{ width: 'auto', padding: '0.5rem 1rem', gap: '0.5rem', color: '#15803D', borderColor: '#15803D', backgroundColor: '#F0FDF4' }}
                            >
                                <Send size={18} />
                                {t('teacher.assessments.publishResults')}
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="teacher-table">
                            <thead>
                                <tr>
                                    <th>{t('teacher.classes.studentName')}</th>
                                    <th>{t('teacher.assessments.grade')}</th>
                                    <th>{t('teacher.assessments.feedback')}</th>
                                    <th>{t('teacher.classes.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((g) => (
                                    <tr key={g.id}>
                                        <td className="font-bold text-slate-800">{g.student_name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={g.score}
                                                onChange={(e) => handleGradeChange(g.id, e.target.value)}
                                                className="teacher-input"
                                                style={{ width: '80px', textAlign: 'center' }}
                                                placeholder={`0-${g.assignment_full_mark || 100}`}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={g.feedback || ''}
                                                onChange={(e) => handleFeedbackChange(g.id, e.target.value)}
                                                placeholder="Add comment..."
                                                className="teacher-input"
                                                style={{ width: '100%', maxWidth: '300px' }}
                                            />
                                        </td>
                                        <td>
                                            <span className={`status-badge ${g.is_active ? 'info' : 'neutral'
                                                }`}>
                                                {g.is_active ? t('teacher.assessments.graded') : t('teacher.assessments.pending')}
                                            </span>
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

export default Assessments;
