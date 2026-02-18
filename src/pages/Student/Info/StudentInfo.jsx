import React, { useEffect, useState } from 'react';
import {
    Building2,
    GraduationCap,
    HeartHandshake,
    Mail,
    Network,
    Phone,
    UserCog,
    Users,
    BookOpen,
} from 'lucide-react';
import { useStudentData } from '../../../context/StudentDataContext';
import studentService from '../../../services/studentService';

const getInitials = (fullName = '') => {
    const chunks = fullName.trim().split(/\s+/).filter(Boolean);
    if (!chunks.length) return '?';
    return chunks.slice(0, 2).map((c) => c[0].toUpperCase()).join('');
};

const toLabel = (value = '') =>
    value.replace(/_/g, ' ').trim().replace(/\b\w/g, (l) => l.toUpperCase());

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="teacher-profile-card-body">
        <div className="profile-skeleton teacher-profile-skeleton-hero" />
        <div className="teacher-profile-skeleton-leadership">
            <div className="profile-skeleton teacher-profile-skeleton-leadership-card" />
            <div className="profile-skeleton teacher-profile-skeleton-leadership-card" />
        </div>
        <div className="profile-skeleton teacher-profile-skeleton-classroom" />
        <div className="profile-skeleton teacher-profile-skeleton-classroom" />
    </div>
);

