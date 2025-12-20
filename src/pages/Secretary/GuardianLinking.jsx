import React, { useState } from 'react';
import { Search, Link as LinkIcon, MoreVertical, Shield, UserCheck, AlertCircle, Trash } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';


const GuardianLinking = () => {

    // State for Guardians
    const [guardians, setGuardians] = useState(() => {
        const saved = localStorage.getItem('secretary_guardians');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Sarah Connor', student: 'John Connor', relation: 'Mother', access: 'Full', status: 'Linked' },
            { id: 2, name: 'Kyle Reese', student: 'John Connor', relation: 'Father', access: 'Limited', status: 'Linked' },
            { id: 3, name: 'Martha Kent', student: 'Clark Kent', relation: 'Mother', access: 'Full', status: 'Linked' },
            { id: 4, name: 'Jonathan Kent', student: '-', relation: '-', access: 'None', status: 'Unlinked' },
        ];
    });

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);
    const [formData, setFormData] = useState({
        name: '', student: '', relation: '', access: 'Full', status: 'Linked'
    });

    // Persist Guardians
    React.useEffect(() => {
        localStorage.setItem('secretary_guardians', JSON.stringify(guardians));
    }, [guardians]);

    const handleLinkClick = (guardian) => {
        if (guardian) {
            setSelectedGuardian(guardian);
            setFormData({
                name: guardian.name,
                student: guardian.student === '-' ? '' : guardian.student,
                relation: guardian.relation === '-' ? '' : guardian.relation,
                access: guardian.access === 'None' ? 'Full' : guardian.access,
                status: guardian.status
            });
        } else {
            setSelectedGuardian(null);
            setFormData({ name: '', student: '', relation: 'Mother', access: 'Full', status: 'Linked' });
        }
        setIsLinkModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (selectedGuardian) {
            // Update existing
            const updated = guardians.map(g => g.id === selectedGuardian.id ? {
                ...g,
                name: formData.name,
                student: formData.student || '-',
                relation: formData.relation || '-',
                access: formData.student ? formData.access : 'None',
                status: formData.student ? 'Linked' : 'Unlinked'
            } : g);
            setGuardians(updated);
        } else {
            // Create New
            const newGuardian = {
                id: Date.now(),
                name: formData.name,
                student: formData.student || '-',
                relation: formData.relation || '-',
                access: formData.student ? formData.access : 'None',
                status: formData.student ? 'Linked' : 'Unlinked'
            };
            setGuardians([...guardians, newGuardian]);
        }
        setIsLinkModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to remove this guardian?')) {
            setGuardians(guardians.filter(g => g.id !== id));
        }
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
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleDelete(guardian.id)}
                                        title="Delete Link"
                                        style={{ color: 'var(--color-error)' }}
                                    >
                                        <Trash size={18} />
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
                <form className="space-y-4" onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Guardian Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Enter guardian name..." 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    {selectedGuardian && selectedGuardian.status === 'Unlinked' && (
                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-md mb-4">
                            <div className="flex items-center">
                                <AlertCircle size={20} className="mr-2" />
                                <p className="font-bold">Linking Issue Detected</p>
                            </div>
                            <p className="text-sm mt-1">This guardian is registered but not linked to a student.</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Select Student</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Search student name..." 
                            value={formData.student}
                            onChange={(e) => setFormData({...formData, student: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Relationship to Student</label>
                        <select 
                            className="form-select" 
                            value={formData.relation}
                            onChange={(e) => setFormData({...formData, relation: e.target.value})}
                        >
                            <option value="">Select Relationship</option>
                            <option value="Mother">Mother</option>
                            <option value="Father">Father</option>
                            <option value="Guardian">Legal Guardian</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Access Level</label>
                        <select 
                            className="form-select" 
                            value={formData.access}
                            onChange={(e) => setFormData({...formData, access: e.target.value})}
                        >
                            <option value="Full">Full Access (All records)</option>
                            <option value="Limited">Limited Access (Grades only)</option>
                            <option value="None">No Access</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsLinkModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
