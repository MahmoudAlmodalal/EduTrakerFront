import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, AlertCircle } from 'lucide-react';
import authService from '../../services/authService';
import { api } from '../../utils/api';
import styles from './Login.module.css';

const Login = ({ role }) => {
    console.log('Login component rendered with role:', role);

    const { t } = useTheme();
    const { login } = useAuth();
    const { workstreamSlug } = useParams();
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
        if (!isPortalLogin && workstreamSlug) {
            setLoadingWorkstream(true);
            api.get(`/workstreams/${workstreamSlug}/info/`)
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
    }, [isPortalLogin, workstreamSlug]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        console.log('Login attempt started', { email, role, workstreamSlug });

        try {
            const data = await authService.login(
                { email, password },
                role,
                workstreamSlug
            );

            console.log('Login response received:', data);

            // Pass user data and tokens to the AuthContext
            login(data, role, workstreamSlug);

            console.log('Login context updated');
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
                                Workstream "{workstreamSlug}" does not exist or is inactive.
                            </div>
                            <a href="/" className={styles.backLink} style={{ textAlign: 'center', display: 'block', marginTop: '1rem' }}>
                                ← Back to Role Selection
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
        return workstreamName ? `${workstreamName} Login` : `Workstream ${workstreamSlug} Login`;
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

                        <div style={{ textAlign: 'right', marginBottom: 'var(--spacing-4)' }}>
                            <Link
                                to="/password-reset"
                                className={styles.backLink}
                                style={{ fontSize: 'var(--font-size-sm)' }}
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : t('auth.signInBtn')}
                        </Button>

                        <div className={styles.footer}>
                            <Link to="/" className={styles.backLink}>{t('auth.backToSelection')}</Link>
                            <span style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }}>•</span>
                            <Link
                                to={isPortalLogin ? "/register/portal" : `/register/workstream/${workstreamSlug}`}
                                className={styles.backLink}
                            >
                                Create Account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
