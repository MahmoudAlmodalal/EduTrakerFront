import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

const Login = ({ role }) => {
    const { t } = useTheme();
    const { login } = useAuth();
    const { workstreamId } = useParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Workstream info state
    const [workstreamName, setWorkstreamName] = useState(null);
    const [workstreamNotFound, setWorkstreamNotFound] = useState(false);
    const [loadingWorkstream, setLoadingWorkstream] = useState(false);

    // Determine if this is a portal or workstream login
    const isPortalLogin = role === 'PORTAL';

    // Fetch workstream info on mount (for workstream login)
    useEffect(() => {
        if (!isPortalLogin && workstreamId) {
            setLoadingWorkstream(true);
            fetch(`/api/workstreams/${workstreamId}/info/`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Not found');
                })
                .then(data => {
                    setWorkstreamName(data.name);
                    setWorkstreamNotFound(false);
                })
                .catch(() => {
                    setWorkstreamNotFound(true);
                    setWorkstreamName(null);
                })
                .finally(() => setLoadingWorkstream(false));
        }
    }, [isPortalLogin, workstreamId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Portal uses /api/portal/auth/login/, Workstream uses /api/workstream/:id/auth/login/
        const loginUrl = isPortalLogin
            ? '/api/portal/auth/login/'
            : `/api/workstream/${workstreamId}/auth/login/`;

        try {
            console.log('Attempting login to:', loginUrl);
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            console.log('Response Status:', response.status);
            const text = await response.text();

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.log('Response Body:', text);
                throw new Error(`Server returned invalid JSON (${response.status}). Check console for details.`);
            }

            if (response.ok) {
                // Pass user data and tokens to the AuthContext
                login({
                    ...data.user,
                    role: data.user.role || role,
                    accessToken: data.tokens.access,
                    refreshToken: data.tokens.refresh
                });
            } else {
                setError(data.detail || data.non_field_errors?.[0] || t('auth.error.invalid'));
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || "Unable to connect to the server. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    // Show error state if workstream not found
    if (workstreamNotFound) {
        return (
            <div className={styles.container}>
                <div className={styles.loginWrapper}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.logo}>
                                <div className={styles.logoIcon}><AlertCircle size={24} /></div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <p className={styles.subtitle} style={{ color: 'var(--color-error, #ef4444)' }}>
                                Workstream Not Found
                            </p>
                        </div>
                        <div className={styles.form}>
                            <div className={styles.error}>
                                Workstream with ID "{workstreamId}" does not exist or is inactive.
                            </div>
                            <a href="/login" className={styles.backLink} style={{ textAlign: 'center', display: 'block', marginTop: '1rem' }}>
                                ← Back to Portal Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Determine subtitle text
    const getSubtitle = () => {
        if (isPortalLogin) return 'Portal Login';
        if (loadingWorkstream) return 'Loading...';
        return workstreamName ? `${workstreamName} Login` : `Workstream ${workstreamId} Login`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}><GraduationCap size={24} /></div>
                            <h1 className={styles.title}>EduTraker</h1>
                        </div>
                        <p className={styles.subtitle}>
                            {getSubtitle()}
                        </p>
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
                                required
                            />
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : t('auth.signInBtn')}
                        </Button>

                        <div className={styles.footer}>
                            <a href="/login" className={styles.backLink}>{t('auth.backToSelection')}</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
