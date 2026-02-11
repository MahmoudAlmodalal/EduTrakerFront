import React, { useEffect, useMemo, useState } from 'react';
import {
    Globe,
    Moon,
    Sun,
    User,
    Mail,
    Lock,
    Bell,
    Shield,
    Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { api } from '../../utils/api';
import styles from '../../pages/SuperAdmin/SystemSettings.module.css';

const UnifiedSettingsPage = ({ title = 'Settings', subtitle = 'Manage your account preferences.' }) => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);

    const initialName = useMemo(
        () => user?.full_name || user?.displayName || user?.name || '',
        [user]
    );
    const initialEmail = useMemo(() => user?.email || '', [user]);

    const [profileData, setProfileData] = useState({
        full_name: initialName,
        email: initialEmail,
    });

    useEffect(() => {
        setProfileData({
            full_name: initialName,
            email: initialEmail,
        });
    }, [initialName, initialEmail]);

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        enable2FA: false,
    });

    const [notificationData, setNotificationData] = useState({
        emailNotifications: true,
        inAppAlerts: true,
        smsNotifications: false,
    });

    const tabs = [
        { id: 'general', label: t('settings.general') || 'General', icon: Globe },
        { id: 'profile', label: t('settings.profile') || 'Profile', icon: User },
        { id: 'security', label: t('settings.security') || 'Security', icon: Shield },
        { id: 'notifications', label: t('settings.notifications') || 'Notifications', icon: Bell },
    ];

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/profile/update/', {
                full_name: profileData.full_name,
                email: profileData.email,
            });
            showSuccess('Profile updated successfully.');
        } catch (error) {
            showError(`Failed to update profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSecurity = async (e) => {
        e.preventDefault();

        if (!securityData.newPassword) {
            showError('Please enter a new password.');
            return;
        }
        if (securityData.newPassword !== securityData.confirmPassword) {
            showError('New password and confirmation do not match.');
            return;
        }

        setSaving(true);
        try {
            await api.patch('/profile/update/', {
                password: securityData.newPassword,
            });
            showSuccess('Security settings updated successfully.');
            setSecurityData((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));
        } catch (error) {
            showError(`Failed to update security settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePreferences = (e) => {
        e.preventDefault();
        showSuccess('Preferences saved successfully.');
    };

    const handleSaveNotifications = (e) => {
        e.preventDefault();
        showSuccess('Notification preferences saved successfully.');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.general') || 'General Settings'}</h2>
                            <p className={styles.cardSubtitle}>System language, appearance, and time preferences.</p>
                        </div>
                        <form className={styles.form} onSubmit={handleSavePreferences}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.language') || 'Language'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <select
                                        className={styles.select}
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{ paddingLeft: '48px' }}
                                    >
                                        <option value="en">English</option>
                                        <option value="ar">Arabic</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.theme') || 'Theme'}</label>
                                <div className={styles.radioGroup}>
                                    <label className={`${styles.radioItem} ${theme === 'light' ? styles.activeRadio : ''}`}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="light"
                                            checked={theme === 'light'}
                                            onChange={() => theme === 'dark' && toggleTheme()}
                                        />
                                        <Sun size={18} />
                                        {t('settings.lightMode') || 'Light'}
                                    </label>
                                    <label className={`${styles.radioItem} ${theme === 'dark' ? styles.activeRadio : ''}`}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="dark"
                                            checked={theme === 'dark'}
                                            onChange={() => theme === 'light' && toggleTheme()}
                                        />
                                        <Moon size={18} />
                                        {t('settings.darkMode') || 'Dark'}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.timeZone') || 'Time Zone'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <select className={styles.select} style={{ paddingLeft: '48px' }}>
                                        <option>(GMT+02:00) Jerusalem</option>
                                        <option>(GMT+00:00) UTC</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary" type="submit">
                                    {t('settings.saveChanges') || 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                );

            case 'profile':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.profile') || 'Profile'}</h2>
                            <p className={styles.cardSubtitle}>Update your personal information.</p>
                        </div>
                        <form className={styles.form} onSubmit={handleSaveProfile}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.fullName') || 'Full Name'}</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <input
                                        type="text"
                                        className={styles.input}
                                        style={{ paddingLeft: '48px' }}
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData((prev) => ({ ...prev, full_name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.emailAddress') || 'Email Address'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <input
                                        type="email"
                                        className={styles.input}
                                        style={{ paddingLeft: '48px' }}
                                        value={profileData.email}
                                        onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : (t('settings.updateProfile') || 'Update Profile')}
                                </Button>
                            </div>
                        </form>
                    </div>
                );

            case 'security':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.security') || 'Security'}</h2>
                            <p className={styles.cardSubtitle}>Change your password and security controls.</p>
                        </div>
                        <form className={styles.form} onSubmit={handleSaveSecurity}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.currentPassword') || 'Current Password'}</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={securityData.currentPassword}
                                    onChange={(e) => setSecurityData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.newPassword') || 'New Password'}</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={securityData.newPassword}
                                    onChange={(e) => setSecurityData((prev) => ({ ...prev, newPassword: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.confirmPassword') || 'Confirm Password'}</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={securityData.confirmPassword}
                                    onChange={(e) => setSecurityData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input
                                        type="checkbox"
                                        checked={securityData.enable2FA}
                                        onChange={(e) => setSecurityData((prev) => ({ ...prev, enable2FA: e.target.checked }))}
                                    />
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                            {t('settings.enable2FA') || 'Enable Two-Factor Authentication'}
                                        </span>
                                        <p className={styles.hint}>Add an extra security step when signing in.</p>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.actions}>
                                <Button variant="primary" type="submit" icon={Shield} disabled={saving}>
                                    {saving ? 'Saving...' : (t('settings.updateSecurity') || 'Update Security')}
                                </Button>
                            </div>
                        </form>
                    </div>
                );

            case 'notifications':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.notifications') || 'Notifications'}</h2>
                            <p className={styles.cardSubtitle}>Control how alerts are delivered to you.</p>
                        </div>
                        <form className={styles.form} onSubmit={handleSaveNotifications}>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input
                                        type="checkbox"
                                        checked={notificationData.emailNotifications}
                                        onChange={(e) => setNotificationData((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
                                    />
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                            {t('settings.enableEmailNotifications') || 'Email Notifications'}
                                        </span>
                                        <p className={styles.hint}>Receive important updates by email.</p>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input
                                        type="checkbox"
                                        checked={notificationData.inAppAlerts}
                                        onChange={(e) => setNotificationData((prev) => ({ ...prev, inAppAlerts: e.target.checked }))}
                                    />
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                            {t('settings.enableInAppAlerts') || 'In-App Alerts'}
                                        </span>
                                        <p className={styles.hint}>Show notification badges and alert popups.</p>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input
                                        type="checkbox"
                                        checked={notificationData.smsNotifications}
                                        onChange={(e) => setNotificationData((prev) => ({ ...prev, smsNotifications: e.target.checked }))}
                                    />
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                            {t('settings.enableSMSNotifications') || 'SMS Notifications'}
                                        </span>
                                        <p className={styles.hint}>Receive urgent messages by SMS.</p>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.actions}>
                                <Button variant="primary" type="submit" icon={Bell}>
                                    {t('settings.savePreferences') || 'Save Preferences'}
                                </Button>
                            </div>
                        </form>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>

            <div className={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.content}>{renderContent()}</div>
        </div>
    );
};

export default UnifiedSettingsPage;
