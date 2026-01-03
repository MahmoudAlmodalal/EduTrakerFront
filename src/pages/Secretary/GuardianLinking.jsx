import React, { useState } from 'react';
import { Search, Link as LinkIcon, MoreVertical, Shield, UserCheck, AlertCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const GuardianLinking = () => {
    const { t } = useTheme();
    const [guardians, setGuardians] = useState(() => {
        const saved = localStorage.getItem('sec_guardians');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Sarah Connor', student: 'John Connor', relation: 'Mother', access: 'Full', status: 'Linked' },
            { id: 2, name: 'Kyle Reese', student: 'John Connor', relation: 'Father', access: 'Limited', status: 'Linked' },
            { id: 3, name: 'Martha Kent', student: 'Clark Kent', relation: 'Mother', access: 'Full', status: 'Linked' },
            { id: 4, name: 'Jonathan Kent', student: '-', relation: '-', access: 'None', status: 'Unlinked' },
        ];
    });

    React.useEffect(() => {
        localStorage.setItem('sec_guardians', JSON.stringify(guardians));
    }, [guardians]);

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleLinkClick = (guardian) => {
        setSelectedGuardian(guardian); // If null, it's "Add New"
        setIsLinkModalOpen(true);
    };

    const handleSaveGuardian = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const name = formData.get('guardianName') || selectedGuardian?.name;
        const student = formData.get('studentName');
        const relation = formData.get('relation');

        if (selectedGuardian) {
            // Edit Existing
            setGuardians(guardians.map(g => g.id === selectedGuardian.id ? { ...g, student, relation, status: 'Linked' } : g));
        } else {
            // Create New
            const newGuardian = {
                id: Date.now(),
                name: name,
                student: student,
                relation: relation,
                access: 'Full', // Default
                status: 'Linked'
            };
            setGuardians([...guardians, newGuardian]);
        }
        setIsLinkModalOpen(false);
    };

    const filteredGuardians = guardians.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.student.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.guardians.title')}</h1>
                <p>{t('secretary.guardians.subtitle')}</p>
            </header>

            <div className="management-card">
                <div className="table-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('secretary.guardians.searchGuardians')}
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="action-btn-group">
                        <button className="btn-primary" onClick={() => handleLinkClick(null)}>
                            <LinkIcon size={18} />
                            {t('secretary.guardians.linkNewGuardian')}
                        </button>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('secretary.guardians.guardianName')}</th>
                            <th>{t('secretary.guardians.linkedStudent')}</th>
                            <th>{t('secretary.guardians.relationship')}</th>
                            <th>{t('secretary.guardians.accessLevel')}</th>
                            <th>{t('secretary.guardians.status')}</th>
                            <th>{t('secretary.guardians.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGuardians.map((guardian) => (
                            <tr key={guardian.id}>
                                <td className="font-medium">{guardian.name}</td>
                                <td>{guardian.student}</td>
                                <td>{guardian.relation}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className={guardian.access === 'Full' ? 'text-green-600' : 'text-gray-400'} />
                                        {guardian.access === 'Full' ? t('secretary.guardians.full') :
                                            guardian.access === 'Limited' ? t('secretary.guardians.limited') : guardian.access}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${guardian.status === 'Linked' ? 'status-active' : 'status-inactive'}`}>
                                        {guardian.status === 'Linked' ? t('secretary.guardians.linked') : t('secretary.guardians.unlinked')}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleLinkClick(guardian)}
                                        title={t('secretary.guardians.manageLink')}
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
                title={selectedGuardian ? `${t('secretary.guardians.manageLink')}: ${selectedGuardian.name}` : t('secretary.guardians.linkGuardianToStudent')}
            >
                <form className="space-y-4" onSubmit={handleSaveGuardian}>
                    {!selectedGuardian ? (
                        <div className="form-group">
                            <label className="form-label">{t('secretary.guardians.searchGuardian')}</label>
                            <input name="guardianName" type="text" className="form-input" placeholder="Enter new guardian name" required />
                        </div>
                    ) : (
                         <div className="form-group">
                            <label className="form-label">Guardian</label>
                            <input type="text" className="form-input" value={selectedGuardian.name} disabled />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.selectStudent')}</label>
                        <input name="studentName" type="text" className="form-input" placeholder={t('secretary.guardians.searchStudent')} defaultValue={selectedGuardian?.student === '-' ? '' : selectedGuardian?.student} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.relationshipToStudent')}</label>
                        <select name="relation" className="form-select" defaultValue={selectedGuardian?.relation}>
                            <option value="">{t('secretary.guardians.selectRelationship')}</option>
                            <option value="Mother">{t('secretary.guardians.mother')}</option>
                            <option value="Father">{t('secretary.guardians.father')}</option>
                            <option value="Guardian">{t('secretary.guardians.legalGuardian')}</option>
                            <option value="Other">{t('secretary.guardians.other')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.accessPermissions')}</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="grades" defaultChecked />
                            <label htmlFor="grades" className="text-gray-700 text-sm">{t('secretary.guardians.viewGrades')}</label>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="attendance" defaultChecked />
                            <label htmlFor="attendance" className="text-gray-700 text-sm">{t('secretary.guardians.viewAttendance')}</label>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="financial" />
                            <label htmlFor="financial" className="text-gray-700 text-sm">{t('secretary.guardians.financialAccess')}</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsLinkModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary">{t('common.save')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
