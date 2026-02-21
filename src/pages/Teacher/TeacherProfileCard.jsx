import React, { useEffect, useState } from 'react';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock3,
    HeartHandshake,
    Home,
    Mail,
    MapPin,
    Network,
    UserCog,
    UserRound,
    Users
} from 'lucide-react';
import { useTeacherSchoolContext } from '../../hooks/useTeacherQueries';

const COLLAPSE_STORAGE_KEY = 'teacher_profile_card_expanded';

const getInitials = (fullName = '') => {
    const chunks = fullName.trim().split(/\s+/).filter(Boolean);
    if (chunks.length === 0) {
        return '?';
    }

    return chunks.slice(0, 2).map((chunk) => chunk[0].toUpperCase()).join('');
};

const toLabel = (value = '') => value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getEmploymentStatusLabel = (status) => {
    if (!status) {
        return 'Not Assigned';
    }

    return toLabel(status);
};

const getEmploymentStatusClassName = (status) => {
    switch (status) {
    case 'full_time':
        return 'teacher-profile-employment-full-time';
    case 'part_time':
        return 'teacher-profile-employment-part-time';
    case 'contract':
        return 'teacher-profile-employment-contract';
    case 'substitute':
        return 'teacher-profile-employment-substitute';
    default:
        return 'teacher-profile-employment-substitute';
    }
};

const getClassroomKey = (classroom, index) => (
    `${classroom?.classroom_id ?? 'class'}-${classroom?.course_id ?? 'course'}-${index}`
);

const TeacherProfileCardSkeleton = () => (
    <div className="teacher-profile-card-body">
        <div className="profile-skeleton teacher-profile-skeleton-hero" />
        <div className="teacher-profile-skeleton-leadership">
            <div className="profile-skeleton teacher-profile-skeleton-leadership-card" />
            <div className="profile-skeleton teacher-profile-skeleton-leadership-card" />
        </div>
        <div className="profile-skeleton teacher-profile-skeleton-classroom" />
        <div className="profile-skeleton teacher-profile-skeleton-classroom" />
        <div className="profile-skeleton teacher-profile-skeleton-classroom" />
    </div>
);

