import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, Mail, Lock } from 'lucide-react';
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

        let isValid = false;

        if (role) {
            if (email === currentRole.defaultEmail && password === role.toLowerCase()) {
                isValid = true;
            } else if (email === 'admin@edutraker.com' && password === 'admin') {
                isValid = true;
            }
        } else {
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
            <div className={styles.loginWrapper}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <GraduationCap size={24} />
                            </div>
                            <h1 className={styles.title}>EduTraker</h1>
                        </div>
                        <p className={styles.subtitle}>{displayTitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="email">{t('auth.email')}</label>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={currentRole?.defaultEmail || "name@company.com"}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="password">{t('auth.password')}</label>
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            style={{ marginTop: '0.5rem' }}
                        >
                            {t('auth.signInBtn')}
                        </Button>

                        <div className={styles.footer}>
                            <a href="/login" className={styles.backLink}>
                                {t('auth.backToSelection')}
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
