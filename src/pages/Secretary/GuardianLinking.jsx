import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Link as LinkIcon, Mail, Phone, Search, UserPlus, Users } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import {
    AlertBanner,
    AvatarInitial,
    EmptyState,
    LoadingSpinner,
    PageHeader,
    StatCard,
    StatusBadge,
} from './components';
import './Secretary.css';

const DEFAULT_LINK_DATA = {
    student_id: '',
    relationship_type: 'parent',
    is_primary: false,
    can_pickup: true,
};

const DEFAULT_GUARDIAN = {
    full_name: '',
    email: '',
    phone_number: '',
    password: 'Guardian@123',
};

const RELATIONSHIP_OPTIONS = [
    { value: 'parent', label: 'Parent' },
    { value: 'legal_guardian', label: 'Legal Guardian' },
    { value: 'foster_parent', label: 'Foster Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' },
];

const toList = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.results)) {
        return payload.results;
    }

    return [];
};

const getEntityId = (record) => record?.user_id ?? record?.id ?? null;

const getStudentIdFromLink = (link) => {
    return link?.student_id ?? link?.student?.user_id ?? link?.student?.id ?? null;
};

const getStudentName = (student) => {
    if (student?.full_name) {
        return student.full_name;
    }

    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ').trim();
    return fullName || 'Student';
};