const TeacherProfileCard = () => {
    const {
        data,
        isLoading,
        isError,
        error
    } = useTeacherSchoolContext();

    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        const persistedState = sessionStorage.getItem(COLLAPSE_STORAGE_KEY);
        return persistedState !== 'false';
    });

    const [activePeopleTab, setActivePeopleTab] = useState('colleagues');
    const [expandedClassrooms, setExpandedClassrooms] = useState({});

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        sessionStorage.setItem(COLLAPSE_STORAGE_KEY, String(isExpanded));
    }, [isExpanded]);

    const teacher = data?.teacher ?? {};
    const school = data?.school ?? {};
    const colleagues = Array.isArray(data?.colleagues) ? data.colleagues : [];
    const secretaries = Array.isArray(data?.secretaries) ? data.secretaries : [];
    const classrooms = Array.isArray(data?.classrooms) ? data.classrooms : [];
    const classroomKeys = classrooms.map((classroom, index) => getClassroomKey(classroom, index));

    const yearsOfExperience = (
        teacher?.years_of_experience === null || teacher?.years_of_experience === undefined
    )
        ? null
        : (
            Number.isNaN(Number(teacher.years_of_experience))
                ? null
                : Number(teacher.years_of_experience)
        );

    const people = activePeopleTab === 'colleagues' ? colleagues : secretaries;

    const renderLeadershipCard = ({
        roleLabel,
        person,
        iconNode,
        variantClass
    }) => {
        const isUnassigned = !person;

        return (
            <div className={`teacher-leadership-card ${isUnassigned ? 'teacher-leadership-card-muted' : ''}`}>
                <div className="teacher-leadership-role">{roleLabel}</div>
                <div className="teacher-leadership-content">
                    <span className={`teacher-leadership-icon ${variantClass} ${isUnassigned ? 'teacher-leadership-icon-muted' : ''}`}>
                        {iconNode}
                    </span>
                    <div className="teacher-leadership-copy">
                        {isUnassigned ? (
                            <p className="teacher-leadership-empty">Not assigned</p>
                        ) : (
                            <>
                                <p className="teacher-leadership-name">{person.full_name}</p>
                                <p className="teacher-leadership-email">{person.email}</p>
                                {person.workstream_name ? (
                                    <span className="teacher-leadership-workstream">Workstream: {person.workstream_name}</span>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="management-card teacher-profile-card">
            <div className="teacher-profile-card-header">
                <div>
                    <h3 className="teacher-profile-card-title">School Context</h3>
                    <p className="teacher-profile-card-subtitle">Read-only overview of your school ecosystem.</p>
                </div>
                <button
                    type="button"
                    className="teacher-profile-collapse-btn"
                    onClick={() => setIsExpanded((prev) => !prev)}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
            </div>

            {!isExpanded ? null : (
                <>
                    {isLoading ? <TeacherProfileCardSkeleton /> : null}

                    {!isLoading && isError ? (
                        <div className="teacher-profile-card-body">
                            <p className="teacher-profile-error">
                                {error?.message || 'Unable to load school context at the moment.'}
                            </p>
                        </div>
                    ) : null}

                    {!isLoading && !isError ? (
                        <div className="teacher-profile-card-body">
                            <section className="teacher-profile-section">
                                <div className="teacher-profile-hero">
                                    <div className="teacher-profile-avatar">{getInitials(teacher.full_name)}</div>

                                    <div className="teacher-profile-hero-main">
                                        <div className="teacher-profile-hero-top-row">
                                            <h4 className="teacher-profile-hero-name">{teacher.full_name || 'Teacher'}</h4>
                                            <div className="teacher-profile-hero-badges">
                                                <span
                                                    className={`teacher-profile-employment-badge ${getEmploymentStatusClassName(teacher.employment_status)}`}
                                                >
                                                    {getEmploymentStatusLabel(teacher.employment_status)}
                                                </span>
                                                <span className="teacher-profile-exp-badge">
                                                    <Clock3 size={12} />
                                                    {yearsOfExperience === null
                                                        ? 'Experience N/A'
                                                        : `${yearsOfExperience} yrs exp`}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="teacher-profile-line teacher-profile-line-muted">
                                            <Mail size={13} />
                                            <span>{teacher.email || 'No email'}</span>
                                        </p>

                                        <p className="teacher-profile-line teacher-profile-line-school">
                                            <Building2 size={14} />
                                            <span>{school.name || 'No school assigned'}</span>
                                        </p>

                                        <p className="teacher-profile-line teacher-profile-line-muted">
                                            <MapPin size={13} />
                                            <span>{teacher.office_location || 'Office not set'}</span>
                                            <span className="teacher-profile-dot">&bull;</span>
                                            <span>{teacher.specialization || 'Specialization not set'}</span>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="teacher-profile-divider" />

                            <section className="teacher-profile-section">
                                <h5 className="teacher-profile-section-title">School Leadership</h5>
                                <div className="teacher-leadership-grid">
                                    {renderLeadershipCard({
                                        roleLabel: 'School Manager',
                                        person: school.manager,
                                        iconNode: <UserCog size={16} />,
                                        variantClass: 'teacher-leadership-icon-manager'
                                    })}
                                    {renderLeadershipCard({
                                        roleLabel: 'Workstream Manager',
                                        person: school.workstream_manager,
                                        iconNode: <Network size={16} />,
                                        variantClass: 'teacher-leadership-icon-workstream'
                                    })}
                                </div>
                            </section>

                            <div className="teacher-profile-divider" />

                            <section className="teacher-profile-section">
                                <h5 className="teacher-profile-section-title">My Classrooms ({classrooms.length})</h5>

                                {classrooms.length === 0 ? (
                                    <div className="teacher-profile-empty">
                                        <Users size={16} />
                                        <span>No classrooms assigned.</span>
                                    </div>
                                ) : (
                                    <div className="teacher-classrooms-list">
                                        {classrooms.map((classroom, index) => {
                                            const classroomKey = classroomKeys[index];
                                            const isOpen = expandedClassrooms[classroomKey] ?? index === 0;
                                            const students = Array.isArray(classroom.students) ? classroom.students : [];

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
                                                                <span>{classroom.course_name || 'Course'}</span>
                                                                <span className="teacher-profile-dot">&bull;</span>
                                                                <span className="teacher-classroom-name">{classroom.classroom_name || 'Classroom'}</span>
                                                            </p>
                                                        </div>

                                                        <div className="teacher-classroom-tags">
                                                            {classroom.is_homeroom ? (
                                                                <span className="teacher-tag teacher-tag-homeroom">
                                                                    <Home size={12} />
                                                                    Homeroom
                                                                </span>
                                                            ) : null}
                                                            <span className="teacher-tag teacher-tag-students">
                                                                <Users size={12} />
                                                                {classroom.student_count ?? students.length} students
                                                            </span>
                                                            <span className="teacher-tag teacher-tag-grade">
                                                                {classroom.grade_level || 'Grade N/A'}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {isOpen ? (
                                                        <div className="teacher-classroom-students-panel">
                                                            {students.length === 0 ? (
                                                                <p className="teacher-classroom-empty">No active students enrolled.</p>
                                                            ) : (
                                                                students.map((student, studentIndex) => {
                                                                    const guardians = Array.isArray(student.guardians) ? student.guardians : [];

                                                                    return (
                                                                        <div
                                                                            key={`${classroomKey}-student-${student.student_id || student.email || studentIndex}`}
                                                                            className="teacher-student-block"
                                                                        >
                                                                            <div className="teacher-student-row">
                                                                                <div className="teacher-student-main">
                                                                                    <span className="teacher-student-avatar">
                                                                                        {getInitials(student.full_name)}
                                                                                    </span>
                                                                                    <div className="teacher-student-copy">
                                                                                        <p className="teacher-student-name">{student.full_name || 'Student'}</p>
                                                                                        <p className="teacher-student-email" title={student.email || ''}>
                                                                                            {student.email || 'No email'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <span className="teacher-student-guardians-badge">
                                                                                    <Users size={12} />
                                                                                    {guardians.length} {guardians.length === 1 ? 'guardian' : 'guardians'}
                                                                                </span>
                                                                            </div>

                                                                            {guardians.length === 0 ? (
                                                                                <p className="teacher-guardian-empty">No active guardians linked.</p>
                                                                            ) : (
                                                                                guardians.map((guardian, guardianIndex) => (
                                                                                    <div
                                                                                        key={`${classroomKey}-student-${studentIndex}-guardian-${guardian.email || guardianIndex}`}
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
                                                                            )}
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
                                <h5 className="teacher-profile-section-title">Colleagues &amp; Secretaries</h5>

                                <div className="teacher-people-tabs">
                                    <button
                                        type="button"
                                        className={`teacher-people-tab ${activePeopleTab === 'colleagues' ? 'active' : ''}`}
                                        onClick={() => setActivePeopleTab('colleagues')}
                                    >
                                        Teacher Mates ({colleagues.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`teacher-people-tab ${activePeopleTab === 'secretaries' ? 'active' : ''}`}
                                        onClick={() => setActivePeopleTab('secretaries')}
                                    >
                                        Secretaries ({secretaries.length})
                                    </button>
                                </div>

                                {people.length === 0 ? (
                                    <div className="teacher-profile-empty teacher-profile-empty-people">
                                        <UserRound size={16} />
                                        <span>
                                            {activePeopleTab === 'colleagues'
                                                ? 'No colleagues found.'
                                                : 'No secretaries found.'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="teacher-people-grid">
                                        {people.map((person, index) => {
                                            const isTeacher = activePeopleTab === 'colleagues';
                                            const personKey = `${person.email || person.full_name || 'person'}-${index}`;

                                            return (
                                                <div className="teacher-person-card" key={personKey}>
                                                    <span className={`teacher-person-avatar ${isTeacher ? 'teacher-person-avatar-teacher' : 'teacher-person-avatar-secretary'}`}>
                                                        {getInitials(person.full_name)}
                                                    </span>
                                                    <div className="teacher-person-copy">
                                                        <p className="teacher-person-name">{person.full_name || 'User'}</p>
                                                        <p className="teacher-person-role">
                                                            {isTeacher
                                                                ? (person.specialization || 'Teacher')
                                                                : 'Secretary'}
                                                        </p>
                                                        <p className="teacher-person-email" title={person.email || ''}>{person.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
};

export default TeacherProfileCard;
