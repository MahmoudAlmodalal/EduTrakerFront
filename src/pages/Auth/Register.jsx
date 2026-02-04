import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import authService from '../../services/authService';
import styles from './Login.module.css'; // Reusing login styles

const Register = ({ role }) => {
    const { t } = useTheme();
    const { workstreamSlug } = useParams();
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        password: '',
        password_confirm: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isPortalRegister = role === 'PORTAL';

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            await authService.register(formData, role, workstreamSlug);
            setSuccess(true);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || "Unable to complete registration. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.loginWrapper}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.logo}>
                                <div className={`${styles.logoIcon} ${styles.successIcon}`} style={{ background: 'var(--color-success, #10b981)' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <h2 className={styles.subtitle}>Registration Successful!</h2>
                        </div>
                        <div className={styles.form}>
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                {isPortalRegister
                                    ? "Your account has been created and is pending approval by an administrator."
                                    : "Your account has been created. You can now log in to your workstream."}
                            </p>
                            <Link
                                to={isPortalRegister ? "/login/portal" : `/login/workstream/${workstreamSlug}`}
                                className={styles.backLink}
                                style={{ textAlign: 'center', display: 'block', marginTop: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}
                            >
                                Proceed to Login →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            {isPortalRegister ? 'Portal Registration' : `Workstream Registration`}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="full_name">Full Name</label>
                            <input
                                id="full_name"
                                type="text"
                                className={styles.input}
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="password_confirm">Confirm Password</label>
                            <input
                                id="password_confirm"
                                type="password"
                                className={styles.input}
                                value={formData.password_confirm}
                                onChange={handleChange}
                                placeholder="Repeat password"
                                required
                            />
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Register Now'}
                        </Button>

                        <div className={styles.footer}>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                                Already have an account?{' '}
                                <Link
                                    to={isPortalRegister ? "/login/portal" : `/login/workstream/${workstreamSlug}`}
                                    className={styles.backLink}
                                    style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                                >
                                    Log In
                                </Link>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
