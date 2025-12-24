import React, { useState } from 'react';
import { FileText, Plus, Save, Send, Users, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Assessments = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('gradebook'); // 'create', 'gradebook'
    const [selectedClass, setSelectedClass] = useState('Grade 10-A');
    const [selectedAssessment, setSelectedAssessment] = useState('Midterm Exam');

    // Mock Data
    const classes = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];
    const assessmentTypes = ['Homework', 'Quiz', 'Midterm', 'Final Project'];

    // Mock Assessments List
    const [assessments, setAssessments] = useState([
        { id: 1, title: 'Midterm Exam', type: 'Midterm', date: '2025-11-15', points: 100 },
        { id: 2, title: 'Homework 1', type: 'Homework', date: '2025-12-01', points: 20 },
        { id: 3, title: 'Quiz A', type: 'Quiz', date: '2025-12-10', points: 10 },
    ]);

    // Mock Students & Grades
    const [grades, setGrades] = useState([
        { id: 1, name: 'Ahmed Ali', grade: 85, status: 'Graded', feedback: '' },
        { id: 2, name: 'Sara Khan', grade: 92, status: 'Graded', feedback: 'Great job!' },
        { id: 3, name: 'Mohamed Zaki', grade: '', status: 'Pending', feedback: '' },
        { id: 4, name: 'Layla Mahmoud', grade: 78, status: 'Graded', feedback: 'Good effort.' },
        { id: 5, name: 'Omar Youssef', grade: '', status: 'Pending', feedback: '' },
    ]);

    // Form State for New Assessment
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        type: 'Homework',
        date: '',
        points: '',
        description: ''
    });

    const handleCreateAssessment = (e) => {
        e.preventDefault();
        const assessment = {
            id: assessments.length + 1,
            ...newAssessment
        };
        setAssessments([...assessments, assessment]);
        setSelectedAssessment(newAssessment.title);
        setActiveTab('gradebook');
        setNewAssessment({ title: '', type: 'Homework', date: '', points: '', description: '' });
        setGrades(grades.map(s => ({ ...s, grade: '', status: 'Pending', feedback: '' })));
        alert(`Assessment "${assessment.title}" created successfully!`);
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
                                    value={newAssessment.type}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                    className="teacher-select w-full"
                                >
                                    {assessmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.dueDate')}</label>
                                <input
                                    type="date"
                                    required
                                    value={newAssessment.date}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })}
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.totalPoints')}</label>
                                <input
                                    type="number"
                                    required
                                    value={newAssessment.points}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, points: e.target.value })}
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
                                value={selectedAssessment}
                                onChange={(e) => setSelectedAssessment(e.target.value)}
                                className="teacher-select"
                            >
                                {assessments.map(a => <option key={a.id} value={a.title}>{a.title}</option>)}
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
                                {grades.map((student) => (
                                    <tr key={student.id}>
                                        <td className="font-bold text-slate-800">{student.name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={student.grade}
                                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                className="teacher-input"
                                                style={{ width: '80px', textAlign: 'center' }}
                                                placeholder="0-100"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={student.feedback || ''}
                                                onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                placeholder="Add comment..."
                                                className="teacher-input"
                                                style={{ width: '100%', maxWidth: '300px' }}
                                            />
                                        </td>
                                        <td>
                                            <span className={`status-badge ${student.status === 'Graded' ? 'info' : 'neutral'
                                                }`}>
                                                {student.status === 'Graded' ? t('teacher.assessments.graded') : student.status}
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
