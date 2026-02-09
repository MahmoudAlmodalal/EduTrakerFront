import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Send, Users, Trash2, Loader2, Check, X, ChevronDown, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import { motion, AnimatePresence } from 'framer-motion';

// Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const Assessments = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [activeTab, setActiveTab] = useState('gradebook');

    // Data States
    const [classes, setClasses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [grades, setGrades] = useState([]);

    // Selection States
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

    // UI States
    const [saving, setSaving] = useState(false);
    const [savingStudentId, setSavingStudentId] = useState(null);

    const assessmentTypes = ['homework', 'quiz', 'midterm', 'final', 'project', 'participation', 'assignment'];

    // Form State for New Assessment
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        assignment_type: 'homework',
        due_date: '',
        full_mark: '',
        description: '',
        course_allocation: '',
        assignment_code: `ASN-${Date.now().toString().slice(-6)}`
    });

    // Initial Load - Fetch Classes and Assessments
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [assignmentsData, allocationsData] = await Promise.all([
                    teacherService.getAssignments(),
                    teacherService.getSchedule(new Date().toISOString().split('T')[0])
                ]);

                const fetchedAssessments = assignmentsData.results || assignmentsData || [];
                setAssessments(fetchedAssessments);

                const allocations = allocationsData || [];
                setClasses(allocations);

                if (allocations.length > 0 && !selectedClass) {
                    setSelectedClass(allocations[0].id.toString());
                }

                if (fetchedAssessments.length > 0 && !selectedAssessmentId) {
                    setSelectedAssessmentId(fetchedAssessments[0].id.toString());
                }
            } catch (error) {
                console.error("Error fetching assessment data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch Grades when Assessment/Class Changes
    useEffect(() => {
        const fetchGradesAndStudents = async () => {
            if (!selectedAssessmentId || !selectedClass) return;

            try {
                setLoadingGrades(true);
                const allocation = classes.find(c => c.id.toString() === selectedClass);

                const studentFilters = {
                    school_id: user.school_id,
                    current_status: 'active',
                    page_size: 100
                };

                if (allocation && allocation.class_room_id) {
                    studentFilters.classroom_id = allocation.class_room_id;
                }

                const [marksData, studentsData] = await Promise.all([
                    teacherService.getMarks({ assignment_id: selectedAssessmentId }),
                    teacherService.getStudents(studentFilters)
                ]);

                const existingMarks = marksData.results || marksData || [];
                const students = studentsData.results || studentsData || [];

                const gradebookData = students.map(student => {
                    const studentId = student.user_id || student.id;
                    const mark = existingMarks.find(m => m.student_id === studentId);
                    return {
                        id: studentId,
                        student_name: student.full_name || 'N/A',
                        score: mark ? mark.score : '',
                        feedback: mark ? mark.feedback : '',
                        is_active: mark ? mark.is_active : false,
                        mark_id: mark ? mark.id : null
                    };
                });

                setGrades(gradebookData);
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoadingGrades(false);
            }
        };

        if (selectedAssessmentId && selectedClass) {
            fetchGradesAndStudents();
        }
    }, [selectedAssessmentId, selectedClass, classes.length, user.school_id]);

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...newAssessment,
                exam_type: newAssessment.assignment_type,
                created_by: user.user_id,
                assigned_date: new Date().toISOString().split('T')[0]
            };

            const created = await teacherService.createAssignment(payload);
            setAssessments([created, ...assessments]);
            setSelectedAssessmentId(created.id.toString());

            if (created.course_allocation) {
                setSelectedClass(created.course_allocation.toString());
            }

            setActiveTab('gradebook');
            setNewAssessment({
                title: '',
                assignment_type: 'homework',
                due_date: '',
                full_mark: '',
                description: '',
                course_allocation: '',
                assignment_code: `ASN-${Date.now().toString().slice(-6)}`
            });

            setTimeout(() => alert(`Assessment "${created.title}" created successfully!`), 100);
        } catch (error) {
            console.error("Error creating assessment:", error);
            alert("Failed to create assessment");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGrade = async (studentId) => {
        const gradeData = grades.find(g => g.id === studentId);
        if (!gradeData || !gradeData.score) return;

        try {
            setSavingStudentId(studentId);
            const payload = {
                assignment_id: parseInt(selectedAssessmentId),
                student_id: studentId,
                score: parseFloat(gradeData.score),
                feedback: gradeData.feedback || '',
                date_recorded: new Date().toISOString().split('T')[0]
            };

            await teacherService.recordMark(payload);
            setGrades(grades.map(g => g.id === studentId ? { ...g, is_active: true } : g));
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save grade");
        } finally {
            setSavingStudentId(null);
        }
    };

    const handleGradeChange = (id, value) => {
        setGrades(grades.map(student =>
            student.id === id ? { ...student, score: value } : student
        ));
    };

    const handleFeedbackChange = (id, value) => {
        setGrades(grades.map(student =>
            student.id === id ? { ...student, feedback: value } : student
        ));
    };

    const handlePublishResults = async () => {
        const ungradedCount = grades.filter(g => !g.is_active && g.score).length;
        if (ungradedCount > 0) {
            if (window.confirm(`You have ${ungradedCount} unsaved grades. Save them all before publishing?`)) {
                try {
                    const unsaved = grades.filter(g => !g.is_active && g.score);
                    await Promise.all(unsaved.map(g => handleSaveGrade(g.id)));
                } catch (error) {
                    return;
                }
            }
        }
        alert('Results published successfully! Notifications sent to students and parents.');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const selectedAssessment = assessments.find(a => a.id.toString() === selectedAssessmentId);
    const filteredAssessments = selectedClass
        ? assessments.filter(a => a.course_allocation?.toString() === selectedClass)
        : assessments;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-6 pb-12 px-4 sm:px-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('teacher.assessments.title')}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Create assessments, manage grades, and track student performance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('gradebook')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'gradebook'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <FileText size={16} className="inline mr-2" />
                        {t('teacher.assessments.gradebook')}
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'create'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Plus size={16} className="inline mr-2" />
                        {t('teacher.assessments.createAssessment')}
                    </button>
                </div>
            </div>

            {/* Create Assessment Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'create' && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus size={22} className="text-indigo-600" />
                            {t('teacher.assessments.createNew')}
                        </h2>

                        <form onSubmit={handleCreateAssessment} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('teacher.assessments.assessmentTitle')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newAssessment.title}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                        placeholder="e.g. Algebra Quiz 1"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('teacher.assessments.type')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={newAssessment.assignment_type}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, assignment_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                                        >
                                            {assessmentTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('teacher.assessments.dueDate')}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newAssessment.due_date}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, due_date: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('teacher.assessments.totalPoints')}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={newAssessment.full_mark}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, full_mark: e.target.value })}
                                        placeholder="100"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Class / Subject</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={newAssessment.course_allocation}
                                            onChange={(e) => setNewAssessment({ ...newAssessment, course_allocation: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                                        >
                                            <option value="" disabled>Select Class</option>
                                            {classes.map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.classroom_name || cls.class} - {cls.course_name || cls.subject}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {t('teacher.assessments.description')}
                                </label>
                                <textarea
                                    rows="4"
                                    value={newAssessment.description}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                    placeholder="Add instructions or details about this assessment..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('gradebook')}
                                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    {t('teacher.assessments.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {saving ? 'Creating...' : t('teacher.assessments.createAssessment')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Gradebook Tab */}
                {activeTab === 'gradebook' && (
                    <motion.div
                        key="gradebook"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative min-w-[200px]">
                                    {loading ? (
                                        <Skeleton className="h-10 w-full rounded-xl" />
                                    ) : (
                                        <>
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                                            >
                                                <option value="" disabled>Select Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.classroom_name || cls.class} - {cls.course_name || cls.subject}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </>
                                    )}
                                </div>

                                <div className="relative min-w-[250px]">
                                    {loading ? (
                                        <Skeleton className="h-10 w-full rounded-xl" />
                                    ) : (
                                        <>
                                            <select
                                                value={selectedAssessmentId}
                                                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                                            >
                                                <option value="" disabled>Select Assessment</option>
                                                {filteredAssessments.map(a => (
                                                    <option key={a.id} value={a.id}>{a.title}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handlePublishResults}
                                disabled={loadingGrades || grades.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                                {t('teacher.assessments.publishResults')}
                            </button>
                        </div>

                        {/* Stats Bar - Enhanced */}
                        {selectedAssessment && (
                            <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Total Students</p>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{grades.length}</p>
                                </div>
                                <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Graded</p>
                                    <p className="text-3xl font-black text-emerald-600 mt-1">
                                        {grades.filter(g => g.is_active).length}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                                    <p className="text-xs font-bold text-amber-600 uppercase">Pending</p>
                                    <p className="text-3xl font-black text-amber-600 mt-1">
                                        {grades.filter(g => !g.is_active).length}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl">
                                    <p className="text-xs font-bold text-indigo-600 uppercase">Max Points</p>
                                    <p className="text-3xl font-black text-indigo-600 mt-1">
                                        {selectedAssessment.full_mark || 100}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Gradebook Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('teacher.classes.studentName')}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('teacher.assessments.grade')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('teacher.assessments.feedback')}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('teacher.classes.status')}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingGrades ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-10 w-20 mx-auto" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-10 w-full max-w-xs" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-8 w-16 mx-auto rounded-lg" /></td>
                                            </tr>
                                        ))
                                    ) : grades.length > 0 ? (
                                        grades.map((g) => (
                                            <motion.tr
                                                key={g.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                            {g.student_name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{g.student_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={g.score}
                                                        onChange={(e) => handleGradeChange(g.id, e.target.value)}
                                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                        placeholder="0"
                                                        min="0"
                                                        max={selectedAssessment?.full_mark || 100}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={g.feedback || ''}
                                                        onChange={(e) => handleFeedbackChange(g.id, e.target.value)}
                                                        placeholder="Add feedback..."
                                                        className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${g.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {g.is_active ? (
                                                            <><Check size={12} className="mr-1" /> {t('teacher.assessments.graded')}</>
                                                        ) : (
                                                            t('teacher.assessments.pending')
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleSaveGrade(g.id)}
                                                        disabled={!g.score || savingStudentId === g.id}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                                                    >
                                                        {savingStudentId === g.id ? (
                                                            <><Loader2 size={14} className="animate-spin" /> Saving</>
                                                        ) : (
                                                            <><Save size={14} /> Save</>
                                                        )}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                        <Users size={24} className="text-gray-300" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">No students found</h3>
                                                    <p className="text-gray-500 text-sm mt-1">Select a class and assessment to view grades.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Assessments;
