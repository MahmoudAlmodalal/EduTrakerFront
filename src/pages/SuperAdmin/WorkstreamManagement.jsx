import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Edit, Trash2, MapPin, Users, School, Layers, ChevronRight, Clock3 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SearchableSelect from '../../components/ui/SearchableSelect';

import styles from './WorkstreamManagement.module.css';
import workstreamService from '../../services/workstreamService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WorkstreamManagement = () => {
    const { t } = useTheme();
    const { showSuccess, showError, showWarning } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSavingWorkstream, setIsSavingWorkstream] = useState(false);
    const [workstreams, setWorkstreams] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedWorkstream, setSelectedWorkstream] = useState(null);
    const [configMaxUsers, setConfigMaxUsers] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkstreamId, setCurrentWorkstreamId] = useState(null);
    const [formData, setFormData] = useState({ name: '', quota: '100', managerId: '', location: '', description: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const formatCount = (value) => {
        const parsed = Number(value);
        const safeValue = Number.isFinite(parsed) ? parsed : 0;
        return new Intl.NumberFormat().format(safeValue);
    };

    const fetchWorkstreams = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

            const response = await workstreamService.getWorkstreams(params);
            setWorkstreams(response.results || response);
        } catch (err) {
            console.error('Error fetching workstreams:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await workstreamService.getManagers();
            setManagers(response.results || response);
        } catch (err) {
            console.error('Error fetching managers:', err);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchWorkstreams();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchManagers();
    }, []);

    const isDuplicateNameError = (err) => {
        const message = (err?.message || '').toLowerCase();
        const data = err?.data;
        return (
            message.includes('workstream with this name already exists') ||
            message.includes('already exists') ||
            data?.workstream_name?.some?.((item) => String(item).toLowerCase().includes('already exists'))
        );
    };

    const handleCreateWorkstream = async (e) => {
        e.preventDefault();
        const parsedQuota = parseInt(formData.quota, 10);
        const trimmedName = formData.name.trim();
        const normalizedName = trimmedName.toLowerCase();
        const hasLocalDuplicate = workstreams.some((ws) => {
            if (isEditing && ws.id === currentWorkstreamId) return false;
            return (ws.workstream_name || '').trim().toLowerCase() === normalizedName;
        });

        if (hasLocalDuplicate) {
            showWarning(t('workstreams.warning.duplicateName'), 4500);
            return;
        }

        if (!Number.isInteger(parsedQuota) || parsedQuota < 1) {
            showWarning(t('workstreams.config.error.maxUsers'));
            return;
        }

        const payload = {
            workstream_name: trimmedName,
            user_capacity: parsedQuota,
            manager_id: formData.managerId ? parseInt(formData.managerId) : null,
            description: formData.description || '',
            location: formData.location || '',
        };

        setIsSavingWorkstream(true);
        try {
            if (isEditing) {
                await workstreamService.updateWorkstream(currentWorkstreamId, payload);
            } else {
                await workstreamService.createWorkstream(payload);
            }

            await fetchWorkstreams();
            setIsModalOpen(false);
            resetForm();
            showSuccess(isEditing ? t('workstreams.success.updated') : t('workstreams.success.created'));
        } catch (err) {
            if (isDuplicateNameError(err)) {
                showWarning(t('workstreams.warning.duplicateName'), 4500);
                return;
            }
            showError('Operation failed: ' + err.message);
        } finally {
            setIsSavingWorkstream(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(t('workstreams.confirm.toggle'))) return;

        try {
            if (currentStatus) {
                await workstreamService.deactivateWorkstream(id);
            } else {
                await workstreamService.updateWorkstream(id, { is_active: true });
            }
            await fetchWorkstreams();
            showSuccess(currentStatus ? t('workstreams.success.deactivated') : t('workstreams.success.activated'));
        } catch (err) {
            showError('Status update failed: ' + err.message);
        }
    };

    const handleEditWorkstream = (ws) => {
        setIsEditing(true);
        setCurrentWorkstreamId(ws.id);
        setFormData({
            name: ws.workstream_name,
            quota: String(ws.user_capacity ?? ws.capacity ?? 100),
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

    const handleManagerSearch = useCallback(async (term) => {
        try {
            const response = await workstreamService.getManagers({ search: term });
            const results = response.results || response;
            return results.map(m => ({ value: m.id, label: m.full_name }));
        } catch (error) {
            console.error('Error searching managers:', error);
            return [];
        }
    }, []);

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openConfigModal = (workstream) => {
        setSelectedWorkstream(workstream);
        setConfigMaxUsers((workstream?.user_capacity ?? workstream?.capacity ?? '').toString());
        setIsConfigModalOpen(true);
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        if (!selectedWorkstream) return;

        const parsedMaxUsers = parseInt(configMaxUsers, 10);
        if (!Number.isInteger(parsedMaxUsers) || parsedMaxUsers < 1) {
            showWarning(t('workstreams.config.error.maxUsers'));
            return;
        }

        setIsSavingConfig(true);
        try {
            await workstreamService.updateWorkstream(selectedWorkstream.id, { user_capacity: parsedMaxUsers });
            await fetchWorkstreams();
            setIsConfigModalOpen(false);
            showSuccess(t('workstreams.config.success'));
        } catch (err) {
            showError('Failed to update configuration: ' + err.message);
        } finally {
            setIsSavingConfig(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{t('workstreams.title')}</h1>
                    <p className={styles.subtitle}>{t('workstreams.subtitle')}</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                    {t('workstreams.create')}
                </Button>
            </div>

            {/* Filters Section */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder={t('workstreams.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">{t('users.filter.allStatus')}</option>
                    <option value="active">{t('workstreams.filter.active')}</option>
                    <option value="inactive">{t('workstreams.filter.inactive')}</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>{t('workstreams.loading')}</div>
            ) : (
                <>
                    {/* Analytics Section */}
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>{t('workstreams.analytics.userDistribution')}</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                                <BarChart
                                    data={workstreams}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis dataKey="workstream_name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="total_users" name={t('workstreams.analytics.totalUsers')} fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="user_capacity" name={t('workstreams.analytics.capacity')} fill="var(--slate-300)" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {workstreams.map((ws) => (
                            <div key={ws.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.workstreamInfo}>
                                        <h3 className={styles.cardTitle}>{ws.workstream_name}</h3>
                                        <div className={styles.locationLabel}>
                                            <MapPin size={12} />
                                            <span>{ws.location || t('workstreams.card.locationUnspecified')}</span>
                                        </div>
                                    </div>
                                    <span className={`${styles.statusBadge} ${ws.is_active ? styles.active : styles.inactive}`}>
                                        {ws.is_active ? t('common.active') : t('common.inactive')}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.statsContainer}>
                                        <div className={styles.statItem}>
                                            <div className={styles.statHeader}>
                                                <School size={14} style={{ color: 'var(--color-primary)' }} />
                                                <span className={styles.statLabel}>{t('workstreams.card.schools')}</span>
                                            </div>
                                            <span className={styles.statValue}>{formatCount(ws.total_schools)}</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statHeader}>
                                                <Users size={14} style={{ color: '#8b5cf6' }} />
                                                <span className={styles.statLabel}>{t('workstreams.card.allUsers') || t('workstreams.card.users')}</span>
                                            </div>
                                            <span className={styles.statValue}>{formatCount(ws.total_users)}</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statHeader}>
                                                <Clock3 size={14} style={{ color: 'var(--color-warning, #f59e0b)' }} />
                                                <span className={styles.statLabel}>{t('workstreams.card.pendingStudents')}</span>
                                            </div>
                                            <span className={styles.statValue}>{formatCount(ws.pending_students)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.managerSection}>
                                        <div className={styles.managerAvatar}>
                                            {ws.manager_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className={styles.managerLabel}>{t('workstreams.card.manager')}</p>
                                            <p className={styles.managerName}>{ws.manager_name || t('workstreams.card.pendingManager')}</p>
                                        </div>
                                        <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--slate-300)' }} />
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div className={styles.actions}>
                                        <button className={styles.actionBtn} onClick={() => openConfigModal(ws)} title={t('workstreams.config.title')}><Settings size={18} /></button>
                                        <button className={styles.actionBtn} onClick={() => handleEditWorkstream(ws)} title={t('common.edit')}><Edit size={18} /></button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.danger}`}
                                            title={ws.is_active ? t('common.deactivate') : t('common.activate')}
                                            onClick={() => handleToggleStatus(ws.id, ws.is_active)}
                                            style={{ backgroundColor: ws.is_active ? undefined : 'var(--color-success)', color: ws.is_active ? undefined : 'white' }}
                                        >
                                            {ws.is_active ? <Trash2 size={18} /> : <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{t('common.activate')}</div>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('workstreams.modal.editTitle') : t('workstreams.modal.createTitle')}>
                <form className={styles.form} onSubmit={handleCreateWorkstream}>
                    <div className={styles.modalIntro}>
                        <div className={styles.modalIntroIcon}>
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className={styles.modalIntroTitle}>
                                {isEditing ? t('workstreams.modal.helperEdit') : t('workstreams.modal.helperCreate')}
                            </p>
                            <p className={styles.modalIntroDescription}>{t('workstreams.form.helpDescription')}</p>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label htmlFor="workstream-name" className={styles.label}>{t('workstreams.form.name')}</label>
                                <span className={styles.requiredTag}>{t('workstreams.form.required')}</span>
                            </div>
                            <input
                                id="workstream-name"
                                className={styles.input}
                                type="text"
                                placeholder={t('workstreams.form.namePlaceholder')}
                                required
                                value={formData.name}
                                disabled={isSavingWorkstream}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <p className={styles.fieldHint}>{t('workstreams.form.helpName')}</p>
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label htmlFor="workstream-location" className={styles.label}>{t('workstreams.form.location')}</label>
                                <span className={styles.optionalTag}>{t('workstreams.form.optional')}</span>
                            </div>
                            <input
                                id="workstream-location"
                                className={styles.input}
                                type="text"
                                placeholder={t('workstreams.form.locationPlaceholder')}
                                value={formData.location}
                                disabled={isSavingWorkstream}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label htmlFor="workstream-quota" className={styles.label}>{t('workstreams.form.quota')}</label>
                                <span className={styles.requiredTag}>{t('workstreams.form.required')}</span>
                            </div>
                            <div className={styles.quotaInputWrap}>
                                <input
                                    id="workstream-quota"
                                    className={styles.input}
                                    type="number"
                                    required
                                    min="1"
                                    placeholder={t('workstreams.form.quotaPlaceholder')}
                                    value={formData.quota}
                                    disabled={isSavingWorkstream}
                                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                                />
                                <span className={styles.quotaBadge}>{t('workstreams.form.quotaUnit')}</span>
                            </div>
                            <p className={styles.fieldHint}>{t('workstreams.form.helpQuota')}</p>
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>{t('workstreams.form.assignManager')}</label>
                                <span className={styles.optionalTag}>{t('workstreams.form.optional')}</span>
                            </div>
                            <SearchableSelect
                                options={managers.map(m => ({ value: m.id, label: m.full_name }))}
                                value={formData.managerId}
                                onChange={(val) => setFormData({ ...formData, managerId: val })}
                                placeholder={t('workstreams.form.selectManager')}
                                searchPlaceholder={t('users.searchPlaceholder')}
                                onSearch={handleManagerSearch}
                                disabled={isSavingWorkstream}
                            />
                            <p className={styles.fieldHint}>{t('workstreams.form.helpManager')}</p>
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <div className={styles.labelRow}>
                                <label htmlFor="workstream-description" className={styles.label}>{t('workstreams.form.description')}</label>
                                <span className={styles.optionalTag}>{t('workstreams.form.optional')}</span>
                            </div>
                            <textarea
                                id="workstream-description"
                                className={styles.textarea}
                                placeholder={t('workstreams.form.descriptionPlaceholder')}
                                value={formData.description}
                                disabled={isSavingWorkstream}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <p className={styles.fieldHint}>{t('workstreams.form.helpDescription')}</p>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button" disabled={isSavingWorkstream}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSavingWorkstream} className={styles.submitButton}>
                            {isSavingWorkstream ? t('workstreams.saving') : (isEditing ? t('common.save') : t('workstreams.create'))}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={`${t('workstreams.config.title')}: ${selectedWorkstream?.workstream_name}`}>
                <form className={styles.form} onSubmit={handleSaveConfig}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className={styles.formGroup}>
                            <label>{t('workstreams.config.maxUsers')}</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={configMaxUsers}
                                onChange={(e) => setConfigMaxUsers(e.target.value)}
                            />
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
                                    <span>{t('workstreams.config.multiSchoolAnalytics')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="outline" onClick={() => setIsConfigModalOpen(false)} type="button" disabled={isSavingConfig}>{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit" disabled={isSavingConfig}>{isSavingConfig ? t('workstreams.savingConfig') : t('common.save')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WorkstreamManagement;
