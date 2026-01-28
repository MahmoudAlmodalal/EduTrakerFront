import React, { useState, useEffect } from 'react';
import { Plus, Settings, Edit, Trash2, MapPin, Users, School, Layers, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import styles from './WorkstreamManagement.module.css';
import { api } from '../../utils/api';

const WorkstreamManagement = () => {
    const { t } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workstreams, setWorkstreams] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedWorkstream, setSelectedWorkstream] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkstreamId, setCurrentWorkstreamId] = useState(null);
    const [formData, setFormData] = useState({ name: '', quota: '100', managerId: '', location: '', description: '' });

    const fetchWorkstreams = async () => {
        setLoading(true);
        try {
            const data = await api.get('/workstream/');
            setWorkstreams(data.results || data);
        } catch (err) {
            console.error('Error fetching workstreams:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const data = await api.get('/users/?role=manager_workstream');
            setManagers(data.results || data);
        } catch (err) {
            console.error('Error fetching managers:', err);
        }
    };

    useEffect(() => {
        fetchWorkstreams();
        fetchManagers();
    }, []);

    const handleCreateWorkstream = async (e) => {
        e.preventDefault();

        const payload = {
            workstream_name: formData.name,
            capacity: parseInt(formData.quota),
            manager_id: formData.managerId ? parseInt(formData.managerId) : null,
            description: formData.description || '',
            location: formData.location || '',
        };

        try {
            if (isEditing) {
                await api.patch(`/workstreams/${currentWorkstreamId}/update/`, payload);
            } else {
                await api.post('/workstream/', payload);
            }

            await fetchWorkstreams();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            alert('Operation failed: ' + err.message);
        }
    };

    const handleDeactivate = async (id, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this workstream?`)) return;

        const url = `/workstreams/${id}/deactivate/`;

        try {
            await api.post(url);
            await fetchWorkstreams();
        } catch (err) {
            alert('Status update failed: ' + err.message);
        }
    };

    const handleEditWorkstream = (ws) => {
        setIsEditing(true);
        setCurrentWorkstreamId(ws.id);
        setFormData({
            name: ws.workstream_name,
            quota: ws.capacity.toString(),
            managerId: ws.manager_id ? ws.manager_id.toString() : '',
            location: ws.location || '',
            description: ws.description || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentWorkstreamId(null);
        setFormData({ name: '', quota: '100', managerId: '', location: '', description: '' });
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
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{t('workstreams.title')}</h1>
                    <p className={styles.subtitle}>Configure and monitor regional workstreams and their infrastructure.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                    {t('workstreams.create')}
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading workstreams...</div>
            ) : (
                <div className={styles.grid}>
                    {workstreams.map((ws) => (
                        <div key={ws.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.workstreamInfo}>
                                    <h3 className={styles.cardTitle}>{ws.workstream_name}</h3>
                                    <div className={styles.locationLabel}>
                                        <MapPin size={12} />
                                        <span>{ws.location || 'Not Specified'}</span>
                                    </div>
                                </div>
                                <span className={`${styles.statusBadge} ${ws.is_active ? styles.active : styles.inactive}`}>
                                    {ws.is_active ? t('common.active') : t('common.inactive')}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.statsContainer}>
                                    <div className={styles.statItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <School size={14} style={{ color: 'var(--color-primary)' }} />
                                            <span className={styles.statLabel}>{t('workstreams.card.schools')}</span>
                                        </div>
                                        <span className={styles.statValue}>{ws.capacity} Schools</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                            <Users size={14} style={{ color: '#8b5cf6' }} />
                                            <span className={styles.statLabel}>{t('workstreams.card.users')}</span>
                                        </div>
                                        <span className={styles.statValue}>Managed</span>
                                    </div>
                                </div>

                                <div className={styles.managerSection}>
                                    <div className={styles.managerAvatar}>
                                        {ws.manager_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Manager</p>
                                        <p className={styles.managerName}>{ws.manager_name || 'Pending'}</p>
                                    </div>
                                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--slate-300)' }} />
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.actions}>
                                    <button className={styles.actionBtn} onClick={() => openConfigModal(ws)} title="Configuration"><Settings size={18} /></button>
                                    <button className={styles.actionBtn} onClick={() => handleEditWorkstream(ws)} title="Edit"><Edit size={18} /></button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.danger}`}
                                        title={ws.is_active ? "Deactivate" : "Activate"}
                                        onClick={() => handleDeactivate(ws.id, ws.is_active)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description (Optional)</label>
                            <textarea
                                placeholder="Workstream description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.form.quota')}</label>
                            <select
                                required
                                value={formData.quota}
                                onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                            >
                                <option value="100">100 Schools (Basic)</option>
                                <option value="500">500 Schools (Standard)</option>
                                <option value="1000">1000 Schools (Premium)</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.form.assignManager')}</label>
                            <select
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            >
                                <option value="">{t('workstreams.form.selectManager')}</option>
                                {managers.map(manager => (
                                    <option key={manager.id} value={manager.id}>{manager.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{isEditing ? t('common.save') : t('workstreams.create')}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={`${t('workstreams.config.title')}: ${selectedWorkstream?.workstream_name}`}>
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
