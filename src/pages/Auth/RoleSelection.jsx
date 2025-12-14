import React from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldAlert,
    School,
    BookOpen,
    Briefcase,
    GraduationCap,
    Users,
    UserCheck
} from 'lucide-react';
import styles from './RoleSelection.module.css';

const RoleSelection = () => {
    const roles = [
        {
            id: 'education',
            title: 'Education',
            items: [
                { path: '/login/student', label: 'Student', icon: <GraduationCap />, desc: 'Access your courses and results' },
                { path: '/login/teacher', label: 'Teacher', icon: <BookOpen />, desc: 'Manage classes and grades' },
                { path: '/login/guardian', label: 'Guardian', icon: <Users />, desc: 'Monitor student progress' },
            ]
        },
        {
            id: 'administration',
            title: 'Administration',
            items: [
                { path: '/login/school-manager', label: 'School Manager', icon: <School />, desc: 'Manage school operations' },
                { path: '/login/secretary', label: 'Secretary', icon: <UserCheck />, desc: 'Admissions and records' },
                { path: '/login/workstream-manager', label: 'Workstream Mgr', icon: <Briefcase />, desc: 'Manage school network' },
                { path: '/login/super-admin', label: 'Super Admin', icon: <ShieldAlert />, desc: 'System configuration' },
            ]
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Welcome to EduTraker</h1>

                {roles.map((group) => (
                    <div key={group.id} style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            textAlign: 'left',
                            fontSize: '1.2rem',
                            color: '#6b7280',
                            marginBottom: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            paddingBottom: '0.5rem'
                        }}>
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
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelection;
