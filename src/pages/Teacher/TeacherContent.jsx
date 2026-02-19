import React, { useMemo, useState } from 'react';
import {
    BookMarked,
    Download,
    ExternalLink,
    FileText,
    Link as LinkIcon,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCreateLearningMaterialMutation,
    useDeleteLearningMaterialMutation,
    usePublishLearningMaterialMutation,
    useTeacherAllocations,
    useTeacherLearningMaterials,
    useUnpublishLearningMaterialMutation,
    useUpdateLearningMaterialMutation
} from '../../hooks/useTeacherQueries';
import teacherService from '../../services/teacherService';
import { toList } from '../../utils/helpers';
import './Teacher.css';

const emptyForm = {
    contentType: 'link',
    courseId: '',
    gradeId: '',
    classroomId: '',
    title: '',
    description: '',
    externalLink: ''
};

const getMaterialType = (material) =>
    material?.content_type || (material?.external_link ? 'link' : (material?.file_url ? 'file' : 'text'));

const extractDomain = (url = '') => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

const getFileBadge = (material) => {
    const type = String(material?.file_type || '').trim().toUpperCase();
    if (type) return type.includes('/') ? type.split('/').pop() : type;
    const ext = (material?.file_url || '').split('.').pop();
    return ext ? ext.toUpperCase() : 'FILE';
};

const formatDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toId = (v) => (v ? String(v) : '');

/* ─────────────────────────────────────── */

