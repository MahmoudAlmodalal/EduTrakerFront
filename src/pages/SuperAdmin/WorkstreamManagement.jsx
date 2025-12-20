import React, { useState } from 'react';
import { Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import styles from './WorkstreamManagement.module.css';

const WorkstreamManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data
    const [workstreams, setWorkstreams] = useState([
        { id: 1, name: 'Gaza North', schools: 12, users: 4500, manager: 'John Doe', status: 'Active' },
        { id: 2, name: 'Gaza South', schools: 8, users: 3200, manager: 'Jane Smith', status: 'Active' },
        { id: 3, name: 'Khan Younis', schools: 15, users: 5100, manager: 'Pending', status: 'Inactive' },
    ]);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedWorkstream, setSelectedWorkstream] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkstreamId, setCurrentWorkstreamId] = useState(null);
    const [formData, setFormData] = useState({ name: '', quota: '', manager: '' });

    const handleCreateWorkstream = (e) => {
        e.preventDefault();

        if (isEditing) {
            setWorkstreams(workstreams.map(ws =>
                ws.id === currentWorkstreamId
                    ? { ...ws, name: formData.name, manager: formData.manager }
                    : ws
            ));
        } else {
            const newWorkstream = {
                id: workstreams.length + 1,
                name: formData.name,
                schools: 0,
                users: 0,
                manager: formData.manager || 'Pending',
                status: 'Active'
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
            manager: ws.manager !== 'Pending' ? ws.manager : ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentWorkstreamId(null);
        setFormData({ name: '', quota: '', manager: '' });
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openConfigModal = (workstream) => {
        setSelectedWorkstream(workstream);
        setIsConfigModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('workstreams.title')}</h1>
                <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                    {t('workstreams.create')}
                </Button>
            </div>

            <div className={styles.grid}>
                {workstreams.map((ws) => (
                    <div key={ws.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{ws.name}</h3>
                            <span className={`${styles.statusBadge} ${ws.status === 'Active' ? styles.active : styles.inactive}`}>
                                {ws.status === 'Active' ? t('common.active') : t('common.inactive')}
                            </span>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>{t('workstreams.card.schools')}</span>
                                <span className={styles.statValue}>{ws.schools}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>{t('workstreams.card.users')}</span>
                                <span className={styles.statValue}>{ws.users.toLocaleString()}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>{t('workstreams.card.manager')}</span>
                                <span className={styles.statValue}>{ws.manager}</span>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <Button variant="secondary" size="small" icon={Settings} onClick={() => openConfigModal(ws)}>{t('workstreams.config')}</Button>
                            <div className={styles.actions}>
                                <button className={styles.actionBtn} onClick={() => handleEditWorkstream(ws)}><Edit size={16} /></button>
                                <button className={styles.actionBtn}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('workstreams.modal.editTitle') : t('workstreams.modal.createTitle')}>
                <form className={styles.form} onSubmit={handleCreateWorkstream}>
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
                        <label>{t('workstreams.form.quota')}</label>
                        <input
                            type="number"
                            placeholder="5000"
                            required
                            value={formData.quota}
                            onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('workstreams.form.assignManager')}</label>
                        <select
                            value={formData.manager}
                            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        >
                            <option value="">{t('workstreams.form.selectManager')}</option>
                            <option value="John Doe">John Doe</option>
                            <option value="Jane Smith">Jane Smith</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{isEditing ? t('common.save') : t('workstreams.create')}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={`${t('workstreams.config.title')}: ${selectedWorkstream?.name}`}>
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); setIsConfigModalOpen(false); }}>
                    <div className={styles.formGroup}>
                        {/* Removed Max Schools Allowed as per requirement */}
                        {/* <label>Max Schools Allowed</label>
                        <input type="number" defaultValue="20" /> */}
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('workstreams.config.maxUsers')}</label>
                        <input type="number" defaultValue="10000" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('workstreams.config.features')}</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label><input type="checkbox" defaultChecked /> {t('workstreams.config.advancedReporting')}</label>
                            <label><input type="checkbox" defaultChecked /> {t('workstreams.config.apiAccess')}</label>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{t('common.save')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WorkstreamManagement;
