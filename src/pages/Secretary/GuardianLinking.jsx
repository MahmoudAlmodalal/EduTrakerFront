import React, { useState } from 'react';
import { Search, Link as LinkIcon, MoreVertical, Shield, UserCheck, AlertCircle } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const GuardianLinking = () => {
    const [guardians] = useState([
        { id: 1, name: 'Sarah Connor', student: 'John Connor', relation: 'Mother', access: 'Full', status: 'Linked' },
        { id: 2, name: 'Kyle Reese', student: 'John Connor', relation: 'Father', access: 'Limited', status: 'Linked' },
        { id: 3, name: 'Martha Kent', student: 'Clark Kent', relation: 'Mother', access: 'Full', status: 'Linked' },
        { id: 4, name: 'Jonathan Kent', student: '-', relation: '-', access: 'None', status: 'Unlinked' },
    ]);

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const handleLinkClick = (guardian) => {
        setSelectedGuardian(guardian);
        setIsLinkModalOpen(true);
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Guardian Linking</h1>
                <p>Manage guardian accounts and student associations.</p>
            </header>

            <div className="management-card">
                <div className="table-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search guardians..."
                            className="search-input"
                        />
                    </div>
                    <div className="action-btn-group">
                        <button className="btn-primary" onClick={() => handleLinkClick(null)}>
                            <LinkIcon size={18} />
                            Link New Guardian
                        </button>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Guardian Name</th>
                            <th>Linked Student</th>
                            <th>Relationship</th>
                            <th>Access Level</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guardians.map((guardian) => (
                            <tr key={guardian.id}>
                                <td className="font-medium">{guardian.name}</td>
                                <td>{guardian.student}</td>
                                <td>{guardian.relation}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className={guardian.access === 'Full' ? 'text-green-600' : 'text-gray-400'} />
                                        {guardian.access}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${guardian.status === 'Linked' ? 'status-active' : 'status-inactive'}`}>
                                        {guardian.status}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleLinkClick(guardian)}
                                        title="Manage Link"
                                    >
                                        <LinkIcon size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title={selectedGuardian ? `Manage Link: ${selectedGuardian.name}` : "Link Guardian to Student"}
            >
                <form className="space-y-4">
                    {!selectedGuardian && (
                        <div className="form-group">
                            <label className="form-label">Search Guardian</label>
                            <input type="text" className="form-input" placeholder="Enter guardian name or email..." />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Select Student</label>
                        <input type="text" className="form-input" placeholder="Search student name..." defaultValue={selectedGuardian?.student === '-' ? '' : selectedGuardian?.student} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Relationship to Student</label>
                        <select className="form-select" defaultValue={selectedGuardian?.relation}>
                            <option value="">Select Relationship</option>
                            <option value="Mother">Mother</option>
                            <option value="Father">Father</option>
                            <option value="Guardian">Legal Guardian</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Access Permissions</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="grades" defaultChecked />
                            <label htmlFor="grades" className="text-gray-700 text-sm">View Grades</label>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="attendance" defaultChecked />
                            <label htmlFor="attendance" className="text-gray-700 text-sm">View Attendance</label>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="financial" />
                            <label htmlFor="financial" className="text-gray-700 text-sm">Financial Access (Fees)</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsLinkModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>Cancel</button>
                        <button type="button" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