// ── Leadership card ──────────────────────────────────────────────────────────
const LeadershipCard = ({ roleLabel, person, iconNode, variantClass }) => {
    const empty = !person;
    return (
        <div className={`teacher-leadership-card ${empty ? 'teacher-leadership-card-muted' : ''}`}>
            <div className="teacher-leadership-role">{roleLabel}</div>
            <div className="teacher-leadership-content">
                <span className={`teacher-leadership-icon ${variantClass} ${empty ? 'teacher-leadership-icon-muted' : ''}`}>
                    {iconNode}
                </span>
                <div className="teacher-leadership-copy">
                    {empty ? (
                        <p className="teacher-leadership-empty">Not assigned</p>
                    ) : (
                        <>
                            <p className="teacher-leadership-name">{person.full_name}</p>
                            <p className="teacher-leadership-email">{person.email}</p>
                            {person.workstream_name && (
                                <span className="teacher-leadership-workstream">
                                    Workstream: {person.workstream_name}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
const StudentInfo = () => {
    const { dashboardData, loading: ctxLoading } = useStudentData();
    const [ctx, setCtx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('teachers');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        studentService.getStudentContext()
            .then((data) => { if (!cancelled) { setCtx(data); setLoading(false); } })
            .catch((err) => { if (!cancelled) { setError(err?.message || 'Failed to load'); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    const profile = dashboardData?.profile || {};
    const school = ctx?.school || {};
    const classroom = ctx?.classroom || profile.current_classroom || null;
    const teachers = Array.isArray(ctx?.teachers) ? ctx.teachers : [];
    const secretaries = Array.isArray(ctx?.secretaries) ? ctx.secretaries : [];
    const guardians = Array.isArray(ctx?.guardians) ? ctx.guardians : [];

    const tabPeople = activeTab === 'teachers' ? teachers
        : activeTab === 'secretaries' ? secretaries
        : guardians;

    return (
        <div className="teacher-page" style={{ gap: '1.2rem' }}>
            <div>
                <h1 className="teacher-title" style={{ marginBottom: '0.35rem' }}>My Info</h1>
                <p className="teacher-subtitle" style={{ margin: 0 }}>
                    School context, classroom, teachers, and guardian overview.
                </p>
            </div>

            <div className="management-card teacher-profile-card">
                <div className="teacher-profile-card-header">
                    <div>
                        <h3 className="teacher-profile-card-title">School Context</h3>
                        <p className="teacher-profile-card-subtitle">Read-only overview of your school ecosystem.</p>
                    </div>
                </div>

                {(loading || ctxLoading) ? <Skeleton /> : null}

                {!loading && !ctxLoading && error ? (
                    <div className="teacher-profile-card-body">
                        <p className="teacher-profile-error">{error}</p>
                    </div>
                ) : null}

                {!loading && !ctxLoading && !error ? (
                    <div className="teacher-profile-card-body">

                        {/* ── Hero ── */}
                        <section className="teacher-profile-section">
                            <div className="teacher-profile-hero">
                                <div className="teacher-profile-avatar">
                                    {getInitials(profile.student_name || '')}
                                </div>
                                <div className="teacher-profile-hero-main">
                                    <div className="teacher-profile-hero-top-row">
                                        <h4 className="teacher-profile-hero-name">
                                            {profile.student_name || 'Student'}
                                        </h4>
                                        <div className="teacher-profile-hero-badges">
                                            <span className="teacher-profile-employment-badge teacher-profile-employment-full-time">
                                                {profile.current_status
                                                    ? toLabel(profile.current_status)
                                                    : 'Active'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="teacher-profile-line teacher-profile-line-muted">
                                        <Mail size={13} />
                                        <span>{profile.email || 'No email'}</span>
                                    </p>

                                    <p className="teacher-profile-line teacher-profile-line-school">
                                        <Building2 size={14} />
                                        <span>{school.name || profile.school_name || 'No school assigned'}</span>
                                    </p>

                                    {classroom && (
                                        <p className="teacher-profile-line teacher-profile-line-muted">
                                            <GraduationCap size={13} />
                                            <span>
                                                {classroom.classroom_name}
                                                {classroom.grade_name ? ` • ${classroom.grade_name}` : ''}
                                                {classroom.academic_year ? ` • ${classroom.academic_year}` : ''}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <div className="teacher-profile-divider" />

                        {/* ── School Leadership ── */}
                        <section className="teacher-profile-section">
                            <h5 className="teacher-profile-section-title">School Leadership</h5>
                            <div className="teacher-leadership-grid">
                                <LeadershipCard
                                    roleLabel="School Manager"
                                    person={school.manager}
                                    iconNode={<UserCog size={16} />}
                                    variantClass="teacher-leadership-icon-manager"
                                />
                                <LeadershipCard
                                    roleLabel="Workstream Manager"
                                    person={school.workstream_manager}
                                    iconNode={<Network size={16} />}
                                    variantClass="teacher-leadership-icon-workstream"
                                />
                            </div>
                        </section>

                        <div className="teacher-profile-divider" />

                        {/* ── Classroom ── */}
                        {classroom && (
                            <>
                                <section className="teacher-profile-section">
                                    <h5 className="teacher-profile-section-title">My Classroom</h5>
                                    <div className="teacher-classrooms-list">
                                        <div className="teacher-classroom-item">
                                            <div className="teacher-classroom-toggle" style={{ cursor: 'default' }}>
                                                <div className="teacher-classroom-toggle-left">
                                                    <p className="teacher-classroom-title">
                                                        <span>{classroom.grade_name || 'Grade'}</span>
                                                        <span className="teacher-profile-dot">&bull;</span>
                                                        <span className="teacher-classroom-name">
                                                            {classroom.classroom_name}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="teacher-classroom-tags">
                                                    {classroom.academic_year && (
                                                        <span className="teacher-tag teacher-tag-grade">
                                                            {classroom.academic_year}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="teacher-profile-divider" />
                            </>
                        )}

                        {/* ── Tabs: Teachers / Secretaries / Guardians ── */}
                        <section className="teacher-profile-section">
                            <h5 className="teacher-profile-section-title">People</h5>

                            <div className="teacher-people-tabs">
                                <button
                                    type="button"
                                    className={`teacher-people-tab ${activeTab === 'teachers' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('teachers')}
                                >
                                    <BookOpen size={13} style={{ marginRight: 4 }} />
                                    Teachers ({teachers.length})
                                </button>
                                <button
                                    type="button"
                                    className={`teacher-people-tab ${activeTab === 'secretaries' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('secretaries')}
                                >
                                    Secretaries ({secretaries.length})
                                </button>
                                <button
                                    type="button"
                                    className={`teacher-people-tab ${activeTab === 'guardians' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('guardians')}
                                >
                                    <HeartHandshake size={13} style={{ marginRight: 4 }} />
                                    Guardians ({guardians.length})
                                </button>
                            </div>

                            {tabPeople.length === 0 ? (
                                <div className="teacher-profile-empty teacher-profile-empty-people">
                                    <Users size={16} />
                                    <span>
                                        {activeTab === 'teachers' ? 'No teachers found.'
                                            : activeTab === 'secretaries' ? 'No secretaries found.'
                                            : 'No guardians linked.'}
                                    </span>
                                </div>
                            ) : (
                                <div className="teacher-people-grid">
                                    {tabPeople.map((person, i) => {
                                        const key = `${person.email || person.full_name || 'p'}-${i}`;
                                        const isGuardian = activeTab === 'guardians';
                                        const isTeacher = activeTab === 'teachers';
                                        return (
                                            <div className="teacher-person-card" key={key}>
                                                <span className={`teacher-person-avatar ${
                                                    isTeacher ? 'teacher-person-avatar-teacher'
                                                    : isGuardian ? 'teacher-person-avatar-secretary'
                                                    : 'teacher-person-avatar-secretary'
                                                }`}>
                                                    {getInitials(person.full_name)}
                                                </span>
                                                <div className="teacher-person-copy">
                                                    <p className="teacher-person-name">{person.full_name || 'User'}</p>
                                                    <p className="teacher-person-role">
                                                        {isTeacher
                                                            ? (person.specialization || person.course_name || 'Teacher')
                                                            : isGuardian
                                                            ? toLabel(person.relationship_type || 'Guardian')
                                                            : 'Secretary'}
                                                        {isGuardian && person.is_primary && (
                                                            <span className="teacher-guardian-primary" style={{ marginLeft: 6 }}>
                                                                Primary
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="teacher-person-email" title={person.email || ''}>
                                                        {person.email || 'No email'}
                                                    </p>
                                                    {isGuardian && person.phone_number && (
                                                        <p className="teacher-person-email" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Phone size={11} />
                                                            {person.phone_number}
                                                        </p>
                                                    )}
                                                    {isTeacher && person.course_name && (
                                                        <p className="teacher-person-email" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <BookOpen size={11} />
                                                            {person.course_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default StudentInfo;
