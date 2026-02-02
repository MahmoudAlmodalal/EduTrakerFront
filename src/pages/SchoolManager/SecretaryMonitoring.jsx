import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const SecretaryMonitoring = () => {
    const { t } = useTheme();
    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSec, setCurrentSec] = useState(null); // For Edit
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'Active' });

    useEffect(() => {
        fetchSecretaries();
    }, []);

    const fetchSecretaries = async () => {
        setLoading(true);
        try {
            const response = await managerService.getSecretaries();
            setSecretaries(response.results || response);
        } catch (error) {
            console.error('Failed to fetch secretaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (sec = null) => {
        if (sec) {
            setCurrentSec(sec);
            setFormData({
                name: sec.full_name || sec.name,
                email: sec.email,
                phone: sec.phone || '',
                status: sec.is_active ? 'Active' : 'Inactive'
            });
        } else {
            setCurrentSec(null);
            setFormData({ name: '', email: '', phone: '', status: 'Active' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentSec) {
                // Edit
                await managerService.updateSecretary(currentSec.id, formData);
            } else {
                // Create
                await managerService.createSecretary(formData);
            }
            fetchSecretaries();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save secretary:', error);
            alert('Failed to save secretary. Please check your permissions.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this secretary?')) {
            try {
                await managerService.deactivateSecretary(id);
                fetchSecretaries();
            } catch (error) {
                console.error('Failed to deactivate secretary:', error);
            }
        }
    };

    if (loading) return <div className="secretary-monitoring-page">Loading...</div>;

    return (
        <div className="secretary-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.secretaries.title')}</h1>
                <p className="school-manager-subtitle">{t('school.secretaries.subtitle')}</p>
            </div>

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search secretaries..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        {t('school.secretaries.addSecretary')}
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('school.secretaries.name')}</th>
                            <th>{t('school.secretaries.email')}</th>
                            <th>{t('school.secretaries.status')}</th>
                            <th>{t('student.attendance.date')}</th>
                            <th>{t('school.secretaries.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {secretaries.map((sec) => (
                            <tr key={sec.id}>
                                <td>
                                    <div className="font-medium text-gray-900">{sec.full_name || sec.name}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Mail size={12} />
                                            {sec.email}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={12} />
                                            {sec.phone || 'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${sec.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {sec.is_active ? <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                                        {sec.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                                        <Calendar size={14} />
                                        {sec.date_joined ? new Date(sec.date_joined).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openModal(sec)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>
                                            {t('school.secretaries.edit')}
                                        </button>
                                        <button onClick={() => handleDelete(sec.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                            {t('school.secretaries.delete')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>{currentSec ? 'Edit Secretary' : 'Add Secretary'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Full Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone</label>
                                <input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecretaryMonitoring;
