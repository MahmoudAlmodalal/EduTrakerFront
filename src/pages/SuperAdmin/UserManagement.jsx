import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, FileDown, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john@edutraker.com', role: 'Workstream Manager', status: 'Active', workstream: 'Gaza North' },
        { id: 2, name: 'Jane Smith', email: 'jane@edutraker.com', role: 'Workstream Manager', status: 'Active', workstream: 'Gaza South' },
        { id: 3, name: 'Ahmad Khalil', email: 'ahmad@edutraker.com', role: 'School Manager', status: 'Active', workstream: 'Mid Area' },
        { id: 4, name: 'Sara Younis', email: 'sara@edutraker.com', role: 'Workstream Manager', status: 'Inactive', workstream: 'Khan Younis' },
    ]);

    const handleStatusToggle = (id) => {
        setUsers(users.map(user =>
            user.id === id ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user
        ));
    };

    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', workstream: '' });

    const handleCreateUser = (e) => {
        e.preventDefault();

        if (isEditing) {
            setUsers(users.map(user =>
                user.id === currentUserId
                    ? { ...user, name: formData.name, email: formData.email, workstream: formData.workstream }
                    : user
            ));
        } else {
            const newUser = {
                id: users.length + 1,
                name: formData.name,
                email: formData.email,
                role: 'Workstream Manager',
                status: 'Active',
                workstream: formData.workstream
            };
            setUsers([...users, newUser]);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleEditUser = (user) => {
        setIsEditing(true);
        setCurrentUserId(user.id);
        setFormData({ name: user.name, email: user.email, workstream: user.workstream });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentUserId(null);
        setFormData({ name: '', email: '', workstream: '' });
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.workstream || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <div className={styles.avatar}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className={styles.userDetails}>
                                                    <span className={styles.userName}>{user.name}</span>
                                                    <span className={styles.userEmail}>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.roleBadge}>
                                                {user.role === 'Workstream Manager' ? t('auth.role.workstreamManager') :
                                                    user.role === 'School Manager' ? t('auth.role.schoolManager') : user.role}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{user.workstream}</td>
                                        <td>
                                            <span
                                                className={`${styles.statusBadge} ${user.status === 'Active' ? styles.active : styles.inactive}`}
                                                onClick={() => handleStatusToggle(user.id)}
                                                style={{ cursor: 'pointer' }}
                                                title={t('users.status.toggle')}
                                            >
                                                {user.status === 'Active' ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.actionBtn} onClick={() => handleEditUser(user)} title="Edit"><Edit size={16} /></button>
                                                <button className={`${styles.actionBtn} ${styles.danger}`} title="Delete"><Trash2 size={16} /></button>
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
                        <div className={styles.formGroup}>
                            <label>{t('users.form.assignWorkstream')}</label>
                            <select
                                required
                                value={formData.workstream}
                                onChange={(e) => setFormData({ ...formData, workstream: e.target.value })}
                            >
                                <option value="">{t('users.form.selectWorkstream')}</option>
                                <option value="Gaza North">Gaza North</option>
                                <option value="Gaza South">Gaza South</option>
                                <option value="Mid Area">Mid Area</option>
                                <option value="Khan Younis">Khan Younis</option>
                                <option value="Rafah">Rafah</option>
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
