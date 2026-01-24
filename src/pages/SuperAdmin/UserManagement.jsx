import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, FileDown, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [workstreams, setWorkstreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);

    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        workstreamId: '',
        role: 'manager_workstream',
        password: ''
    });

    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const url = `/api/users/?page=${page}&search=${search}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
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
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/workstream/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWorkstreams(data);
            }
        } catch (err) {
            console.error('Error fetching workstreams:', err);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, searchTerm);
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchWorkstreams();
    }, []);

    const handleStatusToggle = async (user) => {
        const token = localStorage.getItem('accessToken');
        const url = `/api/users/${user.id}/${user.is_active ? 'deactivate' : 'activate'}/`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Action failed');
            fetchUsers(currentPage, searchTerm);
        } catch (err) {
            alert('Status update failed: ' + err.message);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');

        const payload = {
            email: formData.email,
            full_name: formData.name,
            role: formData.role,
            work_stream: formData.workstreamId ? parseInt(formData.workstreamId) : null,
        };

        if (!isEditing) {
            payload.password = formData.password || 'Temporary123!';
        } else if (formData.password) {
            payload.password = formData.password;
        }

        try {
            let response;
            if (isEditing) {
                response = await fetch(`/api/users/${currentUserId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/users/create/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            fetchUsers(currentPage, searchTerm);
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            alert('Operation failed: ' + err.message);
        }
    };

    const handleEditUser = (user) => {
        setIsEditing(true);
        setCurrentUserId(user.id);
        setFormData({
            name: user.full_name,
            email: user.email,
            workstreamId: user.work_stream ? user.work_stream.toString() : '',
            role: user.role,
            password: ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentUserId(null);
        setFormData({ name: '', email: '', workstreamId: '', role: 'manager_workstream', password: '' });
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
                    <p className={styles.subtitle}>Manage system users and their access levels across workstreams.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={FileDown} onClick={() => { }}>Export</Button>
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
                <Button variant="outline" icon={Filter}>Filters</Button>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('users.table.name')}</th>
                                <th>{t('users.table.role')}</th>
                                <th>{t('users.table.workstream')}</th>
                                <th>{t('users.table.status')}</th>
                                <th>{t('users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
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
                                                    <span className={styles.userEmail}>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.roleBadge}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{user.work_stream_name || 'N/A'}</td>
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
                                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleStatusToggle(user)} title="Delete (Deactivate)"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Search size={48} style={{ color: 'var(--slate-300)' }} />
                                            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{t('users.noUsersFound')}</p>
                                            <Button variant="outline" size="small" onClick={() => setSearchTerm('')}>Clear Search</Button>
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
                            Previous
                        </Button>
                        <span style={{ display: 'flex', alignItems: 'center' }}>Page {currentPage}</span>
                        <Button
                            variant="outline"
                            size="small"
                            disabled={!pagination.next}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
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
                                <label>{t('auth.password')}</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label>Role</label>
                            <select
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="admin">Super Admin</option>
                                <option value="manager_workstream">Workstream Manager</option>
                                <option value="manager_school">School Manager</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('users.form.assignWorkstream')}</label>
                            <select
                                value={formData.workstreamId}
                                onChange={(e) => setFormData({ ...formData, workstreamId: e.target.value })}
                            >
                                <option value="">None / Select Workstream</option>
                                {workstreams.map(ws => (
                                    <option key={ws.id} value={ws.id}>{ws.workstream_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{isEditing ? 'Update User' : t('common.create')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
