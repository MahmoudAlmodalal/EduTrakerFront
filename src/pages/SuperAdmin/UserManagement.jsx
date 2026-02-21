import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, FileDown, Filter, Layers } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SearchableSelect from '../../components/ui/SearchableSelect';
import styles from './UserManagement.module.css';
import { api } from '../../utils/api';

const UserManagement = () => {
    const { t } = useTheme();
    const { showSuccess, showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [workstreams, setWorkstreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [workstreamFilter, setWorkstreamFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);

    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserWorkstreamId, setCurrentUserWorkstreamId] = useState(null);
    const [currentUserIsActive, setCurrentUserIsActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        workstreamId: '',
        role: 'manager_workstream',
        password: ''
    });

    const parseWorkstreamId = (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = parseInt(value, 10);
        return Number.isInteger(parsed) ? parsed : null;
    };

    const resolveUserWorkstreamId = (user) => {
        return parseWorkstreamId(user?.work_stream ?? user?.workstream?.id ?? user?.workstream_id);
    };

    const resolveWorkstreamCapacity = (workstream) => {
        const parsed = parseInt(workstream?.user_capacity ?? workstream?.capacity, 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };

    const fetchActiveUsersCount = async (workstreamId) => {
        const response = await api.get('/users/', {
            params: {
                work_stream: workstreamId,
                is_active: true,
                page: 1,
            },
        });

        if (typeof response?.count === 'number') {
            return response.count;
        }
        if (Array.isArray(response?.results)) {
            return response.results.length;
        }
        return Array.isArray(response) ? response.length : 0;
    };

    const validateWorkstreamCapacity = async (workstreamId) => {
        const selectedWorkstream = workstreams.find((ws) => parseWorkstreamId(ws.id) === workstreamId);
        const capacity = resolveWorkstreamCapacity(selectedWorkstream);

        if (!capacity) {
            return { allowed: true };
        }

        const willConsumeSeat = !isEditing || currentUserIsActive;
        const keepsSameWorkstream = isEditing && currentUserWorkstreamId === workstreamId;
        if (!willConsumeSeat || keepsSameWorkstream) {
            return { allowed: true };
        }

        const activeUsersCount = await fetchActiveUsersCount(workstreamId);
        if (activeUsersCount >= capacity) {
            return { allowed: false, capacity, activeUsersCount };
        }

        return { allowed: true };
    };

    const fetchUsers = async (page = 1, search = '', role = '', workstream = '', status = '') => {
        setLoading(true);
        try {
            let url = `/users/?page=${page}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (role) url += `&role=${role}`;
            if (workstream) url += `&work_stream=${workstream}`;
            if (status === 'active') url += `&is_active=true`;
            if (status === 'inactive') url += `&is_active=false`;

            const data = await api.get(url);
            setUsers(data.results || []);
            setPagination({ count: data.count, next: data.next, previous: data.previous });
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkstreams = async () => {
        try {
            const data = await api.get('/workstream/');
            setWorkstreams(data.results || data);
        } catch (err) {
            console.error('Error fetching workstreams:', err);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, searchTerm, roleFilter, workstreamFilter, statusFilter);
    }, [currentPage, searchTerm, roleFilter, workstreamFilter, statusFilter]);

    useEffect(() => {
        fetchWorkstreams();
    }, []);

    const handleStatusToggle = async (user) => {
        const url = `/users/${user.id}/${user.is_active ? 'deactivate' : 'activate'}/`;

        try {
            await api.post(url);
            showSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully!`);
            fetchUsers(currentPage, searchTerm, roleFilter, workstreamFilter, statusFilter);
        } catch (err) {
            showError('Status update failed: ' + err.message);
        }
    };

    const handleDeleteUser = async (user) => {
        // PER USER CLARIFICATION: "delet is deactivate"
        if (!window.confirm(`Are you sure you want to deactivate ${user.full_name}?`)) return;

        try {
            await api.post(`/users/${user.id}/deactivate/`);
            showSuccess(`User ${user.full_name} deactivated successfully!`);
            fetchUsers(currentPage, searchTerm, roleFilter, workstreamFilter, statusFilter);
        } catch (err) {
            showError('Deactivation failed: ' + err.message);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const selectedWorkstreamId = parseWorkstreamId(formData.workstreamId);

        if (selectedWorkstreamId) {
            try {
                const capacityCheck = await validateWorkstreamCapacity(selectedWorkstreamId);
                if (!capacityCheck.allowed) {
                    showError(
                        t('users.error.workstreamCapacityReached', {
                            current: capacityCheck.activeUsersCount,
                            capacity: capacityCheck.capacity,
                        })
                    );
                    setIsSubmitting(false);
                    return;
                }
            } catch (err) {
                showError(t('users.error.workstreamCapacityCheckFailed') || (`Failed to validate workstream capacity: ${err.message}`));
                setIsSubmitting(false);
                return;
            }
        }

        const payload = {
            email: formData.email,
            full_name: formData.name,
            role: formData.role,
            work_stream: selectedWorkstreamId,
        };

        if (!isEditing) {
            payload.password = formData.password || 'Temporary123!';
        } else if (formData.password) {
            payload.password = formData.password;
        }

        try {
            if (isEditing) {
                await api.patch(`/users/${currentUserId}/`, payload);
                showSuccess('User updated successfully!');
            } else {
                await api.post('/users/create/', payload);
                showSuccess('User created successfully!');
            }

            fetchUsers(currentPage, searchTerm, roleFilter, workstreamFilter, statusFilter);
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            showError('Operation failed: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditUser = (user) => {
        const userWorkstreamId = resolveUserWorkstreamId(user);
        setIsEditing(true);
        setCurrentUserId(user.id);
        setCurrentUserWorkstreamId(userWorkstreamId);
        setCurrentUserIsActive(Boolean(user.is_active));
        setFormData({
            name: user.full_name,
            email: user.email,
            workstreamId: userWorkstreamId ? userWorkstreamId.toString() : '',
            role: user.role,
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleWorkstreamSearch = useCallback(async (term) => {
        try {
            const response = await api.get('/workstream/', { params: { search: term } });
            const results = response.results || response;
            setWorkstreams((prev) => {
                const next = [...prev];
                results.forEach((ws) => {
                    const existingIndex = next.findIndex((item) => item.id === ws.id);
                    if (existingIndex >= 0) {
                        next[existingIndex] = { ...next[existingIndex], ...ws };
                    } else {
                        next.push(ws);
                    }
                });
                return next;
            });
            return results.map(ws => ({ value: ws.id, label: ws.workstream_name }));
        } catch (error) {
            console.error('Error searching workstreams:', error);
            return [];
        }
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentUserId(null);
        setCurrentUserWorkstreamId(null);
        setCurrentUserIsActive(false);
        setFormData({ name: '', email: '', workstreamId: '', role: 'manager_workstream', password: '' });
    };

    const handleExport = async () => {
        try {
            let url = `/users/export/`;
            const params = [];
            if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
            if (roleFilter) params.push(`role=${roleFilter}`);
            if (workstreamFilter) params.push(`work_stream=${workstreamFilter}`);
            if (statusFilter === 'active') params.push(`is_active=true`);
            if (statusFilter === 'inactive') params.push(`is_active=false`);

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            // Use fetch directly to handle blob response
            const response = await api.get(url, { responseType: 'blob' });

            // Create blob link to download
            const blob = new Blob([response]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate filename with timestamp
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `users_export_${date}.csv`);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        }
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>{t('users.title')}</h1>
                    <p className={styles.subtitle}>{t('users.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={FileDown} onClick={handleExport}>{t('users.export')}</Button>
                    <Button variant="primary" icon={UserPlus} onClick={openCreateModal}>
                        {t('users.create')}
                    </Button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        placeholder={t('users.searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={18} className={styles.searchIcon} />
                </div>

                <div className={styles.filterGroup}>
                    <div className={styles.selectWrapper}>
                        <Filter size={14} className={styles.filterIcon} />
                        <select
                            className={styles.filterSelect}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">{t('users.filter.allRoles')}</option>
                            <option value="admin">{t('auth.role.superAdmin')}</option>
                            <option value="manager_workstream">{t('auth.role.workstreamManager')}</option>
                            <option value="manager_school">{t('auth.role.schoolManager')}</option>
                            <option value="teacher">{t('auth.role.teacher')}</option>
                            <option value="secretary">{t('auth.role.secretary')}</option>
                            <option value="student">{t('auth.role.student')}</option>
                        </select>
                    </div>

                    <div className={styles.selectWrapper}>
                        <Layers size={14} className={styles.filterIcon} />
                        <select
                            className={styles.filterSelect}
                            value={workstreamFilter}
                            onChange={(e) => setWorkstreamFilter(e.target.value)}
                        >
                            <option value="">{t('users.filter.allWorkstreams')}</option>
                            {workstreams.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.workstream_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.selectWrapper}>
                        <Filter size={14} className={styles.filterIcon} />
                        <select
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('users.filter.allStatus')}</option>
                            <option value="active">{t('users.status.active')}</option>
                            <option value="inactive">{t('users.status.inactive')}</option>
                        </select>
                    </div>

                    {(roleFilter || workstreamFilter || searchTerm) && (
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() => {
                                setRoleFilter('');
                                setWorkstreamFilter('');
                                setStatusFilter('');
                                setSearchTerm('');
                            }}
                        >
                            {t('users.filter.clear')}
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('users.table.name')}</th>
                                <th>{t('users.table.email')}</th>
                                <th>{t('users.table.role')}</th>
                                <th>{t('users.table.workstream')}</th>
                                <th>{t('users.table.status')}</th>
                                <th>{t('users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>{t('users.loading')}</td></tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <div className={styles.avatar}>
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className={styles.userDetails}>
                                                    <span className={styles.userName}>{user.full_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.userEmail}>{user.email}</span>
                                        </td>
                                        <td>
                                            <span className={styles.roleBadge}>
                                                {user.role === 'admin' ? t('auth.role.superAdmin') :
                                                    user.role === 'manager_workstream' ? t('auth.role.workstreamManager') :
                                                        user.role === 'manager_school' ? t('auth.role.schoolManager') :
                                                            user.role === 'teacher' ? t('auth.role.teacher') :
                                                                user.role === 'secretary' ? t('auth.role.secretary') :
                                                                    user.role === 'student' ? t('auth.role.student') :
                                                                        user.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{user.work_stream_name || user.workstream_name || user.workstream?.workstream_name || 'N/A'}</td>
                                        <td>
                                            <span
                                                className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.inactive}`}
                                                onClick={() => handleStatusToggle(user)}
                                                style={{ cursor: 'pointer' }}
                                                title={t('users.status.toggle')}
                                            >
                                                {user.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.actionBtn} onClick={() => handleEditUser(user)} title="Edit"><Edit size={16} /></button>
                                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteUser(user)} title="Deactivate"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Search size={48} style={{ color: 'var(--slate-300)' }} />
                                            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{t('users.noUsersFound')}</p>
                                            <Button variant="outline" size="small" onClick={() => { setSearchTerm(''); setRoleFilter(''); setWorkstreamFilter(''); setStatusFilter(''); }}>{t('users.resetFilters')}</Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.count > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <Button
                            variant="outline"
                            size="small"
                            disabled={!pagination.previous}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            {t('users.pagination.previous')}
                        </Button>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            {t('users.pagination.info', { current: currentPage, total: Math.ceil(pagination.count / 10) })}
                        </span>
                        <Button
                            variant="outline"
                            size="small"
                            disabled={!pagination.next}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            {t('users.pagination.next')}
                        </Button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('users.modal.editTitle') : t('users.modal.createTitle')}>
                <form className={styles.form} onSubmit={handleCreateUser}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>{t('users.form.fullName')}</label>
                            <input
                                type="text"
                                placeholder={t('users.form.enterName')}
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('users.form.email')}</label>
                            <input
                                type="email"
                                placeholder={t('users.form.enterEmail')}
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {!isEditing && (
                            <div className={styles.formGroup}>
                                <label>{t('users.form.password')}</label>
                                <input
                                    type="password"
                                    placeholder={t('users.form.passwordPlaceholder')}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label>{t('users.form.role')}</label>
                            <select
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="admin">{t('auth.role.superAdmin')}</option>
                                <option value="manager_workstream">{t('auth.role.workstreamManager')}</option>
                                <option value="manager_school">{t('auth.role.schoolManager')}</option>
                                <option value="teacher">{t('auth.role.teacher')}</option>
                                <option value="secretary">{t('auth.role.secretary')}</option>
                                <option value="student">{t('auth.role.student')}</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('users.form.assignWorkstream')}</label>
                            <SearchableSelect
                                options={workstreams.map(ws => ({ value: ws.id, label: ws.workstream_name }))}
                                value={formData.workstreamId}
                                onChange={(val) => setFormData({ ...formData, workstreamId: val })}
                                placeholder={t('workstreams.form.noWorkstream')}
                                searchPlaceholder={t('workstreams.searchPlaceholder')}
                                onSearch={handleWorkstreamSearch}
                            />
                        </div>
                    </div>
                    <div className={styles.formActions} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t('users.saving') : (isEditing ? t('users.update') : t('common.create'))}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
