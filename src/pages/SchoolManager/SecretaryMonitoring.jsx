import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Mail, Briefcase } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import './SchoolManager.css';

const TABLE_ROWS_PER_PAGE = 10;

const SecretaryMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        department: '',
        hire_date: ''
    });

    const fetchSecretaries = useCallback(async () => {
        try {
            setLoading(true);
            const data = await managerService.getSecretaries({ include_inactive: true });
            setSecretaries(Array.isArray(data) ? data : (data?.results || []));
        } catch (err) {
            console.error('Error fetching secretaries:', err);
            setSecretaries([]);
            showError('Failed to load secretaries.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchSecretaries();
    }, [fetchSecretaries]);

    const filteredSecretaries = secretaries.filter(sec => {
        const name = sec.full_name || sec.name || '';
        const email = sec.email || '';
        const term = searchTerm.toLowerCase();
        return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
    });

    const totalPages = Math.max(1, Math.ceil(filteredSecretaries.length / TABLE_ROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedSecretaries = filteredSecretaries.slice(
        (currentPage - 1) * TABLE_ROWS_PER_PAGE,
        currentPage * TABLE_ROWS_PER_PAGE
    );

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
                showSuccess('Secretary updated successfully.');
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
                showSuccess('Secretary created successfully.');
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

    const handleToggleStatus = async (secretary) => {
        const id = secretary.user_id || secretary.id;
        const isActive = secretary.is_active !== false;
        setTogglingId(id);
        try {
            if (isActive) {
                await managerService.deactivateSecretary(id);
                showSuccess('Secretary deactivated successfully.');
            } else {
                await managerService.activateSecretary(id);
                showSuccess('Secretary activated successfully.');
            }
            await fetchSecretaries();
        } catch (err) {
            console.error('Error toggling secretary status:', err);
            showError(isActive ? 'Failed to deactivate secretary.' : 'Failed to activate secretary.');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="management-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.secretaries.title') || 'Secretary Monitoring'}</h1>
            </div>

            {/* Main Card with Search and Table */}
            <div className="management-card">
                <div className="table-header-actions">
                    <div className="sm-search-control">
                        <Search size={18} className="sm-search-control-icon" />
                        <input
                            type="text"
                            placeholder={t('common.search') || 'Search secretaries...'}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="sm-search-control-input"
                        />
                    </div>
                    <button className="btn-primary" onClick={handleOpenCreate}>
                        <Plus size={18} />
                        {t('school.secretaries.addSecretary') || 'Add Secretary'}
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {t('common.loading') || 'Loading...'}
                    </div>
                ) : (
                    <div className="sm-table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Secretary</th>
                                    <th>School</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSecretaries.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                            No secretaries found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSecretaries.map((sec) => {
                                        const id = sec.user_id || sec.id;
                                        const isActive = sec.is_active !== false;
                                        return (
                                            <tr key={id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            background: '#f3e8ff', color: '#9333ea',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 'bold', fontSize: '0.875rem'
                                                        }}>
                                                            {(sec.full_name || sec.name)?.charAt(0)?.toUpperCase() || 'S'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                                {sec.full_name || sec.name || '-'}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Mail size={12} /> {sec.email || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ color: sec.school_name ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                                    {sec.school_name || 'Not assigned'}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Briefcase size={14} color="var(--color-text-muted)" />
                                                        <span style={{ color: sec.department ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                                            {sec.department || 'Not assigned'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`status-badge ${isActive ? 'status-active active' : 'status-inactive inactive'} status-toggle-btn`}
                                                        onClick={() => handleToggleStatus(sec)}
                                                        disabled={togglingId === id}
                                                        title={isActive ? 'Click to deactivate' : 'Click to activate'}
                                                    >
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleOpenEdit(sec)}
                                                            title="Edit"
                                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredSecretaries.length > 0 ? (
                    <div className="sm-table-pagination">
                        <span className="sm-table-pagination-summary">
                            Showing {(currentPage - 1) * TABLE_ROWS_PER_PAGE + 1}
                            -
                            {Math.min(currentPage * TABLE_ROWS_PER_PAGE, filteredSecretaries.length)} of {filteredSecretaries.length}
                        </span>
                        <div className="sm-table-pagination-controls">
                            <button
                                type="button"
                                className="sm-btn-secondary"
                                onClick={() => setPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
                            <span className="sm-table-pagination-page">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                className="sm-btn-secondary"
                                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={isEditing ? 'Edit Secretary' : 'Add New Secretary'}
            >
                {error && (
                    <div style={{
                        padding: '0.75rem', marginBottom: '1rem', borderRadius: '0.375rem',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder="secretary@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Password {!isEditing && '*'}
                        </label>
                        <input
                            type="password"
                            required={!isEditing}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Department
                        </label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                            placeholder="e.g. Administration, Finance, Records"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Hire Date
                        </label>
                        <input
                            type="date"
                            value={formData.hire_date}
                            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => { setShowModal(false); resetForm(); }}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {isEditing ? 'Update Secretary' : 'Create Secretary'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SecretaryMonitoring;
