import React from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldAlert,
    School,
    BookOpen,
    Briefcase,
    GraduationCap,
    Users,
    UserCheck,
    ArrowRight
} from 'lucide-react';
import styles from './RoleSelection.module.css';

const RoleSelection = () => {
    const roles = [
        {
            id: 'education',
            title: 'Education & Learning',
            items: [
                { path: '/login/student', label: 'Student', icon: <GraduationCap size={28} />, desc: 'Access your personalized learning portal, courses, and tracks.' },
                { path: '/login/teacher', label: 'Teacher', icon: <BookOpen size={28} />, desc: 'Manage your classes, assessments, and student performance.' },
                { path: '/login/guardian', label: 'Guardian', icon: <Users size={28} />, desc: 'Stay connected with your child\'s academic journey and alerts.' },
            ]
        },
        {
            id: 'administration',
            title: 'School Management',
            items: [
                { path: '/login/school-manager', label: 'School Manager', icon: <School size={28} />, desc: 'Oversee school operations, staff, and overall performance.' },
                { path: '/login/secretary', label: 'Secretary', icon: <UserCheck size={28} />, desc: 'Handle admissions, records, and student documentation.' },
                { path: '/login/workstream-manager', label: 'Workstream Mgr', icon: <Briefcase size={28} />, desc: 'Manage school networks, workstreams, and configurations.' },
                { path: '/login/super-admin', label: 'Super Admin', icon: <ShieldAlert size={28} />, desc: 'Global system settings, security, and infrastructure.' },
            ]
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>EduTraker</h1>
                    <p className={styles.subtitle}>Select your portal to continue</p>
                </header>

                {roles.map((group) => (
                    <section key={group.id} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            {group.title}
                        </h2>
                        <div className={styles.grid}>
                            {group.items.map((role) => (
                                <Link to={role.path} key={role.path} className={styles.roleCard}>
                                    <div className={styles.roleIcon}>{role.icon}</div>
                                    <span className={styles.roleName}>{role.label}</span>
                                    <p className={styles.roleDescription}>{role.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default RoleSelection;
