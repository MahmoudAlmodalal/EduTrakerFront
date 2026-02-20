import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Calendar,
    Download,
    FileImage,
    FileText,
    FileUp,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    X
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import {
    useCreateLearningMaterialMutation,
    useCreateLessonPlanMutation,
    useDeleteLearningMaterialMutation,
    useDeleteLessonPlanMutation,
    useTeacherAllocations,
    useTeacherLearningMaterials,
    useTeacherLessonPlans,
    useUpdateLessonPlanMutation
} from '../../hooks/useTeacherQueries';
import teacherService from '../../services/teacherService';
import { toList } from '../../utils/helpers';
import './Teacher.css';

const emptyLessonForm = {
    title: '',
    allocationId: '',
    weekStartDate: '',
    objectives: '',
    activities: '',
    resources: '',
    notes: ''
};

const emptyMaterialForm = {
    title: '',
    allocationId: '',
    description: ''
};

const startOfWeek = (date) => {
    const normalized = new Date(date);
    if (Number.isNaN(normalized.getTime())) {
        return null;
    }
    const day = normalized.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    normalized.setDate(normalized.getDate() + diff);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const isSameWeek = (dateA, dateB) => {
    const weekA = startOfWeek(dateA);
    const weekB = startOfWeek(dateB);
    return weekA && weekB && weekA.getTime() === weekB.getTime();
};

const parseLessonContent = (content = '') => {
    if (!content) {
        return { activities: '', notes: '' };
    }

    const notesMarker = '\n\nNotes:\n';
    if (content.includes(notesMarker)) {
        const [activitiesPart, notesPart] = content.split(notesMarker);
        return {
            activities: activitiesPart.replace(/^Activities:\n/, ''),
            notes: notesPart || ''
        };
    }

    return { activities: content, notes: '' };
};

const buildLessonContent = ({ activities, notes }) => {
    const trimmedActivities = (activities || '').trim();
    const trimmedNotes = (notes || '').trim();

    if (!trimmedActivities && !trimmedNotes) {
        return '';
    }

    if (!trimmedNotes) {
        return `Activities:\n${trimmedActivities}`;
    }

    return `Activities:\n${trimmedActivities}\n\nNotes:\n${trimmedNotes}`;
};

const getFileTypeIcon = (fileType = '') => {
    const normalized = fileType.toLowerCase();
    if (normalized.includes('jpg') || normalized.includes('jpeg') || normalized.includes('png') || normalized.includes('gif')) {
        return FileImage;
    }
    return FileText;
};

const ConfirmDeleteModal = ({ isOpen, title, description, onConfirm, onCancel, isPending }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '1rem'
            }}
            onClick={isPending ? undefined : onCancel}
        >
            <div
                className="management-card"
                style={{ width: '420px', maxWidth: '100%', padding: '1.4rem 1.5rem' }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#fee2e2',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                        }}
                    >
                        <Trash2 size={18} color="#dc2626" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>{description}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
                    <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 'auto', padding: '0.45rem 0.9rem' }}
                        onClick={onCancel}
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.55rem',
                            padding: '0.45rem 1rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            opacity: isPending ? 0.7 : 1
                        }}
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        <Trash2 size={14} />
                        {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonPlans = () => {
    const { t } = useTheme();
    const MATERIALS_PAGE_SIZE = 8;

    const [timeFilter, setTimeFilter] = useState('all');
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState(emptyLessonForm);

    const [showMaterialUpload, setShowMaterialUpload] = useState(false);
    const [materialForm, setMaterialForm] = useState(emptyMaterialForm);
    const [selectedFile, setSelectedFile] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        type: null,
        id: null,
        label: ''
    });
    const [materialsPage, setMaterialsPage] = useState(1);

    const {
        data: allocationsData,
        isLoading: loadingAllocations
    } = useTeacherAllocations();

    const {
        data: lessonPlansData,
        isLoading: loadingLessonPlans
    } = useTeacherLessonPlans({ page_size: 200 });

    const {
        data: materialsData,
        isLoading: loadingMaterials
    } = useTeacherLearningMaterials({
        page: materialsPage,
        page_size: MATERIALS_PAGE_SIZE
    });

    const createLessonPlanMutation = useCreateLessonPlanMutation();
    const updateLessonPlanMutation = useUpdateLessonPlanMutation();
    const deleteLessonPlanMutation = useDeleteLessonPlanMutation();

    const createMaterialMutation = useCreateLearningMaterialMutation();
    const deleteMaterialMutation = useDeleteLearningMaterialMutation();

    const allocations = useMemo(() => toList(allocationsData), [allocationsData]);
    const lessonPlans = useMemo(() => toList(lessonPlansData), [lessonPlansData]);
    const materials = useMemo(() => toList(materialsData), [materialsData]);
    const materialsCount = materialsData?.count ?? 0;
    const materialsTotalPages = Math.ceil(materialsCount / MATERIALS_PAGE_SIZE);

    useEffect(() => {
        if (materialsTotalPages === 0 && materialsPage !== 1) {
            setMaterialsPage(1);
            return;
        }
        if (materialsTotalPages > 0 && materialsPage > materialsTotalPages) {
            setMaterialsPage(materialsTotalPages);
        }
    }, [materialsPage, materialsTotalPages]);

    const filteredLessonPlans = useMemo(() => {
        if (timeFilter === 'all') {
            return lessonPlans;
        }

        const now = new Date();

        return lessonPlans.filter((plan) => {
            const plannedDate = plan.date_planned ? new Date(plan.date_planned) : null;
            if (!plannedDate || Number.isNaN(plannedDate.getTime())) {
                return false;
            }

            if (timeFilter === 'week') {
                return isSameWeek(plannedDate, now);
            }

            if (timeFilter === 'month') {
                return plannedDate.getFullYear() === now.getFullYear()
                    && plannedDate.getMonth() === now.getMonth();
            }

            return true;
        });
    }, [lessonPlans, timeFilter]);

    const openCreateLessonModal = useCallback(() => {
        setEditingLesson(null);
        setLessonForm({
            ...emptyLessonForm,
            allocationId: allocations[0] ? String(allocations[0].id) : '',
            weekStartDate: new Date().toISOString().split('T')[0]
        });
        setShowLessonModal(true);
    }, [allocations]);

    const openEditLessonModal = useCallback((plan) => {
        const allocation = allocations.find(
            (item) => Number(item.course_id) === Number(plan.course) && Number(item.class_room_id) === Number(plan.classroom)
        );

        const parsedContent = parseLessonContent(plan.content || '');

        setEditingLesson(plan);
        setLessonForm({
            title: plan.title || '',
            allocationId: allocation ? String(allocation.id) : '',
            weekStartDate: plan.date_planned || '',
            objectives: plan.objectives || '',
            activities: parsedContent.activities || '',
            resources: plan.resources_needed || '',
            notes: parsedContent.notes || ''
        });
        setShowLessonModal(true);
    }, [allocations]);

    const closeLessonModal = useCallback(() => {
        setShowLessonModal(false);
        setEditingLesson(null);
        setLessonForm(emptyLessonForm);
    }, []);

    const handleSaveLessonPlan = useCallback(async (event) => {
        event.preventDefault();

        const allocation = allocations.find((item) => String(item.id) === String(lessonForm.allocationId));
        if (!allocation) {
            toast.error('Select a class allocation.');
            return;
        }

        const payload = {
            title: lessonForm.title.trim(),
            course: Number(allocation.course_id),
            classroom: Number(allocation.class_room_id),
            academic_year: Number(allocation.academic_year_id),
            date_planned: lessonForm.weekStartDate,
            objectives: lessonForm.objectives.trim(),
            resources_needed: lessonForm.resources.trim(),
            content: buildLessonContent({
                activities: lessonForm.activities,
                notes: lessonForm.notes
            }),
            is_published: true
        };

        if (!payload.title || !payload.date_planned) {
            toast.error('Title and week start date are required.');
            return;
        }

        try {
            if (editingLesson) {
                await updateLessonPlanMutation.mutateAsync({ id: editingLesson.id, payload });
                toast.success('Lesson plan updated.');
            } else {
                await createLessonPlanMutation.mutateAsync(payload);
                toast.success('Lesson plan created.');
            }
            closeLessonModal();
        } catch (error) {
            toast.error(error?.message || 'Failed to save lesson plan.');
        }
    }, [allocations, closeLessonModal, createLessonPlanMutation, editingLesson, lessonForm, updateLessonPlanMutation]);

    const requestDeleteLessonPlan = useCallback((plan) => {
        setDeleteConfirm({
            show: true,
            type: 'lesson',
            id: plan.id,
            label: plan.title || ''
        });
    }, []);

    const onDropFile = useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            return;
        }
        setSelectedFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropFile,
        multiple: false,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/*': ['.png', '.jpg', '.jpeg']
        }
    });

    const handleSaveMaterial = useCallback(async (event) => {
        event.preventDefault();

        const allocation = allocations.find((item) => String(item.id) === String(materialForm.allocationId));
        if (!allocation) {
            toast.error('Select a class allocation for this material.');
            return;
        }

        if (!selectedFile) {
            toast.error('Attach a file before uploading.');
            return;
        }

        const formData = new FormData();
        formData.append('title', materialForm.title.trim());
        formData.append('description', materialForm.description.trim());
        formData.append('course', String(allocation.course_id));
        formData.append('classroom', String(allocation.class_room_id));
        formData.append('academic_year', String(allocation.academic_year_id));
        formData.append('content_type', 'file');
        formData.append('is_published', 'true');
        formData.append('file_type', selectedFile.type || selectedFile.name.split('.').pop() || 'file');
        formData.append('file_size', String(selectedFile.size || 0));
        formData.append('file', selectedFile);

        try {
            await createMaterialMutation.mutateAsync(formData);
            toast.success('Learning material uploaded.');
            setShowMaterialUpload(false);
            setMaterialForm(emptyMaterialForm);
            setSelectedFile(null);
            setMaterialsPage(1);
        } catch (error) {
            toast.error(error?.message || 'Failed to upload learning material.');
        }
    }, [allocations, createMaterialMutation, materialForm, selectedFile]);

    const requestDeleteMaterial = useCallback((material) => {
        setDeleteConfirm({
            show: true,
            type: 'material',
            id: material.id,
            label: material.title || ''
        });
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        try {
            if (deleteConfirm.type === 'lesson') {
                await deleteLessonPlanMutation.mutateAsync(deleteConfirm.id);
                toast.success('Lesson plan deleted.');
            } else if (deleteConfirm.type === 'material') {
                await deleteMaterialMutation.mutateAsync(deleteConfirm.id);
                toast.success('Learning material deleted.');
            }
            setDeleteConfirm({
                show: false,
                type: null,
                id: null,
                label: ''
            });
        } catch (error) {
            toast.error(error?.message || 'Failed to delete.');
        }
    }, [deleteConfirm, deleteLessonPlanMutation, deleteMaterialMutation]);

    const handleCancelDelete = useCallback(() => {
        setDeleteConfirm({
            show: false,
            type: null,
            id: null,
            label: ''
        });
    }, []);

    const handleDownloadMaterial = useCallback(async (material) => {
        if (downloadingId) {
            return;
        }
        if (!material.download_url) {
            toast.error('No file attached to this material. Please delete it and re-upload.');
            return;
        }
        setDownloadingId(material.id);
        try {
            await teacherService.downloadMaterial(material);
        } catch (error) {
            const msg = error?.message || '';
            if (msg.toLowerCase().includes('no file') || msg.toLowerCase().includes('not found') || error?.status === 404) {
                toast.error('No file attached. Please delete this material and re-upload.');
            } else {
                toast.error('Could not download the file. Please try again.');
            }
        } finally {
            setDownloadingId(null);
        }
    }, [downloadingId]);

    return (
        <div className="teacher-page">
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">{t('teacher.lessonPlans.title') || 'Lesson Plans'}</h1>
                    <p className="teacher-subtitle">
                        Plan weekly lessons and manage learning materials tied to your allocated classes.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-primary" onClick={openCreateLessonModal}>
                        <Plus size={16} />
                        New Lesson Plan
                    </button>
                    <button type="button" className="icon-btn" style={{ width: 'auto', padding: '0.5rem 0.85rem' }} onClick={() => setShowMaterialUpload((previous) => !previous)}>
                        <FileUp size={15} />
                        {showMaterialUpload ? 'Close Upload' : 'Upload Material'}
                    </button>
                </div>
            </div>

            <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Lesson Plan List</h3>
                    <select
                        value={timeFilter}
                        onChange={(event) => setTimeFilter(event.target.value)}
                        style={{ border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontSize: '0.85rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    >
                        <option value="all">All plans</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                    </select>
                </div>

                <div style={{ marginTop: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {loadingLessonPlans ? (
                        <div style={{ color: 'var(--color-text-muted)' }}>Loading lesson plans...</div>
                    ) : filteredLessonPlans.length === 0 ? (
                        <div style={{ color: 'var(--color-text-muted)' }}>No lesson plans found for this filter.</div>
                    ) : filteredLessonPlans.map((plan) => {
                        const start = plan.date_planned ? new Date(plan.date_planned) : null;
                        const end = start ? new Date(start) : null;
                        if (end) {
                            end.setDate(end.getDate() + 6);
                        }

                        return (
                            <div key={plan.id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.85rem', background: 'var(--color-bg-surface)', padding: '0.85rem 0.95rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{plan.title}</h4>
                                    <span
                                        style={{
                                            borderRadius: '999px',
                                            padding: '0.2rem 0.5rem',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            background: plan.is_published ? '#dcfce7' : '#e2e8f0',
                                            color: plan.is_published ? '#166534' : '#334155'
                                        }}
                                    >
                                        {plan.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>

                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                    {(plan.course_name || 'Course')} • {(plan.classroom_name || 'Classroom')}
                                </p>

                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Calendar size={14} />
                                    {start ? start.toLocaleDateString() : 'N/A'} {end ? `- ${end.toLocaleDateString()}` : ''}
                                </div>

                                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                    <button type="button" className="icon-btn" onClick={() => openEditLessonModal(plan)} title="Edit">
                                        <Pencil size={14} />
                                    </button>
                                    <button type="button" className="icon-btn danger" onClick={() => requestDeleteLessonPlan(plan)} title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showLessonModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={closeLessonModal}
                >
                    <div
                        className="management-card"
                        style={{ width: '720px', maxWidth: '100%', padding: '1rem 1.25rem' }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{editingLesson ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</h3>
                            <button type="button" className="icon-btn" onClick={closeLessonModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLessonPlan} style={{ display: 'grid', gap: '0.75rem', marginTop: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.6rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={lessonForm.title}
                                        onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Week Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={lessonForm.weekStartDate}
                                        onChange={(event) => setLessonForm((prev) => ({ ...prev, weekStartDate: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Allocation</label>
                                <select
                                    value={lessonForm.allocationId}
                                    onChange={(event) => setLessonForm((prev) => ({ ...prev, allocationId: event.target.value }))}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">
                                        {loadingAllocations ? 'Loading classes…' : allocations.length === 0 ? 'No classes found' : 'Select a class'}
                                    </option>
                                    {allocations.map((allocation) => (
                                        <option key={allocation.id} value={String(allocation.id)}>
                                            {(allocation.classroom_name || allocation.class || 'Class')} • {(allocation.course_name || allocation.subject || 'Subject')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Objectives</label>
                                <textarea
                                    rows={3}
                                    value={lessonForm.objectives}
                                    onChange={(event) => setLessonForm((prev) => ({ ...prev, objectives: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Activities</label>
                                <textarea
                                    rows={4}
                                    value={lessonForm.activities}
                                    onChange={(event) => setLessonForm((prev) => ({ ...prev, activities: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Resources</label>
                                    <textarea
                                        rows={3}
                                        value={lessonForm.resources}
                                        onChange={(event) => setLessonForm((prev) => ({ ...prev, resources: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Notes</label>
                                    <textarea
                                        rows={3}
                                        value={lessonForm.notes}
                                        onChange={(event) => setLessonForm((prev) => ({ ...prev, notes: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
                                <button type="button" onClick={closeLessonModal} className="icon-btn" style={{ width: 'auto', padding: '0.45rem 0.8rem' }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createLessonPlanMutation.isPending || updateLessonPlanMutation.isPending}
                                >
                                    <Plus size={15} />
                                    {editingLesson ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.85rem', fontSize: '1rem' }}>Learning Materials</h3>

                {showMaterialUpload && (
                    <form onSubmit={handleSaveMaterial} style={{ border: '1px solid var(--color-border)', borderRadius: '0.8rem', padding: '0.85rem', marginBottom: '0.85rem', display: 'grid', gap: '0.65rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Title</label>
                                <input
                                    type="text"
                                    value={materialForm.title}
                                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, title: event.target.value }))}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Allocation</label>
                                <select
                                    value={materialForm.allocationId}
                                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, allocationId: event.target.value }))}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">
                                        {loadingAllocations ? 'Loading classes…' : allocations.length === 0 ? 'No classes found' : 'Select a class'}
                                    </option>
                                    {allocations.map((allocation) => (
                                        <option key={allocation.id} value={String(allocation.id)}>
                                            {(allocation.classroom_name || allocation.class || 'Class')} • {(allocation.course_name || allocation.subject || 'Subject')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.82rem' }}>Description</label>
                            <textarea
                                rows={3}
                                value={materialForm.description}
                                onChange={(event) => setMaterialForm((prev) => ({ ...prev, description: event.target.value }))}
                                style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                            />
                        </div>

                        <div
                            {...getRootProps()}
                            style={{
                                border: '2px dashed var(--color-border)',
                                borderRadius: '0.7rem',
                                padding: '0.9rem',
                                textAlign: 'center',
                                background: isDragActive ? 'rgba(var(--color-primary-rgb), 0.07)' : 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <input {...getInputProps()} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {selectedFile
                                    ? `Selected file: ${selectedFile.name}`
                                    : 'Drag and drop a file here, or click to choose.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" disabled={createMaterialMutation.isPending}>
                                <FileUp size={15} />
                                {createMaterialMutation.isPending ? 'Uploading...' : 'Upload Material'}
                            </button>
                        </div>
                    </form>
                )}

                {loadingMaterials ? (
                    <div style={{ color: 'var(--color-text-muted)' }}>Loading learning materials...</div>
                ) : materials.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)' }}>No materials uploaded yet.</div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gap: '0.55rem' }}>
                            {materials.map((material) => {
                                const MaterialIcon = getFileTypeIcon(material.file_type || '');

                                return (
                                    <div key={material.id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', background: 'var(--color-bg-surface)', padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-bg-body)', display: 'grid', placeItems: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                                                <MaterialIcon size={16} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {material.title}
                                                    </span>
                                                    {!material.download_url && (
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', background: '#fef3c7', color: '#92400e', flexShrink: 0 }}>
                                                            No file
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ marginTop: '2px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                    {(material.course_name || 'Course')} • {(material.classroom_name || 'Class')} • {material.created_at ? new Date(material.created_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                title={material.download_url ? 'Download material' : 'No file attached — re-upload to enable download'}
                                                disabled={downloadingId === material.id}
                                                style={!material.download_url ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                                                onClick={() => handleDownloadMaterial(material)}
                                            >
                                                {downloadingId === material.id ? <Loader2 size={14} /> : <Download size={14} />}
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-btn danger"
                                                onClick={() => requestDeleteMaterial(material)}
                                                title="Delete material"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {materialsTotalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                <span>
                                    Showing {(materialsPage - 1) * MATERIALS_PAGE_SIZE + 1}-
                                    {Math.min(materialsPage * MATERIALS_PAGE_SIZE, materialsCount)} of {materialsCount}
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <button className="icon-btn" disabled={materialsPage === 1} onClick={() => setMaterialsPage((page) => page - 1)}>
                                        ‹ Prev
                                    </button>
                                    <span style={{ padding: '0.4rem 0.6rem' }}>{materialsPage} / {materialsTotalPages}</span>
                                    <button className="icon-btn" disabled={materialsPage === materialsTotalPages} onClick={() => setMaterialsPage((page) => page + 1)}>
                                        Next ›
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                isOpen={deleteConfirm.show}
                title={deleteConfirm.type === 'lesson' ? 'Delete Lesson Plan' : 'Delete Material'}
                description={`"${deleteConfirm.label}" will be permanently removed. This cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                isPending={deleteLessonPlanMutation.isPending || deleteMaterialMutation.isPending}
            />

            {(loadingAllocations || loadingLessonPlans || loadingMaterials) && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {loadingAllocations ? 'Loading allocations...' : ''}
                </div>
            )}
        </div>
    );
};

export default LessonPlans;