const humanize = (value = '') => {
    const normalized = value.toString().trim().toLowerCase();

    if (!normalized) {
        return 'N/A';
    }

    return normalized
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatApiError = (error, fallback) => {
    const errData = error.response?.data || error;

    if (typeof errData === 'object' && !Array.isArray(errData)) {
        return Object.entries(errData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');
    }

    return error.message || fallback;
};

const GuardianLinking = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();

    const isMountedRef = useRef(true);
    const guardiansRequestRef = useRef(0);
    const linksRequestRef = useRef(0);

    const [guardians, setGuardians] = useState([]);
    const [students, setStudents] = useState([]);
    const [guardianLinks, setGuardianLinks] = useState([]);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [tableLoading, setTableLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [linksLoading, setLinksLoading] = useState(false);
    const [linkSubmitting, setLinkSubmitting] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [banner, setBanner] = useState({ type: 'error', message: '' });

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [linkData, setLinkData] = useState({ ...DEFAULT_LINK_DATA });
    const [newGuardian, setNewGuardian] = useState({ ...DEFAULT_GUARDIAN });
    const [showGuardianPassword, setShowGuardianPassword] = useState(false);

    const schoolId = user?.school_id || user?.school;

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            guardiansRequestRef.current += 1;
            linksRequestRef.current += 1;
        };
    }, []);

    const setFeedback = useCallback((type, message) => {
        if (!isMountedRef.current) {
            return;
        }

        setBanner({ type, message });

        if (type === 'success') {
            showSuccess(message);
            return;
        }

        showError(message);
    }, [showError, showSuccess]);

    const fetchGuardians = useCallback(async (search = '') => {
        const requestId = guardiansRequestRef.current + 1;
        guardiansRequestRef.current = requestId;

        try {
            setTableLoading(true);
            const data = await secretaryService.getGuardians(search.trim());

            if (!isMountedRef.current || guardiansRequestRef.current !== requestId) {
                return;
            }

            setGuardians(toList(data));
        } catch (error) {
            if (!isMountedRef.current || guardiansRequestRef.current !== requestId) {
                return;
            }

            console.error('Error fetching guardians:', error);
            setFeedback('error', 'Failed to load guardians.');
        } finally {
            if (isMountedRef.current && guardiansRequestRef.current === requestId) {
                setTableLoading(false);
            }
        }
    }, [setFeedback]);

    const fetchStudents = useCallback(async ({ force = false, silent = false } = {}) => {
        if (!schoolId) {
            if (isMountedRef.current) {
                setStudents([]);
                setStudentsLoaded(false);
            }
            return [];
        }

        if (studentsLoading && !force) {
            return students;
        }

        if (studentsLoaded && !force) {
            return students;
        }

        try {
            if (!silent) {
                setStudentsLoading(true);
            }

            const data = await secretaryService.getStudents({ school_id: schoolId });
            const nextStudents = toList(data);

            if (!isMountedRef.current) {
                return nextStudents;
            }

            setStudents(nextStudents);
            setStudentsLoaded(true);
            return nextStudents;
        } catch (error) {
            console.error('Error fetching students:', error);

            if (isMountedRef.current) {
                setStudentsLoaded(false);
                setFeedback('error', 'Failed to load students.');
            }

            return [];
        } finally {
            if (!silent && isMountedRef.current) {
                setStudentsLoading(false);
            }
        }
    }, [schoolId, setFeedback, students, studentsLoaded, studentsLoading]);

    const fetchGuardianLinks = useCallback(async (guardianId) => {
        if (!guardianId) {
            if (isMountedRef.current) {
                setGuardianLinks([]);
            }
            return [];
        }

        const requestId = linksRequestRef.current + 1;
        linksRequestRef.current = requestId;

        try {
            setLinksLoading(true);
            const data = await secretaryService.getGuardianLinks(guardianId);
            const links = toList(data);

            if (!isMountedRef.current || linksRequestRef.current !== requestId) {
                return links;
            }

            setGuardianLinks(links);
            return links;
        } catch (error) {
            if (!isMountedRef.current || linksRequestRef.current !== requestId) {
                return [];
            }

            console.error('Error fetching guardian links:', error);
            setGuardianLinks([]);
            setFeedback('error', 'Failed to load guardian links.');
            return [];
        } finally {
            if (isMountedRef.current && linksRequestRef.current === requestId) {
                setLinksLoading(false);
            }
        }
    }, [setFeedback]);

    useEffect(() => {
        fetchGuardians('');
    }, [fetchGuardians]);

    useEffect(() => {
        setStudents([]);
        setStudentsLoaded(false);
    }, [schoolId]);

    const filteredGuardians = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return guardians;
        }

        return guardians.filter((guardian) => {
            const name = (guardian.full_name || '').toLowerCase();
            const email = (guardian.email || '').toLowerCase();
            const phone = (guardian.phone_number || '').toLowerCase();
            return name.includes(search) || email.includes(search) || phone.includes(search);
        });
    }, [guardians, searchTerm]);

    const linkedStudentIds = useMemo(() => {
        const ids = new Set();

        guardianLinks.forEach((link) => {
            const id = getStudentIdFromLink(link);
            if (id !== null && id !== undefined) {
                ids.add(String(id));
            }
        });

        return ids;
    }, [guardianLinks]);

    const availableStudents = useMemo(() => {
        return students.filter((student) => {
            const id = getEntityId(student);
            return id !== null && id !== undefined && !linkedStudentIds.has(String(id));
        });
    }, [students, linkedStudentIds]);

    const statCards = useMemo(() => {
        const activeGuardians = guardians.filter((guardian) => guardian.is_active !== false).length;
        const studentValue = studentsLoaded ? students.length : '...';

        return [
            { title: 'Total Guardians', value: guardians.length, icon: Users, color: 'indigo' },
            { title: 'Active Guardians', value: activeGuardians, icon: Users, color: 'green' },
            { title: 'Students', value: studentValue, icon: Users, color: 'blue' },
        ];
    }, [guardians, students.length, studentsLoaded]);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    const handleSearchSubmit = useCallback(() => {
        fetchGuardians(searchTerm);
    }, [fetchGuardians, searchTerm]);

    const handleSearchKeyDown = useCallback((event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    const closeLinkModal = useCallback(() => {
        linksRequestRef.current += 1;
        setIsLinkModalOpen(false);
        setSelectedGuardian(null);
        setGuardianLinks([]);
        setLinkData({ ...DEFAULT_LINK_DATA });
        setLinksLoading(false);
    }, []);

    const closeCreateModal = useCallback(() => {
        setIsCreateModalOpen(false);
        setNewGuardian({ ...DEFAULT_GUARDIAN });
        setShowGuardianPassword(false);
    }, []);

    const handleOpenLinkModal = useCallback((guardian) => {
        const guardianId = getEntityId(guardian);

        if (!guardianId) {
            setFeedback('error', 'Selected guardian does not have a valid identifier.');
            return;
        }

        setSelectedGuardian({
            id: guardianId,
            name: guardian.full_name || `Guardian #${guardianId}`,
        });
        setLinkData({ ...DEFAULT_LINK_DATA });
        setGuardianLinks([]);
        setIsLinkModalOpen(true);

        void fetchGuardianLinks(guardianId);

        if (!studentsLoaded) {
            void fetchStudents({ silent: false });
        }
    }, [fetchGuardianLinks, fetchStudents, setFeedback, studentsLoaded]);

    const handleLinkFieldChange = useCallback((field, value) => {
        setLinkData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveLink = useCallback(async () => {
        const guardianId = selectedGuardian?.id;
        const studentId = String(linkData.student_id || '').trim();

        if (!guardianId || !studentId) {
            setFeedback('error', 'Please select a student before linking.');
            return;
        }

        if (linkedStudentIds.has(studentId)) {
            setFeedback('error', 'This student is already linked to the selected guardian.');
            return;
        }

        try {
            setLinkSubmitting(true);

            await secretaryService.linkGuardianToStudent(guardianId, studentId, {
                relationship_type: linkData.relationship_type,
                is_primary: linkData.is_primary,
                can_pickup: linkData.can_pickup,
            });

            if (!isMountedRef.current) {
                return;
            }

            setFeedback('success', 'Guardian linked to student successfully.');
            setLinkData({ ...DEFAULT_LINK_DATA });
            await Promise.all([
                fetchGuardianLinks(guardianId),
                fetchGuardians(searchTerm),
            ]);
        } catch (error) {
            console.error('Error linking guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to link guardian.'));
        } finally {
            if (isMountedRef.current) {
                setLinkSubmitting(false);
            }
        }
    }, [
        fetchGuardianLinks,
        fetchGuardians,
        linkData,
        linkedStudentIds,
        searchTerm,
        selectedGuardian,
        setFeedback,
    ]);

    const handleCreateGuardianField = useCallback((field, value) => {
        setNewGuardian((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleCreateGuardian = useCallback(async (event) => {
        event.preventDefault();

        const payload = {
            full_name: newGuardian.full_name.trim(),
            email: newGuardian.email.trim(),
            phone_number: newGuardian.phone_number.trim(),
            password: newGuardian.password,
            school_id: schoolId,
        };

        if (!payload.full_name || !payload.email || !payload.phone_number || !payload.password) {
            setFeedback('error', 'Please fill in all guardian fields.');
            return;
        }

        if (!payload.school_id) {
            setFeedback('error', 'Unable to determine the school for this guardian.');
            return;
        }

        try {
            setCreateSubmitting(true);

            await secretaryService.createGuardian(payload);

            if (!isMountedRef.current) {
                return;
            }

            closeCreateModal();
            setFeedback('success', 'Guardian created successfully.');
            await fetchGuardians(searchTerm);
        } catch (error) {
            console.error('Error creating guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to create guardian.'));
        } finally {
            if (isMountedRef.current) {
                setCreateSubmitting(false);
            }
        }
    }, [closeCreateModal, fetchGuardians, newGuardian, schoolId, searchTerm, setFeedback]);

    const canSubmitLink = Boolean(
        selectedGuardian?.id
        && linkData.student_id
        && !linkSubmitting
        && !studentsLoading
        && !linksLoading
        && availableStudents.length > 0
    );

    return (
        <div className="secretary-dashboard guardian-linking-page">
            <PageHeader
                title={t('secretary.guardians.title') || 'Guardian Management'}
                subtitle={t('secretary.guardians.subtitle') || 'Manage guardian accounts and student links'}
                action={(
                    <button className="btn-primary" type="button" onClick={() => setIsCreateModalOpen(true)}>
                        <UserPlus size={18} />
                        Add Guardian
                    </button>
                )}
            />

            <AlertBanner
                type={banner.type}
                message={banner.message}
                onDismiss={() => setBanner((prev) => ({ ...prev, message: '' }))}
            />

            <section className="sec-stats-grid">
                {statCards.map((card) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </section>

            <section className="management-card">
                <div className="sec-filter-bar">
                    <div className="sec-field sec-field--grow">
                        <label htmlFor="guardian-search" className="form-label">Search Guardians</label>
                        <div className="search-wrapper sec-search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                id="guardian-search"
                                type="text"
                                className="search-input"
                                placeholder={t('secretary.guardians.searchGuardians') || 'Search guardians by name, email, or phone...'}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                    </div>
                    <button className="btn-primary" type="button" onClick={handleSearchSubmit}>
                        <Search size={16} />
                        Search
                    </button>
                </div>

                <div className="sec-table-wrap">
                    {tableLoading ? (
                        <LoadingSpinner message="Loading guardians..." />
                    ) : (
                        <>
                            <div className="sec-table-scroll">
                                <table className="data-table sec-data-table">
                                    <thead>
                                        <tr>
                                            <th className="cell-id">ID</th>
                                            <th>{t('secretary.guardians.guardianName') || 'Guardian'}</th>
                                            <th>Contact</th>
                                            <th>{t('secretary.guardians.status') || 'Status'}</th>
                                            <th>{t('secretary.guardians.actions') || 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredGuardians.map((guardian, index) => {
                                            const guardianId = getEntityId(guardian);
                                            const rowKey = guardianId ?? `${guardian.email || guardian.full_name || 'guardian'}-${index}`;

                                            return (
                                                <tr key={rowKey}>
                                                    <td className="cell-id">{guardianId ? `#${guardianId}` : 'N/A'}</td>
                                                    <td>
                                                        <div className="sec-row-user">
                                                            <AvatarInitial name={guardian.full_name || 'Guardian'} color="purple" />
                                                            <span>{guardian.full_name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="sec-contact-stack">
                                                            {guardian.email ? (
                                                                <span><Mail size={14} /> {guardian.email}</span>
                                                            ) : null}
                                                            {guardian.phone_number ? (
                                                                <span><Phone size={14} /> {guardian.phone_number}</span>
                                                            ) : null}
                                                            {!guardian.email && !guardian.phone_number ? (
                                                                <span className="cell-muted">No contact details</span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <StatusBadge status={guardian.is_active !== false ? 'active' : 'inactive'} />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="sec-inline-action"
                                                            onClick={() => handleOpenLinkModal(guardian)}
                                                            title={t('secretary.guardians.manageLink') || 'Link to Student'}
                                                            disabled={!guardianId}
                                                        >
                                                            <LinkIcon size={14} />
                                                            Link
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {filteredGuardians.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState icon={Users} message="No guardians found." />
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={closeLinkModal}
                title={selectedGuardian ? `Link Student to: ${selectedGuardian.name}` : 'Link Guardian to Student'}
            >
                <form
                    className="sec-modal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveLink();
                    }}
                >
                    {linksLoading ? (
                        <LoadingSpinner message="Loading linked students..." />
                    ) : guardianLinks.length > 0 ? (
                        <div className="sec-link-panel">
                            <p>Existing Links</p>
                            <div className="sec-link-list">
                                {guardianLinks.map((link, index) => {
                                    const linkKey = link?.id ?? `${getStudentIdFromLink(link) || 'student'}-${index}`;
                                    return (
                                        <div className="sec-link-item" key={linkKey}>
                                            <span>{link.student_name || 'Student'}</span>
                                            <span className="sec-link-relation">{humanize(link.relationship_display || link.relationship_type)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="sec-subtle-text">This guardian has no linked students yet.</p>
                    )}

                    <div className="form-group">
                        <label className="form-label">Select Student *</label>
                        <select
                            className="form-select"
                            value={linkData.student_id}
                            onChange={(event) => handleLinkFieldChange('student_id', event.target.value)}
                            required
                            disabled={studentsLoading || linksLoading || linkSubmitting || availableStudents.length === 0}
                        >
                            <option value="">
                                {studentsLoading ? 'Loading students...' : 'Choose a student...'}
                            </option>
                            {availableStudents.map((student) => {
                                const studentId = getEntityId(student);

                                if (!studentId) {
                                    return null;
                                }

                                return (
                                    <option key={studentId} value={studentId}>
                                        {getStudentName(student)} (#{studentId})
                                    </option>
                                );
                            })}
                        </select>
                        {!studentsLoading && studentsLoaded && availableStudents.length === 0 ? (
                            <p className="sec-subtle-text">All available students are already linked to this guardian.</p>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Relationship Type *</label>
                        <select
                            className="form-select"
                            value={linkData.relationship_type}
                            onChange={(event) => handleLinkFieldChange('relationship_type', event.target.value)}
                        >
                            {RELATIONSHIP_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sec-checkbox-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={linkData.is_primary}
                                onChange={(event) => handleLinkFieldChange('is_primary', event.target.checked)}
                            />
                            Primary Guardian
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={linkData.can_pickup}
                                onChange={(event) => handleLinkFieldChange('can_pickup', event.target.checked)}
                            />
                            Can Pick Up Student
                        </label>
                    </div>

                    <div className="sec-modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeLinkModal}>
                            Close
                        </button>
                        <button type="submit" className="btn-primary" disabled={!canSubmitLink}>
                            {linkSubmitting ? 'Linking...' : 'Link Student'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                title="Create New Guardian"
            >
                <form className="sec-modal-form" onSubmit={handleCreateGuardian}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter guardian's full name"
                            value={newGuardian.full_name}
                            onChange={(event) => handleCreateGuardianField('full_name', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="guardian@example.com"
                            value={newGuardian.email}
                            onChange={(event) => handleCreateGuardianField('email', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input
                            type="tel"
                            className="form-input"
                            placeholder="+1 (555) 000-0000"
                            value={newGuardian.phone_number}
                            onChange={(event) => handleCreateGuardianField('phone_number', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <div className="sec-password-field">
                            <input
                                type={showGuardianPassword ? 'text' : 'password'}
                                className="form-input"
                                value={newGuardian.password}
                                onChange={(event) => handleCreateGuardianField('password', event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="sec-password-toggle"
                                onClick={() => setShowGuardianPassword((prev) => !prev)}
                                aria-label={showGuardianPassword ? 'Hide password' : 'Show password'}
                                title={showGuardianPassword ? 'Hide password' : 'Show password'}
                            >
                                {showGuardianPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="avatar-hint">Default: Guardian@123</p>
                    </div>

                    <div className="sec-modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeCreateModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={createSubmitting}>
                            {createSubmitting ? 'Creating...' : 'Create Guardian'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GuardianLinking;
