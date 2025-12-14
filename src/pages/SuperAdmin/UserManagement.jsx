import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john@edutraker.com', role: 'Workstream Manager', status: 'Active', workstream: 'Gaza North' },
        { id: 2, name: 'Jane Smith', email: 'jane@edutraker.com', role: 'Workstream Manager', status: 'Active', workstream: 'Gaza South' },
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
                <h1 className={styles.title}>{t('users.title')}</h1>
                <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                    {t('users.create')}
                </Button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t('users.searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
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
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={styles.roleBadge}>
                                            {user.role === 'Workstream Manager' ? t('auth.role.workstreamManager') : user.role}
                                        </span>
                                    </td>
                                    <td>{user.workstream}</td>
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
                                            <button className={styles.actionBtn} onClick={() => handleEditUser(user)}><Edit size={16} /></button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    {t('users.noUsersFound')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('users.modal.editTitle') : t('users.modal.createTitle')}>
                <form className={styles.form} onSubmit={handleCreateUser}>
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
                            <option value="West Bank">West Bank</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{isEditing ? t('common.save') : t('common.create')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
