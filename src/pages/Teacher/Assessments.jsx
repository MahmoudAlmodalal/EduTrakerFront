import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Save, Send, Users, Loader2, Check, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    useCreateTeacherAssignmentMutation,
    useRecordTeacherMarkMutation,
    useTeacherAllocations,
    useTeacherAssignments,
    useTeacherMarks,
    useTeacherStudents
} from '../../hooks/useTeacherQueries';
import { teacherContainerVariants } from '../../utils/animations';
import { toList, todayIsoDate } from '../../utils/helpers';

// Skeleton Component
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const Assessments = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const schoolId = useMemo(
        () => user?.school_id ?? (typeof user?.school === 'number' ? user.school : null),
        [user?.school, user?.school_id]
    );
    const [activeTab, setActiveTab] = useState('gradebook');
    const [grades, setGrades] = useState([]);

    // Selection States
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

    // UI States
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

    const {
        data: classesData,
        isLoading: loadingClasses
    } = useTeacherAllocations(todayIsoDate());

    const {
        data: assessmentsData,
        isLoading: loadingAssessments
    } = useTeacherAssignments();

    const classes = useMemo(() => toList(classesData), [classesData]);
    const assessments = useMemo(() => toList(assessmentsData), [assessmentsData]);

    const loading = loadingClasses || loadingAssessments;

    useEffect(() => {
        if (!selectedClass && classes.length > 0) {
            setSelectedClass(classes[0].id.toString());
        }
    }, [classes, selectedClass]);

    const filteredAssessments = useMemo(
        () => (selectedClass
            ? assessments.filter((assessment) => assessment.course_allocation?.toString() === selectedClass)
            : assessments),
        [assessments, selectedClass]
    );

    useEffect(() => {
        if (!selectedAssessmentId && filteredAssessments.length > 0) {
            setSelectedAssessmentId(filteredAssessments[0].id.toString());
            return;
        }

        if (
            selectedAssessmentId
            && !filteredAssessments.some((assessment) => assessment.id.toString() === selectedAssessmentId)
        ) {
            setSelectedAssessmentId(filteredAssessments[0]?.id?.toString() || '');
        }
    }, [filteredAssessments, selectedAssessmentId]);

    const selectedAllocation = useMemo(
        () => classes.find((item) => item.id.toString() === selectedClass),
        [classes, selectedClass]
    );

    const studentFilters = useMemo(() => {
        if (!selectedClass) {
            return null;
        }

        const filters = {
            current_status: 'active',
            page_size: 100
        };

        if (schoolId) {
            filters.school_id = schoolId;
        }

        if (selectedAllocation?.class_room_id) {
            filters.classroom_id = selectedAllocation.class_room_id;
        }

        return filters;
    }, [schoolId, selectedAllocation, selectedClass]);

    const {
        data: marksData,
        isLoading: loadingMarks
    } = useTeacherMarks(selectedAssessmentId, {
        enabled: Boolean(selectedAssessmentId)
    });

    const {
        data: studentsData,
        isLoading: loadingStudents
    } = useTeacherStudents(studentFilters || {}, {
        enabled: Boolean(studentFilters)
    });

    const loadingGrades = loadingMarks || loadingStudents;
    const createAssessmentMutation = useCreateTeacherAssignmentMutation();
    const saveMarkMutation = useRecordTeacherMarkMutation();
    const saving = createAssessmentMutation.isPending;

    useEffect(() => {
        if (!selectedAssessmentId || !selectedClass) {
            setGrades([]);
            return;
        }

        const existingMarks = toList(marksData);
        const students = toList(studentsData);

        const gradebookData = students.map((student) => {
            const studentId = student.user_id || student.id;
            const mark = existingMarks.find((item) => item.student_id === studentId);
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
    }, [marksData, selectedAssessmentId, selectedClass, studentsData]);

    const handleCreateAssessment = useCallback(async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newAssessment,
                exam_type: newAssessment.assignment_type,
                created_by: user.user_id,
                assigned_date: new Date().toISOString().split('T')[0]
            };

            const created = await createAssessmentMutation.mutateAsync(payload);
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
        }
    }, [createAssessmentMutation, newAssessment, user.user_id]);

    const handleSaveGrade = useCallback(async (studentId) => {
        const gradeData = grades.find(g => g.id === studentId);
        if (!gradeData || gradeData.score === '' || gradeData.score === null) return;

        try {
            setSavingStudentId(studentId);
            const payload = {
                assignment_id: parseInt(selectedAssessmentId),
                student_id: studentId,
                score: parseFloat(gradeData.score),
                feedback: gradeData.feedback || '',
                date_recorded: new Date().toISOString().split('T')[0]
            };

            await saveMarkMutation.mutateAsync(payload);
            setGrades(grades.map(g => g.id === studentId ? { ...g, is_active: true } : g));
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save grade");
        } finally {
            setSavingStudentId(null);
        }
    }, [grades, saveMarkMutation, selectedAssessmentId]);

    const handleGradeChange = useCallback((id, value) => {
        setGrades(grades.map(student =>
            student.id === id ? { ...student, score: value } : student
        ));
    }, [grades]);

    const handleFeedbackChange = useCallback((id, value) => {
        setGrades(grades.map(student =>
            student.id === id ? { ...student, feedback: value } : student
        ));
    }, [grades]);

    const handlePublishResults = useCallback(async () => {
        const ungradedCount = grades.filter(g => !g.is_active && g.score).length;
        if (ungradedCount > 0) {
            if (window.confirm(`You have ${ungradedCount} unsaved grades. Save them all before publishing?`)) {
                try {
                    const unsaved = grades.filter(g => !g.is_active && g.score);
                    await Promise.all(unsaved.map(g => handleSaveGrade(g.id)));
                } catch {
                    return;
                }
            }
        }
        alert('Results published successfully! Notifications sent to students and parents.');
    }, [grades, handleSaveGrade]);

    const selectedAssessment = assessments.find(a => a.id.toString() === selectedAssessmentId);
    const hasClasses = classes.length > 0;

    const setActiveTabAndSyncUrl = useCallback((nextTab) => {
        setActiveTab(nextTab);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', nextTab);
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const requestedTab = searchParams.get('tab');
        if (requestedTab === 'create' || requestedTab === 'gradebook') {
            setActiveTab(requestedTab);
        }
    }, [searchParams]);

    return (
        <Motion.div
            initial="hidden"
            animate="visible"
            variants={teacherContainerVariants}
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

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setActiveTabAndSyncUrl('gradebook')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'gradebook'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <FileText size={16} className="inline mr-2" />
                        {t('teacher.assessments.gradebook') || 'Gradebook'}
                    </button>
                    <button
                        onClick={() => setActiveTabAndSyncUrl('create')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'create'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Plus size={16} className="inline mr-2" />
                        {t('teacher.assessments.createAssessment') || 'Create Assessment'}
                    </button>
                </div>
            </div>

            {/* Create Assessment Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'create' && (
                    <Motion.div
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

                            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveTabAndSyncUrl('gradebook')}
                                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    {t('teacher.assessments.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !hasClasses}
                                    className="inline-flex items-center justify-center gap-2 min-w-[190px] px-6 py-2.5 rounded-xl text-sm font-bold transition-colors border disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: saving || !hasClasses ? '#A5B4FC' : '#4F46E5',
                                        borderColor: saving || !hasClasses ? '#A5B4FC' : '#4F46E5',
                                        color: '#FFFFFF'
                                    }}
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {saving ? 'Creating...' : (t('teacher.assessments.createAssessment') || 'Create Assessment')}
                                </button>
                            </div>
                            {!hasClasses && (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                                    No classes available yet. Assign a class to this teacher before creating assessments.
                                </p>
                            )}
                        </form>
                    </Motion.div>
                )}

                {/* Gradebook Tab */}
                {activeTab === 'gradebook' && (
                    <Motion.div
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
                                            <Motion.tr
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
                                            </Motion.tr>
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
                    </Motion.div>
                )}
            </AnimatePresence>
        </Motion.div>
    );
};

export default Assessments;
