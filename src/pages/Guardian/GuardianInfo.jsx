import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    School,
    UserRound,
    GraduationCap,
    Users,
    Briefcase,
    Mail,
    Star,
    Loader2,
    AlertCircle
} from 'lucide-react';
import './Guardian.css';
import guardianService from '../../services/guardianService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    return [];
};

const GuardianInfo = () => {
    const { t } = useTheme();
    const { user } = useAuth();

    const {
        data: schoolInfo,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['guardian', 'school-info', user?.id],
        queryFn: ({ signal }) => guardianService.getSchoolInfo(user.id, { signal }),
        enabled: Boolean(user?.id)
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="guardian-info-page">
                <h1 className="guardian-page-title">{t('guardian.nav.info') || 'Info'}</h1>
                <div className="guardian-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-500" />
                        <div>{error.message || t('common.somethingWentWrong') || 'Failed to load school info.'}</div>
                    </div>
                    <button className="btn-primary" onClick={() => refetch()}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    const linkedStudents = normalizeList(schoolInfo?.linked_students);
    const teachers = normalizeList(schoolInfo?.teachers);
    const secretaries = normalizeList(schoolInfo?.secretaries);

    return (
        <div className="guardian-info-page">
            <h1 className="guardian-page-title">{t('guardian.nav.info') || 'Info'}</h1>

            <div className="guardian-info-grid guardian-info-grid-two">
                <section className="guardian-card guardian-info-card">
                    <div className="guardian-info-header">
                        <School size={18} />
                        <h3>School &amp; Workstream</h3>
                    </div>

                    <div className="guardian-info-row">
                        <span>School Name</span>
                        <strong>{schoolInfo?.school?.name || 'N/A'}</strong>
                    </div>
                    <div className="guardian-info-row">
                        <span>Workstream</span>
                        <strong>{schoolInfo?.workstream?.name || 'N/A'}</strong>
                    </div>
                </section>

                <section className="guardian-card guardian-info-card">
                    <div className="guardian-info-header">
                        <UserRound size={18} />
                        <h3>School Manager</h3>
                    </div>

                    <div className="guardian-info-row">
                        <span>Full Name</span>
                        <strong>{schoolInfo?.school_manager?.full_name || 'N/A'}</strong>
                    </div>
                    <div className="guardian-info-row">
                        <span>Email</span>
                        <strong>{schoolInfo?.school_manager?.email || 'N/A'}</strong>
                    </div>
                </section>
            </div>

            <section className="guardian-card guardian-info-card guardian-students-section">
                <div className="guardian-info-header">
                    <GraduationCap size={18} />
                    <h3>Linked Students ({linkedStudents.length})</h3>
                </div>

                <div className="guardian-students-grid">
                    {linkedStudents.map((student) => (
                        <article key={student.id} className="guardian-student-card">
                            <div className="guardian-student-card-header">
                                <h4>{student.full_name || 'N/A'}</h4>
                                {student.is_primary && (
                                    <span className="guardian-primary-badge">
                                        <Star size={12} />
                                        Primary
                                    </span>
                                )}
                            </div>
                            <div className="guardian-student-meta">
                                <span>Grade</span>
                                <strong>{student.grade || 'N/A'}</strong>
                            </div>
                            <div className="guardian-student-meta">
                                <span>Relationship</span>
                                <strong>{student.relationship_display || student.relationship_type || 'N/A'}</strong>
                            </div>
                        </article>
                    ))}
                    {linkedStudents.length === 0 && (
                        <div className="guardian-info-empty">No linked students found.</div>
                    )}
                </div>
            </section>

            <div className="guardian-info-grid guardian-info-grid-two">
                <section className="guardian-card guardian-info-card">
                    <div className="guardian-info-header">
                        <Users size={18} />
                        <h3>Teachers ({teachers.length})</h3>
                    </div>

                    <div className="guardian-contacts-list">
                        {teachers.map((teacher) => (
                            <div key={teacher.id} className="guardian-contact-item">
                                <div className="guardian-contact-name">{teacher.full_name || 'N/A'}</div>
                                <div className="guardian-contact-email">
                                    <Mail size={14} />
                                    <span>{teacher.email || 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                        {teachers.length === 0 && (
                            <div className="guardian-info-empty">No teachers found.</div>
                        )}
                    </div>
                </section>

                <section className="guardian-card guardian-info-card">
                    <div className="guardian-info-header">
                        <Briefcase size={18} />
                        <h3>Secretaries ({secretaries.length})</h3>
                    </div>

                    <div className="guardian-contacts-list">
                        {secretaries.map((secretary) => (
                            <div key={secretary.id} className="guardian-contact-item">
                                <div className="guardian-contact-name">{secretary.full_name || 'N/A'}</div>
                                <div className="guardian-contact-email">
                                    <Mail size={14} />
                                    <span>{secretary.email || 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                        {secretaries.length === 0 && (
                            <div className="guardian-info-empty">No secretaries found.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GuardianInfo;
