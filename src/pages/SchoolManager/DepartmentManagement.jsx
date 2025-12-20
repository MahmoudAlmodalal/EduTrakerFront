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
                    <button className="btn-primary">
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
                                        <button className="icon-btn" style={{ padding: '4px', color: 'var(--color-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="icon-btn" style={{ padding: '4px', color: 'var(--color-error)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                            <Trash size={16} />
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

export default DepartmentManagement;
