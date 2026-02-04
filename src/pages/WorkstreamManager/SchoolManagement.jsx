import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Users, Edit, CheckCircle, Eye, Trash2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import './Workstream.css';

const SchoolManagement = () => {
    const { t } = useTheme();
    const { user, workstreamId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
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
            if (newSchool.isEditing) {
                // Backend update endpoint currently only accepts "school_name"
                await api.patch(`/school/${newSchool.id}/update/`, {
                    school_name: newSchool.school_name,
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

                if (!wsId || Number.isNaN(wsId)) {
                    // Fall back to letting the backend raise a validation error
                    // so the user does not see a hard-blocking frontend exception.
                    await api.post('/school/create/', {
                        school_name: newSchool.school_name,
                    });
                } else {
                    await api.post('/school/create/', {
                        school_name: newSchool.school_name,
                        work_stream: wsId,
                    });
                }
            }
            fetchSchools();
            setNewSchool({ school_name: '', location: '', capacity: '', isEditing: false, id: null });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Failed to save school:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleActivateAll = async () => {
        if (window.confirm(t('workstream.schools.confirmActivate'))) {
            try {
                const result = await api.post('/school/activate-all/');
                // Optionally show how many were activated
                if (result?.activated !== undefined) {
                    alert(`Activated ${result.activated} schools${result.errors?.length ? `, with ${result.errors.length} errors` : ''}.`);
                }
                fetchSchools();
            } catch (error) {
                console.error('Failed to activate schools:', error);
                alert(`Error: ${error.message}`);
            }
        }
    };

    const handleDeleteSchool = async (id) => {
        if (window.confirm(t('workstream.schools.confirmDelete'))) {
            try {
                await api.post(`/school/${id}/deactivate/`);
                fetchSchools();
            } catch (error) {
                console.error('Failed to delete school:', error);
            }
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
                location: schoolToEdit.location,
                capacity: schoolToEdit.capacity,
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.schools.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.schools.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={handleActivateAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>
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

            {showCreateForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>{newSchool.isEditing ? t('workstream.schools.form.editTitle') : t('workstream.schools.form.createTitle')}</h3>
                    <form onSubmit={handleCreateSchool} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
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
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>{newSchool.isEditing ? t('common.save') : t('common.create')}</button>
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
                        </div>
                    </form>
                </div>
            )}

            {viewSchool && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="management-card" style={{ padding: '2rem', width: '500px', maxWidth: '90%', position: 'relative' }}>
                        <button
                            onClick={() => setViewSchool(null)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.schools.table.actions')}</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.name')}</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{viewSchool.school_name}</div>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.location')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} /> {viewSchool.location}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.schools.table.capacity')}</label>
                                <div>{viewSchool.student_count || 0} / {viewSchool.capacity} {t('workstream.schools.table.students')}</div>
                                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px' }}>
                                    <div style={{
                                        width: `${(viewSchool.student_count / viewSchool.capacity) * 100 || 0}%`,
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
                    </div>
                </div>
            )}

            <div className="management-card">
                <div className="table-header-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '280px' }}>
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

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

                <table className="data-table">
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
                        {filteredSchools.map((school) => (
                            <tr key={school.id}>
                                <td>
                                    <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{school.school_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{school.id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)' }}>
                                        <MapPin size={14} />
                                        {school.location}
                                    </div>
                                </td>
                                <td>
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
                                <td>
                                    <span
                                        onClick={() => handleToggleStatus(school)}
                                        className={`status-badge ${school.is_active ? 'status-active' : 'status-inactive'}`}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to toggle status"
                                    >
                                        {school.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                            onClick={() => handleDeleteSchool(school.id)}
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
    );
};

export default SchoolManagement;
