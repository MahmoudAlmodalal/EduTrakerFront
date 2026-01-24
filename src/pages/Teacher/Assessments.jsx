import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Send, Users, Trash2, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Assessments = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('gradebook'); // 'create', 'gradebook'
    
    // Core Data
    const [classes, setClasses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    
    // Filters & Selection
    const [gradeFilter, setGradeFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

    // Gradebook Data
    const [currentStudents, setCurrentStudents] = useState([]);
    const [currentGrades, setCurrentGrades] = useState({}); // { studentId: { grade: 90, feedback: '', status: 'Graded' } }

    const assessmentTypes = ['Homework', 'Quiz', 'Midterm', 'Final Exam', 'Project'];

    // 1. Load Initial Data
    useEffect(() => {
        // Classes
        const storedClasses = JSON.parse(localStorage.getItem('school_classes') || '[]');
        const classNames = storedClasses.length > 0 ? storedClasses.map(c => c.name) : ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'];
        setClasses(classNames);
        if (classNames.length > 0 && !selectedClass) setSelectedClass(classNames[0]);

        // Assessments
        const storedAssessments = JSON.parse(localStorage.getItem('teacher_assessments') || '[]');
        if (storedAssessments.length === 0) {
            // Seed some if empty
            const seeds = [
                { id: 1, title: 'Midterm Exam', type: 'Midterm', date: '2025-11-15', points: 100, class: classNames[0] || 'Grade 10-A', gradeLevel: '10' },
                { id: 2, title: 'Homework 1', type: 'Homework', date: '2025-12-01', points: 20, class: classNames[0] || 'Grade 10-A', gradeLevel: '10' }
            ];
            setAssessments(seeds);
            localStorage.setItem('teacher_assessments', JSON.stringify(seeds));
        } else {
            setAssessments(storedAssessments);
        }
    }, []);

    // 2. Filter Assessments based on filters
    const filteredAssessments = assessments.filter(a => {
        if (gradeFilter !== 'All' && a.gradeLevel !== gradeFilter) return false;
        if (typeFilter !== 'All' && a.type !== typeFilter) return false;
        if (selectedClass && a.class !== selectedClass) return false;
        return true;
    });

    // Auto-select first assessment if available
    useEffect(() => {
        if (filteredAssessments.length > 0 && !selectedAssessmentId) {
            setSelectedAssessmentId(filteredAssessments[0].id);
        } else if (filteredAssessments.length === 0) {
            setSelectedAssessmentId('');
        }
    }, [filteredAssessments, selectedAssessmentId]);

    // 3. Load Grades & Students when Assessment/Class changes
    useEffect(() => {
        if (!selectedClass || !selectedAssessmentId) {
            setCurrentStudents([]);
            return;
        }

        // Load Students for Class
        const allStudents = JSON.parse(localStorage.getItem('sec_students') || '[]');
        let classStudents = allStudents.filter(s => s.class === selectedClass);
        if (classStudents.length === 0) {
             // Fallback for demo
             classStudents = [
                { id: 101, name: 'Student One', class: selectedClass },
                { id: 102, name: 'Student Two', class: selectedClass }
            ];
        }
        setCurrentStudents(classStudents);

        // Load Grades
        const allGrades = JSON.parse(localStorage.getItem('teacher_grades') || '{}'); 
        // Structure: { assessmentId: { studentId: { grade, feedback, status } } }
        const assessmentGrades = allGrades[selectedAssessmentId] || {};
        setCurrentGrades(assessmentGrades);

    }, [selectedClass, selectedAssessmentId]);


    // 4. Creation Form State
    const [newAssessment, setNewAssessment] = useState({
        title: '', type: 'Homework', date: '', points: '', description: '',
        targetClass: '', gradeLevel: '10'
    });

    const handleCreateAssessment = (e) => {
        e.preventDefault();
        const newItem = {
            id: Date.now(),
            ...newAssessment,
            class: newAssessment.targetClass || classes[0]
        };
        
        const updated = [...assessments, newItem];
        setAssessments(updated);
        localStorage.setItem('teacher_assessments', JSON.stringify(updated));
        
        alert("Assessment Created Successfully!");
        setActiveTab('gradebook');
        setSelectedClass(newItem.class);
        // Force select logic will pick up the new ID via filtered list eventually, or we set it now:
        setSelectedAssessmentId(newItem.id);
    };

    // 5. Handlers
    const handleGradeChange = (studentId, field, value) => {
        setCurrentGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
                status: field === 'grade' && value ? 'Graded' : (prev[studentId]?.status || 'Pending')
            }
        }));
    };

    const saveGrades = () => {
        const allGrades = JSON.parse(localStorage.getItem('teacher_grades') || '{}');
        allGrades[selectedAssessmentId] = currentGrades;
        localStorage.setItem('teacher_grades', JSON.stringify(allGrades));
        alert("Grades Saved!");
    };

    const publishToExcel = () => {
        if (!selectedAssessmentId) return;
        const assessment = assessments.find(a => a.id == selectedAssessmentId);
        
        // Prepare CSV
        let csv = "Student Name,Grade,Feedback,Status\n";
        currentStudents.forEach(s => {
            const g = currentGrades[s.id] || {};
            csv += `"${s.name}","${g.grade || ''}","${g.feedback || ''}","${g.status || 'Pending'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${assessment?.title || 'Assessment'}_Results.csv`;
        a.click();
        alert("Results published to CSV file.");
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
                    <button onClick={() => setActiveTab('gradebook')} className={`btn-secondary ${activeTab === 'gradebook' ? 'active' : ''}`} style={activeTab === 'gradebook' ? {background:'#e0e7ff', borderColor: '#6366f1'} : {}}>
                        {t('teacher.assessments.gradebook')}
                    </button>
                    <button onClick={() => setActiveTab('create')} className="btn-primary">
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
                                <input type="text" required onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })} className="teacher-input w-full" placeholder="e.g. Midterm 1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Subject/Type</label>
                                <select onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })} className="teacher-select w-full">
                                    {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                             <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Target Grade</label>
                                <select onChange={(e) => setNewAssessment({ ...newAssessment, gradeLevel: e.target.value })} className="teacher-select w-full">
                                    <option value="10">Grade 10</option>
                                    <option value="11">Grade 11</option>
                                    <option value="12">Grade 12</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Target Class</label>
                                <select onChange={(e) => setNewAssessment({ ...newAssessment, targetClass: e.target.value })} className="teacher-select w-full">
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.dueDate')}</label>
                                <input type="date" required onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })} className="teacher-input w-full" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.assessments.totalPoints')}</label>
                                <input type="number" required onChange={(e) => setNewAssessment({ ...newAssessment, points: e.target.value })} className="teacher-input w-full" />
                            </div>
                        </div>
                         <div className="flex justify-end gap-3 pt-4">
                            <button type="submit" className="btn-primary">{t('teacher.assessments.createAssessment')}</button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'gradebook' && (
                <div className="glass-panel">
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--teacher-border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex gap-2">
                             <select className="teacher-select" onChange={(e) => setGradeFilter(e.target.value)} value={gradeFilter}>
                                <option value="All">All Grades</option>
                                <option value="10">Grade 10</option>
                                <option value="11">Grade 11</option>
                                <option value="12">Grade 12</option>
                            </select>
                             <select className="teacher-select" onChange={(e) => setTypeFilter(e.target.value)} value={typeFilter}>
                                <option value="All">All Types</option>
                                {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select className="teacher-select" onChange={(e) => setSelectedClass(e.target.value)} value={selectedClass}>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select className="teacher-select" onChange={(e) => setSelectedAssessmentId(e.target.value)} value={selectedAssessmentId || ''}>
                                {filteredAssessments.length > 0 ? filteredAssessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>) : <option value="">No Assessments</option>}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={saveGrades} className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <Save size={16} /> Save
                            </button>
                            <button onClick={publishToExcel} className="icon-btn success" style={{backgroundColor: '#F0FDF4', color: '#15803D'}}>
                                <Download size={16} /> Publish (Excel)
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
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentStudents.map((student) => {
                                    const gradeInfo = currentGrades[student.id] || {};
                                    return (
                                        <tr key={student.id}>
                                            <td className="font-bold text-slate-800">{student.name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={gradeInfo.grade || ''}
                                                    onChange={(e) => handleGradeChange(student.id, 'grade', e.target.value)}
                                                    className="teacher-input"
                                                    style={{ width: '80px', textAlign: 'center' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={gradeInfo.feedback || ''}
                                                    onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                                                    className="teacher-input"
                                                    style={{ width: '100%' }}
                                                    placeholder="Feedback..."
                                                />
                                            </td>
                                            <td>
                                                <span className={`status-badge ${gradeInfo.status === 'Graded' ? 'success' : 'neutral'}`}>
                                                    {gradeInfo.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {currentStudents.length === 0 && (
                                    <tr><td colSpan="4" className="text-center p-4 text-slate-500">No students found for this class.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Assessments;
