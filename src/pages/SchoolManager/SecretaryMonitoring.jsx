import React, { useState } from 'react';
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
import './SchoolManager.css';

const SecretaryMonitoring = () => {
    // Mock Data
    const [secretaries, setSecretaries] = useState([
        { id: 1, name: 'Jessica Pearson', email: 'j.pearson@school.edu', phone: '+1 555-0123', status: 'Active', joined: '2022-08-15' },
        { id: 2, name: 'Louis Litt', email: 'l.litt@school.edu', phone: '+1 555-0124', status: 'Active', joined: '2021-03-10' },
        { id: 3, name: 'Donna Paulsen', email: 'd.paulsen@school.edu', phone: '+1 555-0125', status: 'On Leave', joined: '2020-01-20' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSec, setCurrentSec] = useState(null); // For Edit
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'Active' });

    const openModal = (sec = null) => {
        if (sec) {
            setCurrentSec(sec);
            setFormData({ name: sec.name, email: sec.email, phone: sec.phone, status: sec.status });
        } else {
            setCurrentSec(null);
            setFormData({ name: '', email: '', phone: '', status: 'Active' });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (currentSec) {
            // Edit
            setSecretaries(secretaries.map(s => s.id === currentSec.id ? { ...s, ...formData } : s));
        } else {
            // Create
            setSecretaries([...secretaries, { id: secretaries.length + 1, ...formData, joined: new Date().toISOString().split('T')[0] }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this secretary?')) {
            setSecretaries(secretaries.filter(s => s.id !== id));
        }
    };

    return (
        <div className="secretary-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Secretary Monitoring</h1>
                <p className="school-manager-subtitle">Manage administrative staff and secretary access.</p>
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
                        Add Secretary
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact Info</th>
                            <th>Status</th>
                            <th>Date Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {secretaries.map((sec) => (
                            <tr key={sec.id}>
                                <td>
                                    <div className="font-medium text-gray-900">{sec.name}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Mail size={12} />
                                            {sec.email}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={12} />
                                            {sec.phone}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${sec.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                        {sec.status === 'Active' ? <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                                        {sec.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                                        <Calendar size={14} />
                                        {sec.joined}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openModal(sec)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(sec.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                            Delete
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
                                    required
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
                                    <option value="On Leave">On Leave</option>
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
