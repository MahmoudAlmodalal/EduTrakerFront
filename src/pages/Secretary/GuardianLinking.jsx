import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, AlertCircle, UserPlus, Users, Phone, Mail, CheckCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';

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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchGuardians(searchTerm);
        }
    };

    const handleLinkClick = async (guardian) => {
        setSelectedGuardian(guardian);
        setLinkData({
            student_id: '',
            relationship_type: 'parent',
            is_primary: false,
            can_pickup: true,
        });
        if (students.length === 0) {
            await fetchStudents();
        }
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

    const handleCreateGuardian = async (e) => {
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
    };

    // Filter guardians based on search term for instant filtering
    const filteredGuardians = guardians.filter(g =>
        (g.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="secretary-dashboard">
            {/* Header */}
            <div className="secretary-header">
                <div>
                    <h1>{t('secretary.guardians.title') || 'Guardian Management'}</h1>
                    <p>{t('secretary.guardians.subtitle') || 'Manage guardian accounts and student links'}</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <UserPlus size={18} />
                    Add Guardian
                </button>
            </div>

            {/* Status banners */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div style={{
                    background: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <CheckCircle size={18} /> {success}
                </div>
            )}

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <div className="stat-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', fontWeight: '500', marginBottom: '4px' }}>Total Guardians</p>
                            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>{guardians.length}</p>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                            color: '#4f46e5',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', fontWeight: '500', marginBottom: '4px' }}>Active</p>
                            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>{guardians.filter(g => g.is_active !== false).length}</p>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            color: '#059669',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', fontWeight: '500', marginBottom: '4px' }}>Students</p>
                            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>{students.length}</p>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            color: '#2563eb',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="management-card">
                {/* Search Bar */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '20px',
                    borderBottom: '1px solid var(--sec-border)',
                    alignItems: 'center'
                }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sec-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('secretary.guardians.searchGuardians') || 'Search guardians by name or email...'}
                            className="form-input"
                            value={searchTerm}
                            onChange={handleSearch}
                            onKeyPress={handleKeyPress}
                            style={{ paddingLeft: '36px', width: '100%' }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => fetchGuardians(searchTerm)}>
                        <Search size={16} />
                        Search
                    </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sec-text-muted)' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '3px solid var(--sec-primary)',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 12px'
                            }}></div>
                            Loading guardians...
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>ID</th>
                                    <th>{t('secretary.guardians.guardianName') || 'Guardian'}</th>
                                    <th>Contact</th>
                                    <th>{t('secretary.guardians.status') || 'Status'}</th>
                                    <th style={{ width: '100px' }}>{t('secretary.guardians.actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGuardians.map((guardian) => (
                                    <tr key={guardian.user_id}>
                                        <td style={{ color: 'var(--sec-text-muted)', fontSize: '13px' }}>#{guardian.user_id}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                                                    color: '#7c3aed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700',
                                                    fontSize: '15px'
                                                }}>
                                                    {(guardian.full_name || 'G').charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: '600', color: 'var(--sec-text-main)' }}>
                                                    {guardian.full_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {guardian.email && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--sec-text-muted)' }}>
                                                        <Mail size={14} /> {guardian.email}
                                                    </div>
                                                )}
                                                {guardian.phone_number && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--sec-text-muted)' }}>
                                                        <Phone size={14} /> {guardian.phone_number}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: guardian.is_active !== false
                                                    ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                                                    : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                                color: guardian.is_active !== false ? '#059669' : '#dc2626'
                                            }}>
                                                {guardian.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleLinkClick(guardian)}
                                                title={t('secretary.guardians.manageLink') || 'Link to Student'}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--sec-border)',
                                                    background: 'var(--sec-surface)',
                                                    color: 'var(--sec-primary)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--sec-primary)';
                                                    e.currentTarget.style.color = 'white';
                                                    e.currentTarget.style.borderColor = 'var(--sec-primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--sec-surface)';
                                                    e.currentTarget.style.color = 'var(--sec-primary)';
                                                    e.currentTarget.style.borderColor = 'var(--sec-border)';
                                                }}
                                            >
                                                <LinkIcon size={14} /> Link
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredGuardians.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--sec-text-muted)' }}>
                                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                            <p style={{ margin: 0 }}>No guardians found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Link Modal */}
            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title={selectedGuardian ? `Link Student to: ${selectedGuardian.full_name}` : 'Link Guardian to Student'}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSaveLink(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Show existing links */}
                    {guardianLinks.length > 0 && (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            padding: '16px'
                        }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1d4ed8', marginBottom: '12px' }}>Existing Links:</p>
                            {guardianLinks.map(link => (
                                <div key={link.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
                                }}>
                                    <span style={{ color: '#1e40af', fontSize: '14px' }}>{link.student_name}</span>
                                    <span style={{
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        color: '#1d4ed8',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>
                                        {link.relationship_display || link.relationship_type}
                                    </span>
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

                    <div style={{ display: 'flex', gap: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={linkData.is_primary}
                                onChange={(e) => setLinkData({ ...linkData, is_primary: e.target.checked })}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--sec-primary)' }}
                            />
                            <span style={{ fontSize: '14px', color: 'var(--sec-text-main)' }}>Primary Guardian</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={linkData.can_pickup}
                                onChange={(e) => setLinkData({ ...linkData, can_pickup: e.target.checked })}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--sec-primary)' }}
                            />
                            <span style={{ fontSize: '14px', color: 'var(--sec-text-main)' }}>Can Pick Up Student</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(false)}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid var(--sec-border)',
                                borderRadius: '8px',
                                background: 'var(--sec-surface)',
                                color: 'var(--sec-text-main)',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Cancel
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
                <form onSubmit={handleCreateGuardian} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newGuardian.full_name}
                            onChange={(e) => setNewGuardian({ ...newGuardian, full_name: e.target.value })}
                            placeholder="Enter guardian's full name"
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
                            placeholder="guardian@example.com"
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
                            placeholder="+1 (555) 000-0000"
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
                        <p style={{ fontSize: '12px', color: 'var(--sec-text-muted)', marginTop: '6px' }}>Default: Guardian@123</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid var(--sec-border)',
                                borderRadius: '8px',
                                background: 'var(--sec-surface)',
                                color: 'var(--sec-text-main)',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
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
