import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, School, Mail, Trash2, Edit, X, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../utils/api';
import SearchableSelect from '../../components/ui/SearchableSelect';
import './Workstream.css';

const SchoolManagerAssignment = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [loading, setLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [managers, setManagers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [newManager, setNewManager] = useState({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // 'all' | 'active' | 'inactive'

    const fetchData = async () => {
        setLoading(true);
        try {
            const [managersData, schoolsData] = await Promise.all([
                api.get('/users/?role=manager_school', { params: { include_inactive: true } }),
                // Backend: EduTraker/school/urls.py -> path("school/", SchoolListAPIView...)
                api.get('/school/', { params: { include_inactive: true } })
            ]);

            const managersArray = Array.isArray(managersData?.results)
                ? managersData.results
                : Array.isArray(managersData)
                    ? managersData
                    : [];

            const schoolsArray = Array.isArray(schoolsData?.results)
                ? schoolsData.results
                : Array.isArray(schoolsData)
                    ? schoolsData
                    : [];

            setManagers(managersArray);
            setSchools(schoolsArray);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setManagers([]);
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignManager = async (e) => {
        e.preventDefault();
        try {
            if (newManager.isEditing) {
                await api.patch(`/users/${newManager.id}/`, {
                    full_name: newManager.full_name,
                    email: newManager.email,
                    school: newManager.schoolId || null,
                });
            } else {
                // For manager_workstream creators, backend requires work_stream to match
                // the creator's work_stream_id, otherwise it raises "Invalid work stream assignment."
                const workStreamId = user?.work_stream ?? user?.work_stream_id ?? null;

                await api.post('/users/create/', {
                    full_name: newManager.full_name,
                    email: newManager.email,
                    password: newManager.password || 'Password123!',
                    role: 'manager_school',
                    work_stream: workStreamId,
                    school: newManager.schoolId || null,
                });
            }
            fetchData();
            setNewManager({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
            setShowAssignForm(false);
            showSuccess(newManager.isEditing ? 'Manager updated successfully' : 'Manager created successfully');
            // Refresh sidebar stats
            window.dispatchEvent(new CustomEvent('workstream_stats_updated'));
        } catch (error) {
            console.error('Failed to save manager:', error);
            showError(error?.message || 'Failed to save manager.');
        }
    };

    const handleDeleteManager = async (id) => {
        if (window.confirm(t('workstream.assignments.confirmDelete'))) {
            try {
                await api.post(`/users/${id}/deactivate/`);
                showSuccess('Manager deactivated successfully');
                fetchData();
                // Refresh sidebar stats
                window.dispatchEvent(new CustomEvent('workstream_stats_updated'));
            } catch (error) {
                console.error('Failed to deactivate manager:', error);
                showError(error?.message || 'Failed to deactivate manager');
            }
        }
    };

    const handleActivateManager = async (id) => {
        try {
            await api.post(`/users/${id}/activate/`);
            showSuccess('Manager activated successfully');
            fetchData();
            // Refresh sidebar stats
            window.dispatchEvent(new CustomEvent('workstream_stats_updated'));
        } catch (error) {
            console.error('Failed to activate manager:', error);
            showError(error?.message || 'Failed to activate manager');
        }
    };

    const handleEditManager = (id) => {
        const manager = managers.find(m => m.id === id);
        if (manager) {
            setNewManager({
                full_name: manager.full_name,
                email: manager.email,
                schoolId: manager.school || '',
                isEditing: true,
                id: manager.id,
                password: '' // Don't show password on edit
            });
            setShowAssignForm(true);
        }
    };

    // Ensure we always work with an array to avoid ".filter is not a function" issues
    const safeManagers = Array.isArray(managers) ? managers : [];
    const filteredManagers = safeManagers.filter((manager) => {
        const matchesSearch =
            (manager.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (manager.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (manager.school_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                    ? manager.is_active
                    : !manager.is_active;

        return matchesSearch && matchesStatus;
    });

    if (loading && managers.length === 0) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>{t('common.loading')}</div>;
    }

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.assignments.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.assignments.subtitle')}</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAssignForm(true)}>
                        <UserPlus size={20} />
                        {t('users.create')}
                    </button>
                </div>
            </div>

            {showAssignForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>{newManager.isEditing ? t('workstream.assignments.form.editTitle') : t('workstream.assignments.form.createTitle')}</h3>
                    <form onSubmit={handleAssignManager} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.managerName')}</label>
                            <input
                                type="text"
                                required
                                value={newManager.full_name}
                                onChange={(e) => setNewManager({ ...newManager, full_name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder={t('workstream.assignments.form.managerName')}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.email')}</label>
                            <input
                                type="email"
                                required
                                value={newManager.email}
                                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="email@example.com"
                            />
                        </div>
                        {!newManager.isEditing && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.password')}</label>
                                <input
                                    type="password"
                                    required
                                    value={newManager.password}
                                    onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.assignTo')}</label>
                            <SearchableSelect
                                options={schools.map(s => ({ value: s.id, label: s.school_name }))}
                                value={newManager.schoolId}
                                onChange={(val) => setNewManager({ ...newManager, schoolId: val })}
                                placeholder={t('workstream.assignments.form.selectSchool')}
                                searchPlaceholder={t('workstream.assignments.searchSchools')}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>{newManager.isEditing ? t('workstream.assignments.updateBtn') : t('workstream.assignments.assignBtn')}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setNewManager({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('workstream.assignments.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 2.25rem 0.5rem 2.25rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {t('common.filterByStatus')}
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
                            <option value="all">{t('common.all')}</option>
                            <option value="active">{t('common.status.active')}</option>
                            <option value="inactive">{t('common.status.inactive')}</option>
                        </select>
                    </div>
                </div>

                <div className="assignment-table-wrap">
                    <table className="data-table assignment-table">
                        <thead>
                            <tr>
                                <th>{t('workstream.assignments.table.manager')}</th>
                                <th>{t('workstream.assignments.table.assignedSchool')}</th>
                                <th>{t('workstream.assignments.table.status')}</th>
                                <th>{t('workstream.assignments.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredManagers.map((manager) => (
                                <tr key={manager.id}>
                                    <td data-label={t('workstream.assignments.table.manager')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {manager.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{manager.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} /> {manager.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label={t('workstream.assignments.table.assignedSchool')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <School size={16} color="var(--color-text-muted)" />
                                            <span style={{ color: !manager.school ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                                {manager.school_name || t('workstream.assignments.unassigned')}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label={t('workstream.assignments.table.status')}>
                                        <span className={`status-badge ${manager.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {manager.is_active ? t('common.status.active') : t('common.status.inactive')}
                                        </span>
                                    </td>
                                    <td data-label={t('workstream.assignments.table.actions')}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEditManager(manager.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                                title={t('workstream.assignments.editTooltip')}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {manager.is_active ? (
                                                <button
                                                    onClick={() => handleDeleteManager(manager.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                                    title={t('workstream.assignments.deactivateTooltip')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateManager(manager.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-success)' }}
                                                    title={t('common.status.active')}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredManagers.length < 3 && Array.from({ length: 3 - filteredManagers.length }).map((_, index) => (
                                <tr key={`placeholder-${index}`} className="placeholder-row">
                                    <td colSpan="4" style={{ height: '72px' }}>&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SchoolManagerAssignment;
