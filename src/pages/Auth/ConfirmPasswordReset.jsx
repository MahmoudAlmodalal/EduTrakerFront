import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { GraduationCap, Lock, CheckCircle2 } from 'lucide-react';
import authService from '../../services/authService';
import styles from './Login.module.css'; // Reusing login styles

const ConfirmPasswordReset = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.new_password !== formData.confirm_password) {
            setError('Passwords do not match.');
            return;
        }

        if (!uid || !token) {
            setError('Invalid or missing reset link. Please request a new password reset.');
            return;
        }

        setIsLoading(true);

        try {
            await authService.confirmPasswordReset({
                uid,
                token,
                new_password: formData.new_password,
                confirm_password: formData.confirm_password
            });
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login/portal');
            }, 3000);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || "Unable to reset password. The link may be expired or invalid.");
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
                                <div className={`${styles.logoIcon}`} style={{ background: 'var(--color-success, #10b981)' }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <h1 className={styles.title}>EduTraker</h1>
                            </div>
                            <h2 className={styles.subtitle}>Password Reset Successful!</h2>
                        </div>
                        <div className={styles.form}>
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                Your password has been reset successfully. You can now log in with your new password.
                            </p>
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                Redirecting to login page...
                            </p>
                            <Link
                                to="/login/portal"
                                className={styles.backLink}
                                style={{ textAlign: 'center', display: 'block', marginTop: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}
                            >
                                Go to Login →
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
                            <div className={styles.logoIcon}><Lock size={24} /></div>
                            <h1 className={styles.title}>EduTraker</h1>
                        </div>
                        <p className={styles.subtitle}>Set New Password</p>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="new_password">New Password</label>
                            <input
                                id="new_password"
                                type="password"
                                className={styles.input}
                                value={formData.new_password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="confirm_password">Confirm New Password</label>
                            <input
                                id="confirm_password"
                                type="password"
                                className={styles.input}
                                value={formData.confirm_password}
                                onChange={handleChange}
                                placeholder="Repeat password"
                                required
                            />
                        </div>

                        <Button type="submit" variant="primary" size="large" disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default ConfirmPasswordReset;
