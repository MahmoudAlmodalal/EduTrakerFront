import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Login.module.css';

const Login = ({ role }) => {
    const { t } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const roleConfig = {
        'SUPER_ADMIN': { title: t('auth.role.superAdmin'), defaultEmail: 'admin@edutraker.com' },
        'WORKSTREAM_MANAGER': { title: t('auth.role.workstreamManager'), defaultEmail: 'workstream@edutraker.com' },
        'SCHOOL_MANAGER': { title: t('auth.role.schoolManager'), defaultEmail: 'manager@edutraker.com' },
        'SECRETARY': { title: t('auth.role.secretary'), defaultEmail: 'secretary@edutraker.com' },
        'TEACHER': { title: t('auth.role.teacher'), defaultEmail: 'teacher@edutraker.com' },
        'STUDENT': { title: t('auth.role.student'), defaultEmail: 'student@edutraker.com' },
        'GUARDIAN': { title: t('auth.role.guardian'), defaultEmail: 'guardian@edutraker.com' },
    };

    const currentRole = role ? roleConfig[role] : null;
    const displayTitle = currentRole ? currentRole.title : t('auth.signInTitle');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Mock Login Logic
        // For testing, we allow simple check. In real app, API would handle this.
        let isValid = false;

        if (role) {
            // Strict check for the demo using the default email for that role
            // OR generic admin backdoor
            if (email === currentRole.defaultEmail && password === role.toLowerCase()) {
                isValid = true;
            } else if (email === 'admin@edutraker.com' && password === 'admin') {
                // Backdoor for easier testing? Maybe restrict this.
                // For now let's stick to role credentials or existing admin
                isValid = true;
            }
        } else {
            // Fallback for generic login if accessed directly without role (shouldn't happen with new routing)
            if (email === 'admin@edutraker.com' && password === 'admin') {
                isValid = true;
            }
        }

        if (isValid) {
            login({
                name: currentRole?.title || 'User',
                role: role || 'SUPER_ADMIN',
                email
            });
        } else {
            setError(t('auth.error.invalid'));
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>EduTraker</h1>
                    <p className={styles.subtitle}>{displayTitle}</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">{t('auth.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={currentRole?.defaultEmail || "name@company.com"}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">{t('auth.password')}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button}>
                        {t('auth.signInBtn')}
                    </button>

                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <a href="/login" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>
                            {t('auth.backToSelection')}
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
