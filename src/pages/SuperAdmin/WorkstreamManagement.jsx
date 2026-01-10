import React, { useState } from 'react';
import { Plus, Settings, Edit, Trash2, MapPin, Users, School, Layers, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import styles from './WorkstreamManagement.module.css';

const WorkstreamManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data
    const [workstreams, setWorkstreams] = useState(() => {
        const savedWorkstreams = localStorage.getItem('edutraker_workstreams');
        return savedWorkstreams ? JSON.parse(savedWorkstreams) : [
            { id: 1, name: 'Gaza North', schools: 12, users: 4500, manager: 'John Doe', status: 'Active', location: 'Jabalia, Gaza North' },
            { id: 2, name: 'Gaza South', schools: 8, users: 3200, manager: 'Jane Smith', status: 'Active', location: 'Rafah, Gaza South' },
            { id: 3, name: 'Khan Younis', schools: 15, users: 5100, manager: 'Pending', status: 'Inactive', location: 'Khan Younis Center' },
            { id: 4, name: 'Mid Area', schools: 10, users: 2800, manager: 'Ahmad Khalil', status: 'Active', location: 'Deir al-Balah' },
        ];
    });

    React.useEffect(() => {
        localStorage.setItem('edutraker_workstreams', JSON.stringify(workstreams));
    }, [workstreams]);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedWorkstream, setSelectedWorkstream] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkstreamId, setCurrentWorkstreamId] = useState(null);
    const [formData, setFormData] = useState({ name: '', quota: '', manager: '', location: '' });

    const handleCreateWorkstream = (e) => {
        e.preventDefault();

        if (isEditing) {
            setWorkstreams(workstreams.map(ws =>
                ws.id === currentWorkstreamId
                    ? { ...ws, name: formData.name, manager: formData.manager, location: formData.location }
                    : ws
            ));
        } else {
            const newWorkstream = {
                id: Date.now(),
                name: formData.name,
                schools: 0,
                users: 0,
                manager: formData.manager || 'Pending',
                status: 'Active',
                location: formData.location || 'Unknown'
            };
            setWorkstreams([...workstreams, newWorkstream]);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleEditWorkstream = (ws) => {
        setIsEditing(true);
        setCurrentWorkstreamId(ws.id);
        setFormData({
            name: ws.name,
            quota: 5000,
            manager: ws.manager !== 'Pending' ? ws.manager : '',
            location: ws.location || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentWorkstreamId(null);
        setFormData({ name: '', quota: '', manager: '', location: '' });
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleDeleteWorkstream = (id) => {
        if (window.confirm(t('Are you sure you want to delete this workstream?'))) {
            setWorkstreams(workstreams.filter(ws => ws.id !== id));
        }
    };

    const handleToggleStatus = (id) => {
        setWorkstreams(workstreams.map(ws =>
            ws.id === id
                ? { ...ws, status: ws.status === 'Active' ? 'Inactive' : 'Active' }
                : ws
        ));
    };

    const openConfigModal = (workstream) => {
        setSelectedWorkstream(workstream);
        setIsConfigModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{t('workstreams.title')}</h1>
                    <p className={styles.subtitle}>Configure and monitor regional workstreams and their infrastructure.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                    {t('workstreams.create')}
                </Button>
            </div>

            <div className={styles.grid}>
                {workstreams.map((ws) => {
                    // Dynamic counts calculation
                    const allSchools = JSON.parse(localStorage.getItem('ws_schools') || '[]');
                    const allUsers = JSON.parse(localStorage.getItem('edutraker_users') || '[]');

                    // Count schools in this workstream (matching by name or location snippet)
                    const schoolCount = allSchools.filter(s =>
                        (s.workstream === ws.name) ||
                        (s.location && s.location.includes(ws.name))
                    ).length;

                    // Count users in this workstream
                    const userCount = allUsers.filter(u => u.workstream === ws.name).length;

                    return (
                        <div key={ws.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.workstreamInfo}>
                                    <h3 className={styles.cardTitle}>{ws.name}</h3>
                                    <div className={styles.locationLabel}>
                                        <MapPin size={12} />
                                        <span>{ws.location}</span>
                                    </div>
                                </div>
                                <span
                                    className={`${styles.statusBadge} ${ws.status === 'Active' ? styles.active : styles.inactive}`}
                                    onClick={() => handleToggleStatus(ws.id)}
                                >
                                    {ws.status === 'Active' ? t('common.active') : t('common.inactive')}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.statsContainer}>
                                    <div className={styles.statItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <School size={14} style={{ color: 'var(--color-primary)' }} />
                                            <span className={styles.statLabel}>{t('workstreams.card.schools')}</span>
                                        </div>
                                        <span className={styles.statValue}>{schoolCount}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <Users size={14} style={{ color: '#8b5cf6' }} />
                                            <span className={styles.statLabel}>{t('workstreams.card.users')}</span>
                                        </div>
                                        <span className={styles.statValue}>{userCount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className={styles.managerSection}>
                                    <div className={styles.managerAvatar}>
                                        {ws.manager !== 'Pending' ? ws.manager.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Manager</p>
                                        <p className={styles.managerName}>{ws.manager}</p>
                                    </div>
                                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--slate-300)' }} />
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.actions}>
                                    <button className={styles.actionBtn} onClick={() => openConfigModal(ws)} title="Configuration"><Settings size={18} /></button>
                                    <button className={styles.actionBtn} onClick={() => handleEditWorkstream(ws)} title="Edit"><Edit size={18} /></button>
                                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteWorkstream(ws.id)} title="Delete"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('workstreams.modal.editTitle') : t('workstreams.modal.createTitle')}>
                <form className={styles.form} onSubmit={handleCreateWorkstream}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.form.name')}</label>
                            <input
                                type="text"
                                placeholder={t('workstreams.form.namePlaceholder')}
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Regional Location</label>
                            <input
                                type="text"
                                placeholder="e.g. Gaza City, Center"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.form.quota')}</label>
                            <select
                                required
                                value={formData.quota}
                                onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                            >
                                <option value="">Select quota limit</option>
                                <option value="5000">5,000 Users</option>
                                <option value="10000">10,000 Users</option>
                                <option value="25000">25,000 Users</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.form.assignManager')}</label>
                            <select
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                            >
                                <option value="">{t('workstreams.form.selectManager')}</option>
                                {JSON.parse(localStorage.getItem('edutraker_users') || '[]')
                                    .filter(u => u.role === 'Workstream Manager')
                                    .map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{isEditing ? t('common.save') : t('workstreams.create')}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={`${t('workstreams.config.title')}: ${selectedWorkstream?.name}`}>
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setIsConfigModalOpen(false); }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.config.maxUsers')}</label>
                            <input type="number" defaultValue="10000" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.config.features')}</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{t('workstreams.config.advancedReporting')}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{t('workstreams.config.apiAccess')}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" />
                                    <span>Multi-school Analytics</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className={styles.formActions} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={() => setIsConfigModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{t('common.save')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WorkstreamManagement;
