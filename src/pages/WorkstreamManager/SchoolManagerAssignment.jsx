import React, { useState } from 'react';
import { UserPlus, Search, Shield, School, Mail, Trash2, Edit, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Workstream.css';

const SchoolManagerAssignment = () => {
    const { t } = useTheme();
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [managers, setManagers] = useState(() => {
        const saved = localStorage.getItem('ws_manager_assignments');
        return saved ? JSON.parse(saved) : [];
    });

    React.useEffect(() => {
        localStorage.setItem('ws_manager_assignments', JSON.stringify(managers));
    }, [managers]);

    const [newManager, setNewManager] = useState({ name: '', email: '', schoolId: '', isEditing: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');

    // Load Schools from Shared Storage for dropdown
    const schools = JSON.parse(localStorage.getItem('ws_schools') || '[]');

    const handleAssignManager = (e) => {
        e.preventDefault();
        const schoolName = schools.find(s => s.id === parseInt(newManager.schoolId))?.name || 'Unassigned';

        if (newManager.isEditing) {
            setManagers(managers.map(manager =>
                manager.id === newManager.id
                    ? {
                        ...manager,
                        name: newManager.name,
                        email: newManager.email,
                        school: schoolName,
                        status: newManager.schoolId ? 'Assigned' : 'Available'
                    }
                    : manager
            ));
        } else {
            const manager = {
                id: managers.length + 1,
                name: newManager.name,
                email: newManager.email,
                school: schoolName,
                status: newManager.schoolId ? 'Assigned' : 'Available'
            };
            setManagers([manager, ...managers]);
        }

        setNewManager({ name: '', email: '', schoolId: '', isEditing: false, id: null });
        setShowAssignForm(false);
    };

    const handleDeleteManager = (id) => {
        if (window.confirm(t('workstream.assignments.confirmDelete'))) {
            setManagers(managers.filter(m => m.id !== id));
        }
    };

    const handleEditManager = (id) => {
        const manager = managers.find(m => m.id === id);
        if (manager) {
            // Find school ID from name for the dropdown
            const foundSchool = schools.find(s => s.name === manager.school);
            setNewManager({
                name: manager.name,
                email: manager.email,
                schoolId: foundSchool ? foundSchool.id : '',
                isEditing: true,
                id: manager.id
            });
            setShowAssignForm(true);
        }
    };

    const filteredManagers = managers.filter(manager =>
        manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.school.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                value={newManager.name}
                                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>{t('workstream.assignments.form.assignTo')}</label>
                            <select
                                value={newManager.schoolId}
                                onChange={(e) => setNewManager({ ...newManager, schoolId: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                            >
                                <option value="">{t('workstream.assignments.form.selectSchool')}</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary">{newManager.isEditing ? t('workstream.assignments.updateBtn') : t('workstream.assignments.assignBtn')}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setNewManager({ name: '', email: '', schoolId: '', isEditing: false, id: null });
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
                                padding: '0.5rem 2.5rem 0.5rem 2.5rem', // Added padding right for X button
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
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
                                            {manager.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{manager.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {manager.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <School size={16} color="var(--color-text-muted)" />
                                        <span style={{ color: manager.school === 'Unassigned' ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {manager.school}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${manager.status === 'Assigned' ? 'status-active' : 'status-inactive'}`}>
                                        {manager.status}
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
                                            title="Remove Manager"
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
