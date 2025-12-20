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
                    <button className="btn-primary">
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
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                                        <MoreVertical size={18} color="var(--color-text-muted)" />
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

export default SecretaryMonitoring;
