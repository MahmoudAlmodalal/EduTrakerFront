import React, { useState } from 'react';
import { UserPlus, Search, Shield, School, Mail, Trash2 } from 'lucide-react';
import './Workstream.css';

const SchoolManagerAssignment = () => {
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [managers, setManagers] = useState([
        { id: 1, name: 'Seymour Skinner', email: 'skinner@springfield.edu', school: 'Springfield Elementary', status: 'Assigned' },
        { id: 2, name: 'Gary Chalmers', email: 'chalmers@edu.gov', school: 'Unassigned', status: 'Available' },
        { id: 3, name: 'Edna Krabappel', email: 'krabappel@springfield.edu', school: 'Springfield Elementary', status: 'Assigned' },
    ]);

    const [newManager, setNewManager] = useState({ name: '', email: '', schoolId: '' });

    // Mock Schools for dropdown
    const schools = [
        { id: 1, name: 'Springfield Elementary' },
        { id: 2, name: 'Shelbyville High' },
        { id: 3, name: 'Ogdenville Tech' },
    ];

    const handleAssignManager = (e) => {
        e.preventDefault();
        const schoolName = schools.find(s => s.id === parseInt(newManager.schoolId))?.name || 'Unassigned';

        const manager = {
            id: managers.length + 1,
            name: newManager.name,
            email: newManager.email,
            school: schoolName,
            status: newManager.schoolId ? 'Assigned' : 'Available'
        };

        setManagers([manager, ...managers]);
        setNewManager({ name: '', email: '', schoolId: '' });
        setShowAssignForm(false);
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">School Manager Assignments</h1>
                        <p className="workstream-subtitle">Appoint and manage leaders for your schools.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAssignForm(true)}>
                        <UserPlus size={20} />
                        New Manager
                    </button>
                </div>
            </div>

            {showAssignForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>Appoint New School Manager</h3>
                    <form onSubmit={handleAssignManager} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={newManager.name}
                                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="Manager's Name"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Assign to School</label>
                            <select
                                value={newManager.schoolId}
                                onChange={(e) => setNewManager({ ...newManager, schoolId: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                            >
                                <option value="">Select a School (Optional)</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary">Create & Assign</button>
                            <button
                                type="button"
                                onClick={() => setShowAssignForm(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
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
                            placeholder="Search managers..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Manager</th>
                            <th>Assigned School</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {managers.map((manager) => (
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
                                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}>
                                        <Trash2 size={18} />
                                    </button>
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
