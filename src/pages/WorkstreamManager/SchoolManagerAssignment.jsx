import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, School, Mail, Trash2, Edit, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../utils/api';
import './Workstream.css';

const SchoolManagerAssignment = () => {
    const { t } = useTheme();
    const [loading, setLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [managers, setManagers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [newManager, setNewManager] = useState({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [managersData, schoolsData] = await Promise.all([
                api.get('/users/?role=manager_school'),
                api.get('/school/school/')
            ]);
            setManagers(managersData.results || managersData || []);
            setSchools(schoolsData || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignManager = async (e) => {
        e.preventDefault();
        try {
            if (newManager.isEditing) {
                await api.patch(`/users/${newManager.id}/`, {
                    full_name: newManager.full_name,
                    email: newManager.email,
                    school: newManager.schoolId || null
                });
            } else {
                await api.post('/users/create/', {
                    full_name: newManager.full_name,
                    email: newManager.email,
                    password: newManager.password || 'TemporaryPassword123!',
                    role: 'manager_school',
                    school: newManager.schoolId || null
                });
            }
            fetchData();
            setNewManager({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
            setShowAssignForm(false);
        } catch (error) {
            console.error('Failed to save manager:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDeleteManager = async (id) => {
        if (window.confirm(t('workstream.assignments.confirmDelete'))) {
            try {
                await api.post(`/users/${id}/deactivate/`);
                fetchData();
            } catch (error) {
                console.error('Failed to deactivate manager:', error);
            }
        }
    };

    const handleEditManager = (id) => {
        const manager = managers.find(m => m.id === id);
        if (manager) {
            setNewManager({
                full_name: manager.full_name,
                email: manager.email,
                schoolId: manager.school || '',
                isEditing: true,
                id: manager.id,
                password: '' // Don't show password on edit
            });
            setShowAssignForm(true);
        }
    };

    const filteredManagers = managers.filter(manager =>
        (manager.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (manager.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (manager.school_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && managers.length === 0) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    }

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.assignments.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.assignments.subtitle')}</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAssignForm(true)}>
                        <UserPlus size={20} />
                        {t('users.create')}
                    </button>
                </div>
            </div>

            {showAssignForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>{newManager.isEditing ? t('workstream.assignments.form.editTitle') : t('workstream.assignments.form.createTitle')}</h3>
                    <form onSubmit={handleAssignManager} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.managerName')}</label>
                            <input
                                type="text"
                                required
                                value={newManager.full_name}
                                onChange={(e) => setNewManager({ ...newManager, full_name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder={t('workstream.assignments.form.managerName')}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.email')}</label>
                            <input
                                type="email"
                                required
                                value={newManager.email}
                                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="email@example.com"
                            />
                        </div>
                        {!newManager.isEditing && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newManager.password}
                                    onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.assignTo')}</label>
                            <select
                                value={newManager.schoolId}
                                onChange={(e) => setNewManager({ ...newManager, schoolId: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                            >
                                <option value="">{t('workstream.assignments.form.selectSchool')}</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.school_name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>{newManager.isEditing ? t('workstream.assignments.updateBtn') : t('workstream.assignments.assignBtn')}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setNewManager({ full_name: '', email: '', schoolId: '', password: '', isEditing: false, id: null });
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('workstream.assignments.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('workstream.assignments.table.manager')}</th>
                            <th>{t('workstream.assignments.table.assignedSchool')}</th>
                            <th>{t('workstream.assignments.table.status')}</th>
                            <th>{t('workstream.assignments.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredManagers.map((manager) => (
                            <tr key={manager.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {manager.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{manager.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {manager.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <School size={16} color="var(--color-text-muted)" />
                                        <span style={{ color: !manager.school ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {manager.school_name || 'Unassigned'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${manager.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {manager.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditManager(manager.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                            title="Edit Manager"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteManager(manager.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                            title="Deactivate Manager"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchoolManagerAssignment;
