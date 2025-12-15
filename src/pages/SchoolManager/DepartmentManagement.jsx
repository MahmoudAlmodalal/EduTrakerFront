import React, { useState } from 'react';
import {
    Briefcase,
    Users,
    Plus,
    MoreVertical,
    Search,
    Edit,
    Trash
} from 'lucide-react';
import './SchoolManager.css';

const DepartmentManagement = () => {
    // Mock Data
    const [departments, setDepartments] = useState([
        { id: 1, name: 'Science', head: 'Sarah Johnson', members: 8 },
        { id: 2, name: 'Mathematics', head: 'John Smith', members: 6 },
        { id: 3, name: 'Languages', head: 'Michael Brown', members: 10 },
        { id: 4, name: 'Arts & Humanities', head: 'Emily Davis', members: 5 },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDept, setCurrentDept] = useState(null);
    const [formData, setFormData] = useState({ name: '', head: '', members: 0 });

    const openModal = (dept = null) => {
        if (dept) {
            setCurrentDept(dept);
            setFormData({ name: dept.name, head: dept.head, members: dept.members });
        } else {
            setCurrentDept(null);
            setFormData({ name: '', head: '', members: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (currentDept) {
            setDepartments(departments.map(d => d.id === currentDept.id ? { ...d, ...formData } : d));
        } else {
            setDepartments([...departments, { id: departments.length + 1, ...formData }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            setDepartments(departments.filter(d => d.id !== id));
        }
    };

    return (
        <div className="department-management-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Department Management</h1>
                <p className="school-manager-subtitle">Organize academic departments and assign leadership.</p>
            </div>

            <div className="management-card">
                <div className="table-header-actions">
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search departments..."
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
                        Create Department
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Department Name</th>
                            <th>Head of Department</th>
                            <th>Teachers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((dept) => (
                            <tr key={dept.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ padding: '6px', background: 'var(--color-primary-light)', borderRadius: '6px', color: 'var(--color-primary)' }}>
                                            <Briefcase size={16} />
                                        </div>
                                        <span className="font-medium text-gray-900">{dept.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                            {dept.head.charAt(0)}
                                        </div>
                                        {dept.head}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={16} className="text-gray-400" />
                                        {dept.members} Members
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openModal(dept)} className="icon-btn" style={{ padding: '4px', color: 'var(--color-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(dept.id)} className="icon-btn" style={{ padding: '4px', color: 'var(--color-error)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '400px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>{currentDept ? 'Edit Department' : 'Create Department'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Department Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Head of Department</label>
                                <input
                                    required
                                    value={formData.head}
                                    onChange={e => setFormData({ ...formData, head: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Number of Members</label>
                                <input
                                    type="number"
                                    value={formData.members}
                                    onChange={e => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem' }}
                                />
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

export default DepartmentManagement;