const TeacherContent = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [selectedFile, setSelectedFile] = useState(null);
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [classroomFilter, setClassroomFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [publishOverrides, setPublishOverrides] = useState({});

    /* ── data ── */
    const { data: allocationsData, isLoading: loadingAllocations } = useTeacherAllocations();
    const allocations = useMemo(() => toList(allocationsData), [allocationsData]);

    const materialFilters = useMemo(() => {
        const f = { ordering: '-created_at', page_size: 200 };
        if (courseFilter) f.course = courseFilter;
        if (classroomFilter) f.classroom = classroomFilter;
        if (typeFilter !== 'all') f.content_type = typeFilter;
        if (statusFilter !== 'all') f.is_published = statusFilter === 'published';
        if (search.trim()) f.search = search.trim();
        return f;
    }, [classroomFilter, courseFilter, search, statusFilter, typeFilter]);

    const { data: materialsData, isLoading: loadingMaterials, isFetching } =
        useTeacherLearningMaterials(materialFilters);

    const createMut = useCreateLearningMaterialMutation();
    const updateMut = useUpdateLearningMaterialMutation();
    const deleteMut = useDeleteLearningMaterialMutation();
    const publishMut = usePublishLearningMaterialMutation();
    const unpublishMut = useUnpublishLearningMaterialMutation();

    const materials = useMemo(() =>
        [...toList(materialsData)].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ), [materialsData]);

    /* ── derived lists ── */
    const courses = useMemo(() => {
        const map = new Map();
        allocations.forEach((a) => {
            if (!map.has(a.course_id))
                map.set(a.course_id, { id: a.course_id, name: a.course_name || `Course ${a.course_id}` });
        });
        return [...map.values()];
    }, [allocations]);

    const filterClassrooms = useMemo(() => {
        const map = new Map();
        allocations
            .filter((a) => !courseFilter || toId(a.course_id) === toId(courseFilter))
            .forEach((a) => {
                if (!map.has(a.class_room_id))
                    map.set(a.class_room_id, { id: a.class_room_id, name: a.classroom_name || `Classroom ${a.class_room_id}` });
            });
        return [...map.values()];
    }, [allocations, courseFilter]);

    const modalGrades = useMemo(() => {
        const map = new Map();
        allocations
            .filter((a) => !form.courseId || toId(a.course_id) === toId(form.courseId))
            .forEach((a) => {
                if (!map.has(a.grade_id)) {
                    map.set(a.grade_id, { id: a.grade_id, name: a.grade_name || `Grade ${a.grade_id}` });
                }
            });
        return [...map.values()];
    }, [allocations, form.courseId]);

    const effectiveModalGrade = modalGrades.some((g) => toId(g.id) === toId(form.gradeId))
        ? form.gradeId
        : (modalGrades[0] ? toId(modalGrades[0].id) : '');

    const modalClassrooms = useMemo(() => {
        const map = new Map();
        allocations
            .filter((a) =>
                (!form.courseId || toId(a.course_id) === toId(form.courseId))
                && (!effectiveModalGrade || toId(a.grade_id) === toId(effectiveModalGrade))
            )
            .forEach((a) => {
                if (!map.has(a.class_room_id))
                    map.set(a.class_room_id, { id: a.class_room_id, name: a.classroom_name || `Classroom ${a.class_room_id}` });
            });
        return [...map.values()];
    }, [allocations, effectiveModalGrade, form.courseId]);

    const effectiveClassroom = filterClassrooms.some((c) => toId(c.id) === toId(classroomFilter))
        ? classroomFilter : '';

    const allowAllClassroomsTarget = !editingMaterial && Boolean(effectiveModalGrade) && modalClassrooms.length >= 1;

    const modalClassroomValue = form.classroomId === 'all' && allowAllClassroomsTarget
        ? 'all'
        : (modalClassrooms.some((c) => toId(c.id) === toId(form.classroomId))
            ? form.classroomId
            : (modalClassrooms[0] ? toId(modalClassrooms[0].id) : ''));

    /* ── helpers ── */
    const findAllocation = (cId, clId) => {
        const matches = allocations.filter(
            (a) => toId(a.course_id) === toId(cId) && toId(a.class_room_id) === toId(clId)
        );
        if (!matches.length) {
            return null;
        }
        return matches.find((a) => !effectiveModalGrade || toId(a.grade_id) === toId(effectiveModalGrade)) || matches[0];
    };

    const resolvePublished = (m) =>
        Object.prototype.hasOwnProperty.call(publishOverrides, m.id)
            ? publishOverrides[m.id]
            : Boolean(m.is_published);

    const isBusy = createMut.isPending || updateMut.isPending || deleteMut.isPending
        || publishMut.isPending || unpublishMut.isPending;

    /* ── modal open/close ── */
    const openCreate = () => {
        const fc = courses[0];
        const fcl = allocations.find((a) => !fc || toId(a.course_id) === toId(fc.id));
        setEditingMaterial(null);
        setForm({
            ...emptyForm,
            courseId: fc ? toId(fc.id) : '',
            gradeId: fcl ? toId(fcl.grade_id) : '',
            classroomId: fcl ? toId(fcl.class_room_id) : ''
        });
        setSelectedFile(null);
        setShowModal(true);
    };

    const openEdit = (m) => {
        const matchedAllocation = allocations.find(
            (a) => toId(a.course_id) === toId(m.course) && toId(a.class_room_id) === toId(m.classroom)
        );

        setEditingMaterial(m);
        setForm({
            contentType: getMaterialType(m),
            courseId: toId(m.course),
            gradeId: matchedAllocation ? toId(matchedAllocation.grade_id) : '',
            classroomId: toId(m.classroom),
            title: m.title || '',
            description: m.description || '',
            externalLink: m.external_link || ''
        });
        setSelectedFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMaterial(null);
        setForm(emptyForm);
        setSelectedFile(null);
    };

    const handleCourseChange = (cId) => {
        setForm((p) => {
            const courseAllocations = allocations.filter((a) => toId(a.course_id) === toId(cId));
            const sameGrade = courseAllocations.find((a) => toId(a.grade_id) === toId(p.gradeId));
            const next = sameGrade || courseAllocations[0];

            return {
                ...p,
                courseId: cId,
                gradeId: next ? toId(next.grade_id) : '',
                classroomId: next ? toId(next.class_room_id) : ''
            };
        });
    };

    const handleGradeChange = (gradeId) => {
        const next = allocations.find(
            (a) => toId(a.course_id) === toId(form.courseId) && toId(a.grade_id) === toId(gradeId)
        );

        setForm((p) => ({
            ...p,
            gradeId,
            classroomId: next ? toId(next.class_room_id) : ''
        }));
    };

    /* ── validation + payload ── */
    const validate = () => {
        if (!form.title.trim()) { toast.error('Title is required.'); return false; }
        if (!form.courseId) { toast.error('Course is required.'); return false; }
        if (!effectiveModalGrade) { toast.error('Grade is required.'); return false; }
        if (!form.classroomId && !modalClassroomValue) { toast.error('Classroom is required.'); return false; }
        if (form.contentType === 'link' && !form.externalLink.trim()) { toast.error('Please provide a URL.'); return false; }
        if (form.contentType === 'text' && !form.description.trim()) { toast.error('Description is required for text content.'); return false; }
        if (!editingMaterial && form.contentType === 'file' && !selectedFile) { toast.error('Please choose a file.'); return false; }
        return true;
    };

    const buildPayload = (clId) => {
        const alloc = findAllocation(form.courseId, clId);
        if (!alloc) throw new Error('Invalid course/classroom selection.');
        const common = {
            title: form.title.trim(),
            description: form.description.trim(),
            course: Number(form.courseId),
            classroom: Number(clId),
            academic_year: Number(alloc.academic_year_id),
            content_type: form.contentType,
            is_published: editingMaterial ? Boolean(editingMaterial.is_published) : false
        };
        if (form.contentType === 'link') return { ...common, external_link: form.externalLink.trim() };
        if (form.contentType === 'text') return common;
        if (selectedFile) {
            const fd = new FormData();
            Object.entries(common).forEach(([k, v]) => fd.append(k, String(v)));
            fd.append('file', selectedFile);
            return fd;
        }
        return common;
    };

    /* ── CRUD ── */
    const handleCreate = async ({ publishNow }) => {
        if (!validate()) return;
        try {
            const targetClassrooms = modalClassroomValue === 'all'
                ? modalClassrooms.map((c) => toId(c.id))
                : [modalClassroomValue];

            if (!targetClassrooms.length || targetClassrooms.some((id) => !id)) {
                toast.error('Please select a classroom.');
                return;
            }

            for (const clId of targetClassrooms) {
                const payload = buildPayload(clId);
                const created = await createMut.mutateAsync(payload);
                if (publishNow) await publishMut.mutateAsync(created.id);
            }

            const count = targetClassrooms.length;
            if (publishNow) {
                toast.success(count > 1 ? `Content published to ${count} classrooms.` : 'Content published.');
            } else {
                toast.success(count > 1 ? `Saved as draft for ${count} classrooms.` : 'Saved as draft.');
            }
            closeModal();
        } catch (e) { toast.error(e?.message || 'Failed to save.'); }
    };

    const handleUpdate = async () => {
        if (!editingMaterial || !validate()) return;
        try {
            await updateMut.mutateAsync({ id: editingMaterial.id, payload: buildPayload(modalClassroomValue) });
            toast.success('Content updated.');
            closeModal();
        } catch (e) { toast.error(e?.message || 'Failed to update.'); }
    };

    const handleDelete = async (m) => {
        if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
        try { await deleteMut.mutateAsync(m.id); toast.success('Deleted.'); }
        catch (e) { toast.error(e?.message || 'Failed to delete.'); }
    };

    const handlePublishToggle = async (m) => {
        const prev = resolvePublished(m);
        const next = !prev;
        setPublishOverrides((s) => ({ ...s, [m.id]: next }));
        try {
            if (next) { await publishMut.mutateAsync(m.id); toast.success('Published.'); }
            else { await unpublishMut.mutateAsync(m.id); toast.success('Moved to draft.'); }
        } catch (e) {
            setPublishOverrides((s) => ({ ...s, [m.id]: prev }));
            toast.error(e?.message || 'Failed to update status.');
        } finally {
            setPublishOverrides((s) => { const n = { ...s }; delete n[m.id]; return n; });
        }
    };

    const handleOpen = async (m) => {
        const type = getMaterialType(m);
        if (type === 'text') {
            toast('This item has description only.');
            return;
        }
        if (type === 'link') { window.open(m.external_link, '_blank', 'noopener,noreferrer'); return; }
        try { await teacherService.downloadMaterial(m); }
        catch (e) { toast.error(e?.message || 'Failed to download.'); }
    };

    /* ── stats ── */
    const publishedCount = materials.filter(resolvePublished).length;
    const draftCount = materials.length - publishedCount;

    const loading = loadingMaterials || loadingAllocations;

    /* ─────────────────────── render ─────────────────────── */
    return (
        <div className="teacher-page">

            {/* ── Page header ── */}
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">Course Content</h1>
                    <p className="teacher-subtitle">
                        Publish links, files, or description-only content for your classrooms.
                    </p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Add Content
                </button>
            </div>

            {/* ── Filter bar ── */}
            <div className="management-card" style={{ padding: '0.85rem 1.1rem' }}>
                <div className="tcf-bar">
                    {/* Course */}
                    <select
                        className="tcf-select"
                        value={courseFilter}
                        onChange={(e) => { setCourseFilter(e.target.value); setClassroomFilter(''); }}
                    >
                        <option value="">All Courses</option>
                        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* Classroom */}
                    <select
                        className="tcf-select"
                        value={effectiveClassroom}
                        onChange={(e) => setClassroomFilter(e.target.value)}
                    >
                        <option value="">All Classrooms</option>
                        {filterClassrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* Type pills */}
                    <div className="tcf-pill-row">
                        {['all', 'file', 'link', 'text'].map((v) => (
                            <button
                                key={v}
                                type="button"
                                className={`tcf-pill${typeFilter === v ? ' active' : ''}`}
                                onClick={() => setTypeFilter(v)}
                            >
                                {v === 'all' ? 'All Types' : v === 'file' ? 'Files' : v === 'link' ? 'Links' : 'Text'}
                            </button>
                        ))}
                    </div>

                    {/* Status pills */}
                    <div className="tcf-pill-row">
                        {[
                            { v: 'all', label: 'All' },
                            { v: 'published', label: 'Published' },
                            { v: 'draft', label: 'Drafts' }
                        ].map(({ v, label }) => (
                            <button
                                key={v}
                                type="button"
                                className={`tcf-pill${statusFilter === v ? ' active' : ''}`}
                                onClick={() => setStatusFilter(v)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="tcf-search-wrap">
                        <Search size={14} className="tcf-search-icon" />
                        <input
                            type="text"
                            className="tcf-search"
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button type="button" className="tcf-search-clear" onClick={() => setSearch('')}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content list ── */}
            <div className="management-card">
                {/* table header */}
                <div className="tcl-head">
                    <span className="tcl-head-col tcl-col-type">Type</span>
                    <span className="tcl-head-col tcl-col-title">Title</span>
                    <span className="tcl-head-col tcl-col-course">Course · Class</span>
                    <span className="tcl-head-col tcl-col-date">Added</span>
                    <span className="tcl-head-col tcl-col-status">Status</span>
                    <span className="tcl-head-col tcl-col-actions">Actions</span>
                </div>

                {/* loading */}
                {loading && (
                    <div className="tcl-empty">
                        <Loader2 size={20} className="spinning" />
                        <span>Loading content…</span>
                    </div>
                )}

                {/* empty */}
                {!loading && materials.length === 0 && (
                    <div className="tcl-empty">
                        <BookMarked size={20} style={{ opacity: 0.4 }} />
                        <span>No content found. Adjust your filters or add new content.</span>
                    </div>
                )}

                {/* rows */}
                {!loading && materials.length > 0 && (
                    <>
                        {materials.map((m) => {
                            const type = getMaterialType(m);
                            const published = resolvePublished(m);
                            const typeClass = type === 'link'
                                ? 'tcl-type-link'
                                : (type === 'text' ? 'tcl-type-text' : 'tcl-type-file');
                            const typeLabel = type === 'link'
                                ? (extractDomain(m.external_link) || 'Link')
                                : (type === 'text' ? 'Text' : getFileBadge(m));
                            return (
                                <div key={m.id} className="tcl-row">
                                    {/* type icon */}
                                    <div className="tcl-col-type">
                                        <span className={`tcl-type-chip ${typeClass}`}>
                                            {type === 'link' ? <LinkIcon size={13} /> : type === 'text' ? <BookMarked size={13} /> : <FileText size={13} />}
                                            {typeLabel}
                                        </span>
                                    </div>

                                    {/* title + description */}
                                    <div className="tcl-col-title">
                                        <span className="tcl-title-text">{m.title}</span>
                                        {m.description && (
                                            <span className="tcl-desc-text">{m.description}</span>
                                        )}
                                    </div>

                                    {/* course · classroom */}
                                    <div className="tcl-col-course">
                                        <span className="tcl-meta-text">
                                            {m.course_name || `Course ${m.course}`}
                                        </span>
                                        <span className="tcl-meta-sub">
                                            {m.classroom_name || `Class ${m.classroom}`}
                                        </span>
                                    </div>

                                    {/* date */}
                                    <div className="tcl-col-date tcl-meta-text">
                                        {formatDate(m.created_at)}
                                    </div>

                                    {/* status toggle */}
                                    <div className="tcl-col-status">
                                        <button
                                            type="button"
                                            className={`tcl-toggle ${published ? 'tcl-toggle--pub' : 'tcl-toggle--draft'}`}
                                            onClick={() => handlePublishToggle(m)}
                                            disabled={isBusy}
                                        >
                                            {published ? 'Published' : 'Draft'}
                                        </button>
                                    </div>

                                    {/* actions */}
                                    <div className="tcl-col-actions">
                                        {type !== 'text' && (
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                title={type === 'link' ? 'Open link' : 'Download'}
                                                onClick={() => handleOpen(m)}
                                            >
                                                {type === 'link' ? <ExternalLink size={14} /> : <Download size={14} />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            title="Edit"
                                            onClick={() => openEdit(m)}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-btn danger"
                                            title="Delete"
                                            onClick={() => handleDelete(m)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* footer count */}
                        <div className="tcl-footer">
                            <span>{materials.length} item{materials.length !== 1 ? 's' : ''}</span>
                            <span>{publishedCount} published · {draftCount} draft{draftCount !== 1 ? 's' : ''}</span>
                            {isFetching && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Loader2 size={12} className="spinning" /> Refreshing…</span>}
                        </div>
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div
                    className="tc-overlay"
                    onClick={isBusy ? undefined : closeModal}
                >
                    <div
                        className="management-card tc-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* modal header */}
                        <div className="tc-modal-head">
                            <h2 className="tc-modal-title">
                                {editingMaterial ? 'Edit Content' : 'Add Content'}
                            </h2>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={closeModal}
                                disabled={isBusy}
                                style={{ width: 'auto', padding: '0.35rem' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* modal body */}
                        <div className="tc-modal-body">
                            {/* type toggle */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label className="tc-field-label">Content Type</label>
                                <div className="tc-type-toggle">
                                    {['link', 'file', 'text'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`tc-type-btn${form.contentType === t ? ' active' : ''}`}
                                            onClick={() => {
                                                setForm((p) => ({ ...p, contentType: t }));
                                                if (t !== 'file') {
                                                    setSelectedFile(null);
                                                }
                                            }}
                                            disabled={Boolean(editingMaterial)}
                                        >
                                            {t === 'link' ? <LinkIcon size={13} /> : t === 'file' ? <FileText size={13} /> : <BookMarked size={13} />}
                                            {t === 'link' ? 'Link' : t === 'file' ? 'File' : 'Text'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="tc-modal-grid">
                                <div className="tc-field">
                                    <label className="tc-field-label" htmlFor="cm-course">Course</label>
                                    <select
                                        id="cm-course"
                                        className="tc-select"
                                        value={form.courseId}
                                        onChange={(e) => handleCourseChange(e.target.value)}
                                    >
                                        <option value="">Select course</option>
                                        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="tc-field">
                                    <label className="tc-field-label" htmlFor="cm-grade">Grade</label>
                                    <select
                                        id="cm-grade"
                                        className="tc-select"
                                        value={effectiveModalGrade}
                                        onChange={(e) => handleGradeChange(e.target.value)}
                                    >
                                        <option value="">Select grade</option>
                                        {modalGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <div className="tc-field tc-field--full">
                                    <label className="tc-field-label" htmlFor="cm-cls">Classroom</label>
                                    <select
                                        id="cm-cls"
                                        className="tc-select"
                                        value={modalClassroomValue}
                                        onChange={(e) => setForm((p) => ({ ...p, classroomId: e.target.value }))}
                                    >
                                        <option value="">Select classroom</option>
                                        {allowAllClassroomsTarget && (
                                            <option value="all">All classrooms across this grade</option>
                                        )}
                                        {modalClassrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="tc-field tc-field--full">
                                    <label className="tc-field-label" htmlFor="cm-title">Title</label>
                                    <input
                                        id="cm-title"
                                        className="tc-select"
                                        type="text"
                                        placeholder="Content title…"
                                        value={form.title}
                                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    />
                                </div>

                                <div className="tc-field tc-field--full">
                                    <label className="tc-field-label" htmlFor="cm-desc">Description</label>
                                    <textarea
                                        id="cm-desc"
                                        className="tc-select"
                                        rows={3}
                                        placeholder={form.contentType === 'text'
                                            ? 'Required description for text content…'
                                            : 'Optional description…'}
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>

                                {form.contentType === 'link' && (
                                    <div className="tc-field tc-field--full">
                                        <label className="tc-field-label" htmlFor="cm-url">URL</label>
                                        <input
                                            id="cm-url"
                                            className="tc-select"
                                            type="url"
                                            placeholder="https://…"
                                            value={form.externalLink}
                                            onChange={(e) => setForm((p) => ({ ...p, externalLink: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {form.contentType === 'file' && (
                                    <div className="tc-field tc-field--full">
                                        <label className="tc-field-label" htmlFor="cm-file">File</label>
                                        <input
                                            id="cm-file"
                                            type="file"
                                            className="tc-select"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            style={{ padding: '0.4rem 0.65rem', cursor: 'pointer' }}
                                        />
                                        {selectedFile && (
                                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                                                {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* modal footer */}
                        <div className="tc-modal-footer">
                            <button
                                type="button"
                                className="icon-btn"
                                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                                onClick={closeModal}
                                disabled={isBusy}
                            >
                                Cancel
                            </button>

                            {editingMaterial ? (
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleUpdate}
                                    disabled={isBusy}
                                >
                                    {isBusy && <Loader2 size={14} className="spinning" />}
                                    Save Changes
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                                        onClick={() => handleCreate({ publishNow: false })}
                                        disabled={isBusy}
                                    >
                                        {isBusy && <Loader2 size={14} className="spinning" />}
                                        Save as Draft
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => handleCreate({ publishNow: true })}
                                        disabled={isBusy}
                                    >
                                        {isBusy && <Loader2 size={14} className="spinning" />}
                                        Publish Now
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherContent;
