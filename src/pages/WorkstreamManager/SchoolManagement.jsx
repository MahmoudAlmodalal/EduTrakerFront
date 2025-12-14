import React, { useState } from 'react';
import { Plus, Search, MapPin, Users, Settings, MoreVertical, Edit, CheckCircle } from 'lucide-react';
import './Workstream.css';

const SchoolManagement = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [schools, setSchools] = useState([
        { id: 1, name: 'Springfield Elementary', location: 'Springfield', capacity: 500, students: 450, status: 'Active' },
        { id: 2, name: 'Shelbyville High', location: 'Shelbyville', capacity: 1200, students: 1100, status: 'Active' },
        { id: 3, name: 'Ogdenville Tech', location: 'Ogdenville', capacity: 300, students: 150, status: 'Inactive' },
    ]);

    const [newSchool, setNewSchool] = useState({ name: '', location: '', capacity: '' });

    const handleCreateSchool = (e) => {
        e.preventDefault();
        const school = {
            id: schools.length + 1,
            ...newSchool,
            students: 0,
            status: 'Active'
        };
        setSchools([...schools, school]);
        setNewSchool({ name: '', location: '', capacity: '' });
        setShowCreateForm(false);
    };

    const handleActivateAll = () => {
        setSchools(schools.map(school => ({ ...school, status: 'Active' })));
    };

    const handleEditSchool = (id) => {
        console.log('Edit school', id);
        // Logic to open edit modal would go here
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">School Management</h1>
                        <p className="workstream-subtitle">Create and organize schools in your workstream.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={handleActivateAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>
                            <CheckCircle size={18} />
                            Activate All
                        </button>
                        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                            <Plus size={20} />
                            Create School
                        </button>
                    </div>
                </div>
            </div>

            {showCreateForm && (
                <div className="management-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                    <h3 className="chart-title" style={{ marginBottom: '1rem' }}>Add New School</h3>
                    <form onSubmit={handleCreateSchool} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>School Name</label>
                            <input
                                type="text"
                                required
                                value={newSchool.name}
                                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="e.g. Lincoln High School"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Location</label>
                            <input
                                type="text"
                                required
                                value={newSchool.location}
                                onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="e.g. 123 Main St"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Capacity</label>
                            <input
                                type="number"
                                required
                                value={newSchool.capacity}
                                onChange={(e) => setNewSchool({ ...newSchool, capacity: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                placeholder="Total student capacity"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary">Save School</button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
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
                            placeholder="Search schools..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Filter placeholder */}
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>School Name</th>
                            <th>Location</th>
                            <th>Capacity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schools.map((school) => (
                            <tr key={school.id}>
                                <td>
                                    <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{school.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{school.id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)' }}>
                                        <MapPin size={14} />
                                        {school.location}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Users size={14} color="var(--color-text-muted)" />
                                        <span>{school.students} / {school.capacity}</span>
                                    </div>
                                    <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                        <div style={{
                                            width: `${(school.students / school.capacity) * 100}%`,
                                            height: '100%',
                                            background: 'var(--color-primary)',
                                            borderRadius: '2px'
                                        }}></div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${school.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                        {school.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditSchool(school.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-primary)' }}
                                            title="Edit School"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
                                            <MoreVertical size={18} color="var(--color-text-muted)" />
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

export default SchoolManagement;
