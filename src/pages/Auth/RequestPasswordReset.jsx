import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, Mail, CheckCircle2 } from 'lucide-react';
import authService from '../../services/authService';
import styles from './Login.module.css'; // Reusing login styles

const RequestPasswordReset = () => {
    const { t } = useTheme();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetData, setResetData] = useState(null); // Store uid and token
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.requestPasswordReset(email);
            setResetData(response); // Store the response containing uid and token
            setSuccess(true);
        } catch (err) {
            console.error('Password reset request error:', err);
            setError(err.message || "Unable to process request. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        // Generate reset link if we have uid and token (development mode)
        const resetLink = resetData?.uid && resetData?.token
            ? `/password-reset/confirm?uid=${resetData.uid}&token=${resetData.token}`
            : null;

        return (
            <div className={styles.container}>
                <div className={styles.loginWrapper}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.logo}>
                                <div className={`${styles.logoIcon}`} style={{ background: 'var(--color-success, #10b981)' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <h2 className={styles.subtitle}>Check Your Email</h2>
                        </div>
                        <div className={styles.form}>
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                If an account exists with the email <strong>{email}</strong>, you will receive a password reset link shortly.
                            </p>

                            {resetLink && (
                                <div style={{
                                    background: 'var(--color-bg-body, #f8fafc)',
                                    padding: 'var(--spacing-4)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <p style={{
                                        fontSize: 'var(--font-size-sm)',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        🔧 Development Mode - Reset Link:
                                    </p>
                                    <Link
                                        to={resetLink}
                                        style={{
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-primary)',
                                            wordBreak: 'break-all',
                                            textDecoration: 'underline',
                                            display: 'block'
                                        }}
                                    >
                                        Click here to reset your password
                                    </Link>
                                </div>
                            )}

                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                {resetLink ? 'Click the link above to continue.' : 'Please check your inbox and spam folder.'}
                            </p>
                            <Link
                                to="/login/portal"
                                className={styles.backLink}
                                style={{ textAlign: 'center', display: 'block', marginTop: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}
                            >
                                ← Back to Login
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
                            <div className={styles.logoIcon}><Mail size={24} /></div>
                            <h1 className={styles.title}>EduTraker</h1>
                        </div>
                        <p className={styles.subtitle}>Reset Your Password</p>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <div className={styles.footer}>
                            <Link to="/login/portal" className={styles.backLink}>
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestPasswordReset;
