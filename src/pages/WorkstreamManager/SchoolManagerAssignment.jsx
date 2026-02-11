import React, { useState, useEffect } from 'react';
import { UserPlus, Search, School, Mail, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../utils/api';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Modal from '../../components/ui/Modal';
import './Workstream.css';

const SchoolManagerAssignment = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [loading, setLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [managerToDelete, setManagerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [managers, setManagers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [newManager, setNewManager] = useState({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [managersData, schoolsData] = await Promise.all([
                api.get('/users/?role=manager_school'),
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

    const isDuplicateManagerError = (error) => {
        const msg = (error?.message || '').toLowerCase();
        const data = error?.data;
        const hasApiDuplicate =
            msg.includes('already exists') ||
            msg.includes('duplicate') ||
            data?.email?.some?.((item) => String(item).toLowerCase().includes('already exists')) ||
            data?.full_name?.some?.((item) => String(item).toLowerCase().includes('already exists'));

        const normalizedName = (newManager.full_name || '').trim().toLowerCase();
        const hasLocalDuplicateName = managers.some((m) => {
            if (newManager.isEditing && m.id === newManager.id) return false;
            return (m.full_name || '').trim().toLowerCase() === normalizedName;
        });

        return hasApiDuplicate || hasLocalDuplicateName;
    };

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
            showSuccess(newManager.isEditing ? 'Manager updated successfully.' : 'Manager assigned successfully.');
        } catch (error) {
            console.error('Failed to save manager:', error);
            if (isDuplicateManagerError(error)) {
                showWarning(`Manager name "${newManager.full_name.trim()}" already exists. Please use a different name.`);
                return;
            }
            showError(`Error: ${error.message}`);
        }
    };

    const handleRequestDeleteManager = (manager) => {
        setManagerToDelete(manager);
        setShowDeleteModal(true);
    };

    const handleDeleteManager = async () => {
        if (!managerToDelete?.id) return;
        setIsDeleting(true);
        try {
            await api.post(`/users/${managerToDelete.id}/deactivate/`);
            showSuccess(`"${managerToDelete.full_name}" deactivated successfully.`);
            setShowDeleteModal(false);
            setManagerToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Failed to deactivate manager:', error);
            showError(`Error: ${error.message}`);
        } finally {
            setIsDeleting(false);
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
    const filteredManagers = safeManagers.filter((manager) =>
        (manager.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (manager.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (manager.school_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && managers.length === 0) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
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

            {/* Create/Edit School Manager Modal */}
            <Modal
                isOpen={showAssignForm}
                onClose={() => {
                    setShowAssignForm(false);
                    setNewManager({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
                }}
                title={newManager.isEditing ? t('workstream.assignments.form.editTitle') : t('workstream.assignments.form.createTitle')}
            >
                <form onSubmit={handleAssignManager} style={{ display: 'grid', gap: '1rem' }}>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
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
                            searchPlaceholder="Search schools..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
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
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {newManager.isEditing ? t('workstream.assignments.updateBtn') : t('workstream.assignments.assignBtn')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Deactivate Manager"
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                        {t('workstream.assignments.confirmDelete')}
                    </p>
                    {managerToDelete?.full_name && (
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {managerToDelete.full_name}
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setManagerToDelete(null);
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
                            onClick={handleDeleteManager}
                            disabled={isDeleting}
                            className="btn-primary"
                            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
                        >
                            {isDeleting ? t('common.loading') : 'Deactivate'}
                        </button>
                    </div>
                </div>
            </Modal>

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
                                padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                </div>

                <table className="data-table">
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
                                <td>
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
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <School size={16} color="var(--color-text-muted)" />
                                        <span style={{ color: !manager.school ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {manager.school_name || 'Unassigned'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${manager.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {manager.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditManager(manager.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                            title="Edit Manager"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRequestDeleteManager(manager)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                            title="Deactivate Manager"
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

export default SchoolManagerAssignment;
