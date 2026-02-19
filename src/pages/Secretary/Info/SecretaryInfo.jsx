import React, { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    Briefcase,
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    GraduationCap,
    HeartHandshake,
    Mail,
    UserCog,
    Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSecretaryData } from '../../../context/SecretaryDataContext';
import secretaryService from '../../../services/secretaryService';
import './SecretaryInfo.css';

const getInitials = (fullName = '') => {
    const chunks = fullName.trim().split(/\s+/).filter(Boolean);
    if (!chunks.length) return '?';
    return chunks.slice(0, 2).map((c) => c[0].toUpperCase()).join('');
};

const toLabel = (value = '') =>
    String(value).replace(/_/g, ' ').trim().replace(/\b\w/g, (l) => l.toUpperCase());

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

const SecretaryInfo = () => {
    const { user } = useAuth();
    const { dashboardData, loading: ctxLoading } = useSecretaryData();
    const [ctx, setCtx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('teachers');
    const [expandedClassrooms, setExpandedClassrooms] = useState({});
    const [expandedStudents, setExpandedStudents] = useState({});
    const [copiedStudentKey, setCopiedStudentKey] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        secretaryService.getSecretaryContext()
            .then((data) => {
                if (!cancelled) {
                    setCtx(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load');
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    const profile = {
        secretary_name: dashboardData?.profile?.full_name
            || dashboardData?.profile?.secretary_name
            || user?.full_name
            || user?.displayName
            || '',
        email: dashboardData?.profile?.email || user?.email || '',
        current_status: dashboardData?.profile?.current_status || 'active',
        school_name: dashboardData?.profile?.school_name || dashboardData?.school_name || '',
    };

    const school = ctx?.school || {};
    const classrooms = Array.isArray(ctx?.classrooms) ? ctx.classrooms : [];
    const teachers = Array.isArray(ctx?.teachers) ? ctx.teachers : [];
    const students = Array.isArray(ctx?.students) ? ctx.students : [];
    const managers = Array.isArray(ctx?.managers) ? ctx.managers : [];

    const tabPeople = activeTab === 'teachers' ? teachers : managers;

    const guardiansCount = useMemo(() => {
        const fromDashboard = Number(
            dashboardData?.total_guardians ?? dashboardData?.active_guardians
        );
        if (Number.isFinite(fromDashboard) && fromDashboard >= 0) {
            return fromDashboard;
        }

        const uniqueGuardians = new Set();
        students.forEach((student) => {
            const guardians = Array.isArray(student?.guardians) ? student.guardians : [];
            guardians.forEach((guardian) => {
                const emailKey = String(guardian?.email || '').trim().toLowerCase();
                if (emailKey) {
                    uniqueGuardians.add(`email:${emailKey}`);
                    return;
                }

                const nameKey = String(guardian?.full_name || '').trim().toLowerCase();
                const phoneKey = String(guardian?.phone_number || '').trim().toLowerCase();
                const fallbackKey = `${nameKey}|${phoneKey}`;
                if (fallbackKey !== '|') {
                    uniqueGuardians.add(`fallback:${fallbackKey}`);
                }
            });
        });

        return uniqueGuardians.size;
    }, [dashboardData?.active_guardians, dashboardData?.total_guardians, students]);

    const handleCopyStudentEmail = async (email, studentKey) => {
        if (!email) {
            return;
        }

        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const input = document.createElement('input');
            input.value = email;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }

        setCopiedStudentKey(studentKey);
        window.setTimeout(() => {
            setCopiedStudentKey((current) => (current === studentKey ? null : current));
        }, 1400);
    };

    const statItems = [
        { label: 'Students', value: students.length, icon: <GraduationCap size={18} />, color: 'indigo' },
        { label: 'Teachers', value: teachers.length, icon: <BookOpen size={18} />, color: 'teal' },
        { label: 'Guardians', value: guardiansCount, icon: <HeartHandshake size={18} />, color: 'rose' },
        { label: 'Classrooms', value: classrooms.length, icon: <Building2 size={18} />, color: 'purple' },
        { label: 'Managers', value: managers.length, icon: <UserCog size={18} />, color: 'amber' },
    ];

    return (
        <div className="teacher-page" style={{ gap: '1.2rem' }}>
            <div>
                <h1 className="teacher-title" style={{ marginBottom: '0.35rem' }}>My Info</h1>
                <p className="teacher-subtitle" style={{ margin: 0 }}>
                    School context, classrooms, and people overview.
                </p>
            </div>

            {!loading && !ctxLoading && !error && (
                <div className="sec-info-stats-grid">
                    {statItems.map((item) => (
                        <div
                            key={item.label}
                            className="sec-info-stat-card"
                        >
                            <div className="sec-info-stat-header">
                                <span className="sec-info-stat-title">{item.label}</span>
                                <div
                                    className="sec-info-stat-icon"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: `var(--color-${item.color}-100, #e0e7ff)`,
                                        color: `var(--color-${item.color}-600, #4f46e5)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.icon}
                                </div>
                            </div>
                            <div className="sec-info-stat-value">{item.value}</div>
                        </div>
                    ))}
                </div>
            )}

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
                        <section className="teacher-profile-section">
                            <div className="teacher-profile-hero">
                                <div className="teacher-profile-avatar">
                                    {getInitials(profile.secretary_name || '')}
                                </div>
                                <div className="teacher-profile-hero-main">
                                    <div className="teacher-profile-hero-top-row">
                                        <h4 className="teacher-profile-hero-name">
                                            {profile.secretary_name || 'Secretary'}
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

                                    <p className="teacher-profile-line teacher-profile-line-muted">
                                        <UserCog size={13} />
                                        <span>Secretary</span>
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="teacher-profile-divider" />

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
                                    iconNode={<Briefcase size={16} />}
                                    variantClass="teacher-leadership-icon-workstream"
                                />
                            </div>
                        </section>

                        <div className="teacher-profile-divider" />

                        <section className="teacher-profile-section">
                            <h5 className="teacher-profile-section-title">My Classrooms ({classrooms.length})</h5>

                            {classrooms.length === 0 ? (
                                <div className="teacher-profile-empty">
                                    <GraduationCap size={16} />
                                    <span>No classrooms assigned.</span>
                                </div>
                            ) : (
                                <div className="teacher-classrooms-list">
                                    {classrooms.map((cls, index) => {
                                        const classroomKey = cls.classroom_id || `${cls.classroom_name || 'classroom'}-${index}`;
                                        const isOpen = expandedClassrooms[classroomKey] ?? index === 0;
                                        const classroomStudents = Array.isArray(cls.students)
                                            ? cls.students
                                            : students.filter((student) => {
                                                if (student.classroom_id && cls.classroom_id) {
                                                    return student.classroom_id === cls.classroom_id;
                                                }
                                                return (
                                                    student.classroom_name === cls.classroom_name
                                                    && student.grade_name === cls.grade_name
                                                );
                                            });
                                        return (
                                            <div className="teacher-classroom-item" key={classroomKey}>
                                                <button
                                                    type="button"
                                                    className="teacher-classroom-toggle"
                                                    onClick={() => {
                                                        setExpandedClassrooms((previousState) => ({
                                                            ...previousState,
                                                            [classroomKey]: !isOpen
                                                        }));
                                                    }}
                                                >
                                                    <div className="teacher-classroom-toggle-left">
                                                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        <p className="teacher-classroom-title">
                                                            <span>{cls.grade_name || 'Grade'}</span>
                                                            <span className="teacher-profile-dot">&bull;</span>
                                                            <span className="teacher-classroom-name">{cls.classroom_name}</span>
                                                        </p>
                                                    </div>
                                                    <div className="teacher-classroom-tags">
                                                        {cls.academic_year && (
                                                            <span className="teacher-tag teacher-tag-grade">
                                                                {cls.academic_year}
                                                            </span>
                                                        )}
                                                        {typeof cls.student_count === 'number' && (
                                                            <span className="teacher-tag teacher-tag-count">
                                                                {cls.student_count} Students
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>

                                                {isOpen ? (
                                                    <div className="teacher-classroom-students-panel">
                                                        {classroomStudents.length === 0 ? (
                                                            <p className="teacher-classroom-empty">No active students enrolled.</p>
                                                        ) : (
                                                            classroomStudents.map((student, studentIndex) => {
                                                                const studentKey = `${student.email || student.full_name || 'student'}-${studentIndex}`;
                                                                const studentPanelKey = `${classroomKey}-${studentKey}`;
                                                                const isStudentOpen = Boolean(expandedStudents[studentPanelKey]);
                                                                const studentStatusClass = String(student.current_status || '').toLowerCase() === 'active'
                                                                    ? 'teacher-profile-employment-full-time'
                                                                    : 'teacher-profile-employment-substitute';
                                                                const guardians = Array.isArray(student.guardians) ? student.guardians : [];
                                                                return (
                                                                    <div className="teacher-student-block" key={studentKey}>
                                                                        <button
                                                                            type="button"
                                                                            className="teacher-student-row teacher-student-row-btn"
                                                                            onClick={() => {
                                                                                setExpandedStudents((previousState) => ({
                                                                                    ...previousState,
                                                                                    [studentPanelKey]: !isStudentOpen
                                                                                }));
                                                                            }}
                                                                        >
                                                                            <div className="teacher-student-main">
                                                                                <span className="teacher-student-avatar">
                                                                                    {getInitials(student.full_name)}
                                                                                </span>
                                                                                <div className="teacher-student-copy">
                                                                                    <p className="teacher-student-name">{student.full_name || 'Student'}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                                <span className="teacher-student-guardians-badge">
                                                                                    <Users size={12} />
                                                                                    {guardians.length} {guardians.length === 1 ? 'guardian' : 'guardians'}
                                                                                </span>
                                                                                <span className={`teacher-profile-employment-badge ${studentStatusClass}`}>
                                                                                    {toLabel(student.current_status || 'active')}
                                                                                </span>
                                                                                {isStudentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                            </div>
                                                                        </button>

                                                                        <div className="teacher-student-email-line">
                                                                            <p className="teacher-student-email" title={student.email || ''}>
                                                                                {student.email || 'No email'}
                                                                            </p>
                                                                            {student.email ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="teacher-email-copy-btn"
                                                                                    onClick={() => handleCopyStudentEmail(student.email, studentPanelKey)}
                                                                                >
                                                                                    {copiedStudentKey === studentPanelKey ? <Check size={12} /> : <Copy size={12} />}
                                                                                    {copiedStudentKey === studentPanelKey ? 'Copied' : 'Copy'}
                                                                                </button>
                                                                            ) : null}
                                                                        </div>

                                                                        {isStudentOpen && guardians.length === 0 ? (
                                                                            <p className="teacher-guardian-empty">No active guardians linked.</p>
                                                                        ) : null}
                                                                        {isStudentOpen && guardians.length > 0 ? (
                                                                            guardians.map((guardian, guardianIndex) => (
                                                                                <div
                                                                                    key={`${studentKey}-guardian-${guardian.email || guardianIndex}`}
                                                                                    className="teacher-guardian-row"
                                                                                >
                                                                                    <span className="teacher-guardian-icon">
                                                                                        <HeartHandshake size={12} />
                                                                                    </span>
                                                                                    <div className="teacher-guardian-copy">
                                                                                        <p className="teacher-guardian-name-row">
                                                                                            <span>
                                                                                                {guardian.full_name || 'Guardian'}
                                                                                                {guardian.relationship_type
                                                                                                    ? ` (${toLabel(guardian.relationship_type)})`
                                                                                                    : ''}
                                                                                            </span>
                                                                                            {guardian.is_primary ? (
                                                                                                <span className="teacher-guardian-primary">Primary</span>
                                                                                            ) : null}
                                                                                        </p>
                                                                                        <p className="teacher-guardian-meta">
                                                                                            {guardian.phone_number || 'No phone number'}
                                                                                            {guardian.email ? ` • ${guardian.email}` : ''}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <div className="teacher-profile-divider" />

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
                                    className={`teacher-people-tab ${activeTab === 'managers' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('managers')}
                                >
                                    <UserCog size={13} style={{ marginRight: 4 }} />
                                    Managers ({managers.length})
                                </button>
                            </div>

                            {tabPeople.length === 0 ? (
                                <div className="teacher-profile-empty teacher-profile-empty-people">
                                    <Users size={16} />
                                    <span>
                                        {activeTab === 'teachers' ? 'No teachers assigned.' : 'No managers assigned.'}
                                    </span>
                                </div>
                            ) : (
                                <div className="teacher-people-grid">
                                    {tabPeople.map((person, index) => {
                                        const personKey = `${person.email || person.full_name || 'person'}-${index}`;
                                        const isTeacher = activeTab === 'teachers';

                                        return (
                                            <div className="teacher-person-card" key={personKey}>
                                                <span className={`teacher-person-avatar ${
                                                    isTeacher
                                                        ? 'teacher-person-avatar-teacher'
                                                        : 'teacher-person-avatar-secretary'
                                                }`}>
                                                    {getInitials(person.full_name)}
                                                </span>
                                                <div className="teacher-person-copy">
                                                    <p className="teacher-person-name">{person.full_name || 'User'}</p>
                                                    <p className="teacher-person-role">
                                                        {isTeacher
                                                            ? (person.specialization || person.course_name || 'Teacher')
                                                            : toLabel(person.role || 'manager')}
                                                    </p>
                                                    <p className="teacher-person-email" title={person.email || ''}>
                                                        {person.email || 'No email'}
                                                    </p>
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

export default SecretaryInfo;
