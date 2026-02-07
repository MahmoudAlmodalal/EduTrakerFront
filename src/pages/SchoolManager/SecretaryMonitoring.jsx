import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, X, UserCheck, UserX } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import './SchoolManager.css';

const SecretaryMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        department: '',
        hire_date: ''
    });

    const fetchSecretaries = async () => {
        try {
            setLoading(true);
            const data = await managerService.getSecretaries();
            setSecretaries(Array.isArray(data) ? data : (data?.results || []));
        } catch (err) {
            console.error('Error fetching secretaries:', err);
            setSecretaries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSecretaries();
    }, []);

    const filteredSecretaries = secretaries.filter(sec => {
        const name = sec.full_name || sec.name || '';
        const email = sec.email || '';
        const term = searchTerm.toLowerCase();
        return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
    });

    const resetForm = () => {
        setFormData({ full_name: '', email: '', password: '', department: '', hire_date: '' });
        setIsEditing(false);
        setEditId(null);
        setError('');
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = async (secretary) => {
        const id = secretary.user_id || secretary.id;
        try {
            const detail = await managerService.getSecretaryDetail(id);
            setFormData({
                full_name: detail.full_name || '',
                email: detail.email || '',
                password: '',
                department: detail.department || '',
                hire_date: detail.hire_date || ''
            });
            setIsEditing(true);
            setEditId(id);
            setShowModal(true);
        } catch (err) {
            console.error('Error fetching secretary detail:', err);
            // Fallback: use data from list
            setFormData({
                full_name: secretary.full_name || secretary.name || '',
                email: secretary.email || '',
                password: '',
                department: secretary.department || '',
                hire_date: secretary.hire_date || ''
            });
            setIsEditing(true);
            setEditId(id);
            setShowModal(true);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.full_name || !formData.email) {
            setError('Name and email are required.');
            return;
        }

        try {
            if (isEditing) {
                const updatePayload = {
                    full_name: formData.full_name,
                    email: formData.email,
                    department: formData.department,
                    hire_date: formData.hire_date || undefined
                };
                if (formData.password) {
                    updatePayload.password = formData.password;
                }
                await managerService.updateSecretary(editId, updatePayload);
            } else {
                if (!formData.password) {
                    setError('Password is required for new secretary.');
                    return;
                }
                const createPayload = {
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password,
                    school_id: user?.school_id || user?.school?.id || user?.school,
                    department: formData.department || undefined,
                    hire_date: formData.hire_date || undefined
                };
                await managerService.createSecretary(createPayload);
            }
            setShowModal(false);
            resetForm();
            await fetchSecretaries();
        } catch (err) {
            const errData = err?.response?.data;
            if (errData) {
                const messages = typeof errData === 'string'
                    ? errData
                    : Object.values(errData).flat().join('. ');
                setError(messages);
            } else {
                setError(err.message || 'Failed to save secretary.');
            }
        }
    };

    const handleDeactivate = async (secretary) => {
        const id = secretary.user_id || secretary.id;
        const name = secretary.full_name || secretary.name || 'this secretary';
        if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
        try {
            await managerService.deactivateSecretary(id);
            await fetchSecretaries();
        } catch (err) {
            console.error('Error deactivating secretary:', err);
            alert('Failed to deactivate secretary.');
        }
    };

    const handleActivate = async (secretary) => {
        const id = secretary.user_id || secretary.id;
        try {
            await managerService.activateSecretary(id);
            await fetchSecretaries();
        } catch (err) {
            console.error('Error activating secretary:', err);
            alert('Failed to activate secretary.');
        }
    };

    return (
        <div className="management-page">
            <div className="school-manager-header">
                <div>
                    <h1 className="school-manager-title">{t('school.secretaries.title') || 'Secretary Monitoring'}</h1>
                    <p className="school-manager-subtitle">{t('school.secretaries.subtitle') || 'Manage and monitor administrative staff.'}</p>
                </div>
                <button className="btn-primary" onClick={handleOpenCreate}>
                    <Plus size={18} />
                    {t('school.secretaries.addSecretary') || 'Add Secretary'}
                </button>
            </div>

            {/* Search */}
            <div className="management-card" style={{ padding: '1rem 1.5rem' }}>
                <div className="search-container" style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('common.search') || 'Search secretaries...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)', fontSize: '0.875rem' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="management-card" style={{ marginTop: '1rem' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {t('common.loading') || 'Loading...'}
                    </div>
                ) : filteredSecretaries.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {t('common.noResults') || 'No secretaries found.'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={thStyle}>{t('common.name') || 'Name'}</th>
                                    <th style={thStyle}>{t('common.email') || 'Email'}</th>
                                    <th style={thStyle}>{t('common.department') || 'Department'}</th>
                                    <th style={thStyle}>{t('common.status') || 'Status'}</th>
                                    <th style={thStyle}>{t('common.actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSecretaries.map((sec) => {
                                    const id = sec.user_id || sec.id;
                                    const isActive = sec.is_active !== false;
                                    return (
                                        <tr key={id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={tdStyle}>{sec.full_name || sec.name || '-'}</td>
                                            <td style={tdStyle}>{sec.email || '-'}</td>
                                            <td style={tdStyle}>{sec.department || '-'}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    color: isActive ? '#10b981' : '#ef4444'
                                                }}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleOpenEdit(sec)} title="Edit" style={actionBtnStyle}>
                                                        <Edit size={16} />
                                                    </button>
                                                    {isActive ? (
                                                        <button onClick={() => handleDeactivate(sec)} title="Deactivate" style={{ ...actionBtnStyle, color: 'var(--color-error, #ef4444)' }}>
                                                            <UserX size={16} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleActivate(sec)} title="Activate" style={{ ...actionBtnStyle, color: 'var(--color-success, #10b981)' }}>
                                                            <UserCheck size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}>
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                                {isEditing ? (t('school.secretaries.editSecretary') || 'Edit Secretary') : (t('school.secretaries.addSecretary') || 'Add Secretary')}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>{t('common.fullName') || 'Full Name'} *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>{t('common.email') || 'Email'} *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>
                                    {t('common.password') || 'Password'} {!isEditing && '*'}
                                </label>
                                <input
                                    type="password"
                                    required={!isEditing}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={inputStyle}
                                    placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>{t('common.department') || 'Department'}</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    style={inputStyle}
                                    placeholder="e.g. Administration"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>{t('common.hireDate') || 'Hire Date'}</label>
                                <input
                                    type="date"
                                    value={formData.hire_date}
                                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button type="submit" className="btn-primary">
                                    {isEditing ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Shared styles
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-main)' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--color-text-muted)', transition: 'all 0.2s' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-main)' };
const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)', fontSize: '0.875rem' };

export default SecretaryMonitoring;
