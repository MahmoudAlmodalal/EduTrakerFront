import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Users, Edit, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../utils/api';
import Modal from '../../components/ui/Modal';
import './Workstream.css';

const SchoolManagement = () => {
    const { t } = useTheme();
    const { user, workstreamId } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showActivateAllModal, setShowActivateAllModal] = useState(false);
    const [isActivatingAll, setIsActivatingAll] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [schoolToDelete, setSchoolToDelete] = useState(null);
    const [schools, setSchools] = useState([]);
    const [newSchool, setNewSchool] = useState({ school_name: '', location: '', capacity: '', isEditing: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewSchool, setViewSchool] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

    const fetchSchools = async () => {
        setLoading(true);
        try {
            // Ask backend to include inactive schools as well so we can filter by status client-side
            const data = await api.get('/school/', {
                params: { include_inactive: true },
            });
            // Be defensive: always coerce to an array so .filter/.map are safe
            const schoolsData = Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data)
                ? data
                : [];
            setSchools(schoolsData);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
            setSchools([]); // ensure we never keep a non-array value
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleCreateSchool = async (e) => {
        e.preventDefault();
        try {
            const normalizedLocation = newSchool.location?.trim() || null;
            const normalizedCapacity = newSchool.capacity === '' ? null : parseInt(newSchool.capacity, 10);

            if (newSchool.isEditing) {
                await api.patch(`/school/${newSchool.id}/update/`, {
                    school_name: newSchool.school_name,
                    location: normalizedLocation,
                    capacity: Number.isNaN(normalizedCapacity) ? null : normalizedCapacity,
                });
            } else {
                // SchoolCreateInputSerializer requires: school_name, work_stream (as PK int)
                // Try several possible sources for the workstream ID from auth context/backend payload
                const rawWsId =
                    workstreamId ??
                    user?.work_stream ?? // from WorkstreamLoginOutputSerializer
                    user?.work_stream_id ??
                    user?.workstream_id;
                const wsId = rawWsId != null ? parseInt(rawWsId, 10) : null;
                const payload = {
                    school_name: newSchool.school_name,
                    location: normalizedLocation,
                    capacity: Number.isNaN(normalizedCapacity) ? null : normalizedCapacity,
                };

                if (!wsId || Number.isNaN(wsId)) {
                    await api.post('/school/create/', payload);
                } else {
                    await api.post('/school/create/', {
                        ...payload,
                        work_stream: wsId,
                    });
                }
            }
            fetchSchools();
            setNewSchool({ school_name: '', location: '', capacity: '', isEditing: false, id: null });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Failed to save school:', error);
            showError(`Error: ${error.message}`);
        }
    };

    const handleActivateAll = async () => {
        setIsActivatingAll(true);
        try {
            const result = await api.post('/school/activate-all/');
            if (result?.activated !== undefined) {
                if (result.activated > 0) {
                    showSuccess(
                        `Activated ${result.activated} school${result.activated === 1 ? '' : 's'}${result.errors?.length ? ` (${result.errors.length} issue${result.errors.length === 1 ? '' : 's'})` : ''}.`
                    );
                } else {
                    showInfo('All schools are already active.');
                }
            } else {
                showSuccess('Schools activated successfully.');
            }
            setShowActivateAllModal(false);
            fetchSchools();
        } catch (error) {
            console.error('Failed to activate schools:', error);
            showError(`Error: ${error.message}`);
        } finally {
            setIsActivatingAll(false);
        }
    };

    const handleRequestDeleteSchool = (school) => {
        setSchoolToDelete(school);
        setShowDeleteModal(true);
    };

    const handleDeleteSchool = async () => {
        if (!schoolToDelete?.id) return;
        setIsDeleting(true);
        try {
            await api.post(`/school/${schoolToDelete.id}/deactivate/`);
            showSuccess(`"${schoolToDelete.school_name}" deactivated successfully.`);
            setShowDeleteModal(false);
            setSchoolToDelete(null);
            fetchSchools();
        } catch (error) {
            console.error('Failed to delete school:', error);
            showError(`Error: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (school) => {
        const endpoint = school.is_active ? 'deactivate' : 'activate';
        try {
            await api.post(`/school/${school.id}/${endpoint}/`);
            fetchSchools();
        } catch (error) {
            console.error(`Failed to ${endpoint} school:`, error);
        }
    };

    const handleEditSchool = (id) => {
        const schoolToEdit = schools.find(s => s.id === id);
        if (schoolToEdit) {
            setNewSchool({
                school_name: schoolToEdit.school_name,
                location: schoolToEdit.location ?? '',
                capacity: schoolToEdit.capacity ?? '',
                isEditing: true,
                id: schoolToEdit.id
            });
            setShowCreateForm(true);
        }
    };

    // Extra safety: ensure we always work with an array to avoid "l.filter is not a function" errors
    const safeSchools = Array.isArray(schools) ? schools : [];
    const filteredSchools = safeSchools.filter((school) => {
        const matchesSearch =
            (school.school_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (school.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                ? school.is_active
                : !school.is_active;

        return matchesSearch && matchesStatus;
    });

    if (loading && schools.length === 0) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    }

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div className="school-management-header-row">
                    <div>
                        <h1 className="workstream-title">{t('workstream.schools.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.schools.subtitle')}</p>
                    </div>
                    <div className="school-management-header-actions">
                        <button
                            className="btn-secondary workstream-activate-all-btn"
                            onClick={() => setShowActivateAllModal(true)}
                            type="button"
                        >
                            <CheckCircle size={18} />
                            {t('workstream.schools.activateAll')}
                        </button>
                        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                            <Plus size={20} />
                            {t('workstream.schools.create')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create/Edit School Modal */}
            <Modal
                isOpen={showCreateForm}
                onClose={() => {
                    setShowCreateForm(false);
                    setNewSchool({ school_name: '', location: '', capacity: '', isEditing: false, id: null });
                }}
                title={newSchool.isEditing ? t('workstream.schools.form.editTitle') : t('workstream.schools.form.createTitle')}
            >
                <form onSubmit={handleCreateSchool} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.name')}</label>
                        <input
                            type="text"
                            required
                            value={newSchool.school_name}
                            onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder={t('workstream.schools.form.name')}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.location')}</label>
                        <input
                            type="text"
                            required
                            value={newSchool.location}
                            onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder={t('workstream.schools.form.location')}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.schools.form.capacity')}</label>
                        <input
                            type="number"
                            required
                            value={newSchool.capacity}
                            onChange={(e) => setNewSchool({ ...newSchool, capacity: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder={t('workstream.schools.form.capacity')}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateForm(false);
                                setNewSchool({ school_name: '', location: '', capacity: '', isEditing: false, id: null });
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {newSchool.isEditing ? t('common.save') : t('common.create')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showActivateAllModal}
                onClose={() => !isActivatingAll && setShowActivateAllModal(false)}
                title={t('workstream.schools.activateAll')}
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                        {t('workstream.schools.confirmActivate')}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowActivateAllModal(false)}
                            disabled={isActivatingAll}
                            style={{
                                padding: '0.55rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                cursor: isActivatingAll ? 'not-allowed' : 'pointer',
                                opacity: isActivatingAll ? 0.65 : 1
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleActivateAll}
                            disabled={isActivatingAll}
                            className="btn-primary"
                        >
                            {isActivatingAll ? t('common.loading') : t('workstream.schools.activateAll')}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Deactivate School"
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                        {t('workstream.schools.confirmDelete')}
                    </p>
                    {schoolToDelete?.school_name && (
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {schoolToDelete.school_name}
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSchoolToDelete(null);
                            }}
                            disabled={isDeleting}
                            style={{
                                padding: '0.55rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.65 : 1
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSchool}
                            disabled={isDeleting}
                            className="btn-primary"
                            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
                        >
                            {isDeleting ? t('common.loading') : 'Deactivate'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* View School Details Modal */}
            <Modal
                isOpen={!!viewSchool}
                onClose={() => setViewSchool(null)}
                title={viewSchool?.school_name || 'School Details'}
            >
                {viewSchool && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.name')}</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{viewSchool.school_name}</div>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.location')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> {viewSchool.location || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.capacity')}</label>
                            <div>{viewSchool.student_count || 0} / {viewSchool.capacity || 0} {t('workstream.schools.table.students')}</div>
                            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px' }}>
                                <div style={{
                                    width: `${viewSchool.capacity ? (viewSchool.student_count / viewSchool.capacity) * 100 : 0}%`,
                                    height: '100%',
                                    background: 'var(--color-primary)',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.status')}</label>
                            <div>
                                <span className={`status-badge ${viewSchool.is_active ? 'status-active' : 'status-inactive'}`}>
                                    {viewSchool.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="management-card">
                <div className="table-header-actions school-management-filters">
                    <div className="school-management-search">
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)',
                            }}
                        />
                        <input
                            type="text"
                            placeholder={t('workstream.schools.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)',
                            }}
                        />
                    </div>

                    <div className="school-management-filter-group">
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Filter by status
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)',
                                background: 'white',
                                fontSize: '0.85rem',
                            }}
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="school-management-table-wrap">
                    <table className="data-table school-management-table">
                        <thead>
                            <tr>
                                <th>{t('workstream.schools.table.name')}</th>
                                <th>{t('workstream.schools.table.location')}</th>
                                <th>{t('workstream.schools.table.capacity')}</th>
                                <th>{t('workstream.schools.table.status')}</th>
                                <th>{t('workstream.schools.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchools.length === 0 && (
                                <tr className="school-management-empty-row">
                                    <td className="school-management-empty-cell" colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No schools found.
                                    </td>
                                </tr>
                            )}
                            {filteredSchools.map((school) => (
                                <tr key={school.id}>
                                    <td data-label={t('workstream.schools.table.name')}>
                                        <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{school.school_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{school.id}</div>
                                    </td>
                                    <td data-label={t('workstream.schools.table.location')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)' }}>
                                            <MapPin size={14} />
                                            {school.location}
                                        </div>
                                    </td>
                                    <td data-label={t('workstream.schools.table.capacity')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Users size={14} color="var(--color-text-muted)" />
                                            <span>{school.student_count || 0} / {school.capacity}</span>
                                        </div>
                                        <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                            <div style={{
                                                width: `${(school.student_count / school.capacity) * 100 || 0}%`,
                                                height: '100%',
                                                background: 'var(--color-primary)',
                                                borderRadius: '2px'
                                            }}></div>
                                        </div>
                                    </td>
                                    <td data-label={t('workstream.schools.table.status')}>
                                        <span
                                            onClick={() => handleToggleStatus(school)}
                                            className={`status-badge ${school.is_active ? 'status-active' : 'status-inactive'}`}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to toggle status"
                                        >
                                            {school.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="school-management-actions-cell" data-label={t('workstream.schools.table.actions')}>
                                        <div className="school-management-row-actions">
                                            <button
                                                onClick={() => setViewSchool(school)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-text-main)' }}
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditSchool(school.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                                title="Edit School"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRequestDeleteSchool(school)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                                title="Deactivate School"
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
        </div>
    );
};

export default SchoolManagement;
