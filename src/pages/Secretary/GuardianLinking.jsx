import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, MoreVertical, Shield, UserCheck, AlertCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const GuardianLinking = () => {
    const { t } = useTheme();
    const [guardians, setGuardians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);
    const [linkData, setLinkData] = useState({
        student_id: '',
        relationship: 'Guardian',
        access_level: 'Full'
    });

    useEffect(() => {
        fetchGuardians();
    }, []);

    const fetchGuardians = async (search = '') => {
        try {
            setLoading(true);
            const data = await secretaryService.getGuardians(search);
            setGuardians(data.results || data);
        } catch (error) {
            console.error('Error fetching guardians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Debounce or search on enter/button
    };

    const handleLinkClick = (guardian) => {
        setSelectedGuardian(guardian);
        setIsLinkModalOpen(true);
    };

    const handleSaveLink = async () => {
        if (!selectedGuardian || !linkData.student_id) return;
        try {
            setLoading(true);
            await secretaryService.linkGuardianToStudent(selectedGuardian.user_id || selectedGuardian.id, linkData.student_id, {
                relationship: linkData.relationship,
                access_level: linkData.access_level
            });
            alert('Guardian linked successfully!');
            setIsLinkModalOpen(false);
            fetchGuardians();
        } catch (error) {
            alert('Error linking guardian: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

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
                            onChange={handleSearch}
                            onKeyPress={(e) => e.key === 'Enter' && fetchGuardians(searchTerm)}
                        />
                    </div>
                    <div className="action-btn-group">
                        <button className="btn-primary" onClick={() => fetchGuardians(searchTerm)}>
                            <Search size={18} />
                            Search
                        </button>
                    </div>
                </div>

                {loading ? <p className="text-center p-8">Loading guardians...</p> : (
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
                            {guardians.map((guardian) => (
                                <tr key={guardian.id || guardian.user_id}>
                                    <td className="font-medium">{guardian.full_name || guardian.user?.full_name}</td>
                                    <td>{guardian.students?.map(s => s.full_name).join(', ') || '-'}</td>
                                    <td>{guardian.relationship || '-'}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className={guardian.access_level === 'Full' ? 'text-green-600' : 'text-gray-400'} />
                                            {guardian.access_level || 'None'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${guardian.students?.length > 0 ? 'status-active' : 'status-inactive'}`}>
                                            {guardian.students?.length > 0 ? t('secretary.guardians.linked') : t('secretary.guardians.unlinked')}
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
                            {guardians.length === 0 && (
                                <tr><td colSpan="6" className="text-center p-4">No guardians found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title={selectedGuardian ? `${t('secretary.guardians.manageLink')}: ${selectedGuardian.full_name || selectedGuardian.user?.full_name}` : t('secretary.guardians.linkGuardianToStudent')}
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveLink(); }}>
                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.selectStudent')}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('secretary.guardians.searchStudent')}
                            value={linkData.student_id}
                            onChange={(e) => setLinkData({ ...linkData, student_id: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter Student ID</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.relationshipToStudent')}</label>
                        <select
                            className="form-select"
                            value={linkData.relationship}
                            onChange={(e) => setLinkData({ ...linkData, relationship: e.target.value })}
                        >
                            <option value="Mother">{t('secretary.guardians.mother')}</option>
                            <option value="Father">{t('secretary.guardians.father')}</option>
                            <option value="Guardian">{t('secretary.guardians.legalGuardian')}</option>
                            <option value="Other">{t('secretary.guardians.other')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.accessPermissions')}</label>
                        <select
                            className="form-select"
                            value={linkData.access_level}
                            onChange={(e) => setLinkData({ ...linkData, access_level: e.target.value })}
                        >
                            <option value="Full">Full Access</option>
                            <option value="Limited">Limited Access</option>
                            <option value="View Only">View Only</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsLinkModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
