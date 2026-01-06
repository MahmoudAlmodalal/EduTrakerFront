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
            title: 'workstream login',
            items: [
                { path: '/login/workstream/1', label: 'workstream', icon: <GraduationCap size={28} />, desc: 'Access workstream for role (Student, guardian, teacher, secretary, school manager, workstream manager).' },
            ]
        },
        {
            id: 'administration',
            title: 'login portal',
            items: [
                { path: '/login/portal', label: 'administration', icon: <School size={28} />, desc: 'login to portal admin to manage workstreams and admin users.' },
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
