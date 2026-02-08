import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Shield, AlertCircle, UserPlus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';
import '../WorkstreamManager/Workstream.css';

const GuardianLinking = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [guardians, setGuardians] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);
    const [guardianLinks, setGuardianLinks] = useState([]);
    const [linkData, setLinkData] = useState({
        student_id: '',
        relationship_type: 'parent',
        is_primary: false,
        can_pickup: true,
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGuardian, setNewGuardian] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: 'Guardian@123',
    });

    const schoolId = user?.school_id || user?.school;

    useEffect(() => {
        fetchGuardians();
        fetchStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const fetchGuardians = async (search = '') => {
        try {
            setLoading(true);
            const data = await secretaryService.getGuardians(search);
            setGuardians(data.results || data || []);
        } catch (err) {
            console.error('Error fetching guardians:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const data = await secretaryService.getStudents({ school_id: schoolId });
            setStudents(data.results || data || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const fetchGuardianLinks = async (guardianId) => {
        try {
            const data = await secretaryService.getGuardianLinks(guardianId);
            setGuardianLinks(data.results || data || []);
        } catch (err) {
            console.error('Error fetching guardian links:', err);
            setGuardianLinks([]);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleLinkClick = async (guardian) => {
        setSelectedGuardian(guardian);
        setLinkData({
            student_id: '',
            relationship_type: 'parent',
            is_primary: false,
            can_pickup: true,
        });
        await fetchGuardianLinks(guardian.user_id);
        setIsLinkModalOpen(true);
    };

    const handleSaveLink = async () => {
        if (!selectedGuardian || !linkData.student_id) {
            setError('Please select a student.');
            return;
        }
        setError('');
        setSuccess('');
        try {
            setLoading(true);
            await secretaryService.linkGuardianToStudent(
                selectedGuardian.user_id,
                linkData.student_id,
                {
                    relationship_type: linkData.relationship_type,
                    is_primary: linkData.is_primary,
                    can_pickup: linkData.can_pickup,
                }
            );
            setSuccess('Guardian linked to student successfully!');
            setIsLinkModalOpen(false);
            fetchGuardians();
        } catch (err) {
            const errData = err.response?.data || err;
            if (typeof errData === 'object' && !Array.isArray(errData)) {
                const messages = Object.entries(errData)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                setError(messages);
            } else {
                setError('Error linking guardian: ' + (err.message || 'Unknown error'));
            }
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

            {/* Status banners */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                    ✓ {success}
                </div>
            )}

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
                        <button className="btn-primary" onClick={() => fetchGuardians(searchTerm)}>
                            <Search size={18} />
                            Search
                        </button>
                        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                            <UserPlus size={18} />
                            Add Guardian
                        </button>
                    </div>
                </div>

                {loading ? <p className="text-center p-8">Loading guardians...</p> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t('secretary.guardians.guardianName')}</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>{t('secretary.guardians.status')}</th>
                                <th>{t('secretary.guardians.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guardians.map((guardian) => (
                                <tr key={guardian.user_id}>
                                    <td>#{guardian.user_id}</td>
                                    <td className="font-medium">{guardian.full_name}</td>
                                    <td>{guardian.email || '-'}</td>
                                    <td>{guardian.phone_number || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${guardian.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {guardian.is_active ? 'Active' : 'Inactive'}
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

            {/* Link Modal */}
            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title={selectedGuardian ? `Link Student to: ${selectedGuardian.full_name}` : 'Link Guardian to Student'}
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveLink(); }}>
                    {/* Show existing links */}
                    {guardianLinks.length > 0 && (
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                            <p className="text-sm font-bold text-blue-800 mb-2">Existing Links:</p>
                            {guardianLinks.map(link => (
                                <div key={link.id} className="text-sm text-blue-700" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <span>{link.student_name}</span>
                                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">{link.relationship_display || link.relationship_type}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Select Student *</label>
                        <select
                            className="form-select"
                            value={linkData.student_id}
                            onChange={(e) => setLinkData({ ...linkData, student_id: e.target.value })}
                            required
                        >
                            <option value="">Choose a student...</option>
                            {students.map(s => (
                                <option key={s.user_id} value={s.user_id}>
                                    {s.full_name} (#{s.user_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Relationship Type *</label>
                        <select
                            className="form-select"
                            value={linkData.relationship_type}
                            onChange={(e) => setLinkData({ ...linkData, relationship_type: e.target.value })}
                        >
                            <option value="parent">Parent</option>
                            <option value="legal_guardian">Legal Guardian</option>
                            <option value="foster_parent">Foster Parent</option>
                            <option value="sibling">Sibling</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ display: 'flex', gap: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={linkData.is_primary}
                                onChange={(e) => setLinkData({ ...linkData, is_primary: e.target.checked })}
                            />
                            <span className="text-sm">Primary Guardian</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={linkData.can_pickup}
                                onChange={(e) => setLinkData({ ...linkData, can_pickup: e.target.checked })}
                            />
                            <span className="text-sm">Can Pick Up Student</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsLinkModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Linking...' : 'Link Student'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create Guardian Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Guardian"
            >
                <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    setSuccess('');
                    setLoading(true);
                    try {
                        await secretaryService.createGuardian({
                            ...newGuardian,
                            school_id: schoolId
                        });
                        setSuccess('Guardian created successfully!');
                        setIsCreateModalOpen(false);
                        setNewGuardian({
                            full_name: '',
                            email: '',
                            phone_number: '',
                            password: 'Guardian@123',
                        });
                        fetchGuardians();
                    } catch (err) {
                        const errData = err.response?.data || err;
                        if (typeof errData === 'object' && !Array.isArray(errData)) {
                            const messages = Object.entries(errData)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join(' | ');
                            setError(messages);
                        } else {
                            setError('Error creating guardian: ' + (err.message || 'Unknown error'));
                        }
                    } finally {
                        setLoading(false);
                    }
                }}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newGuardian.full_name}
                            onChange={(e) => setNewGuardian({ ...newGuardian, full_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            value={newGuardian.email}
                            onChange={(e) => setNewGuardian({ ...newGuardian, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={newGuardian.phone_number}
                            onChange={(e) => setNewGuardian({ ...newGuardian, phone_number: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newGuardian.password}
                            onChange={(e) => setNewGuardian({ ...newGuardian, password: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Default: Guardian@123</p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Guardian'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
