import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bell,
    Clock,
    Globe,
    Lock,
    Mail,
    Moon,
    Shield,
    Sun,
    User,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import settingsService from '../../services/settingsService';
import styles from './UnifiedSettingsPage.module.css';

const LEGACY_SECRETARY_SETTINGS_KEY = 'secretary.settings.preferences.v1';
const SETTINGS_MIGRATION_FLAG_KEY = 'settings_preferences_migrated_v1';

const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Gaza', label: 'Asia/Gaza' },
    { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem' },
    { value: 'Asia/Amman', label: 'Asia/Amman' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'America/New_York', label: 'America/New_York' },
];

const getDetectedTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
};

const asBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') {
        return value;
    }
    return fallback;
};

const normalizeServerSettings = (serverData, fallbackUser = null) => {
    if (!serverData || typeof serverData !== 'object') {
        return {
            full_name: fallbackUser?.full_name || fallbackUser?.displayName || fallbackUser?.name || '',
            email: fallbackUser?.email || '',
            timezone: getDetectedTimezone(),
            email_notifications: true,
            in_app_alerts: true,
            sms_notifications: false,
            enable_2fa: false,
        };
    }

    return {
        full_name: serverData.full_name || fallbackUser?.full_name || fallbackUser?.displayName || fallbackUser?.name || '',
        email: serverData.email || fallbackUser?.email || '',
        timezone: typeof serverData.timezone === 'string' && serverData.timezone.trim()
            ? serverData.timezone.trim()
            : getDetectedTimezone(),
        email_notifications: asBoolean(serverData.email_notifications, true),
        in_app_alerts: asBoolean(serverData.in_app_alerts, true),
        sms_notifications: asBoolean(serverData.sms_notifications, false),
        enable_2fa: asBoolean(serverData.enable_2fa, false),
    };
};

const UnifiedSettingsPage = ({ title = 'Settings', subtitle = 'Manage your account preferences.' }) => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [activeTab, setActiveTab] = useState('general');
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingState, setSavingState] = useState({
        profile: false,
        security: false,
        preferences: false,
        notifications: false,
    });

    const [profileForm, setProfileForm] = useState({
        full_name: user?.full_name || user?.displayName || user?.name || '',
        email: user?.email || '',
    });

    const [generalForm, setGeneralForm] = useState({
        timezone: getDetectedTimezone(),
    });

    const [notificationsForm, setNotificationsForm] = useState({
        emailNotifications: true,
        inAppAlerts: true,
        smsNotifications: false,
    });

    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        enable2FA: false,
    });

    const translate = useCallback((key, fallback) => {
        const translatedValue = t(key);
        return !translatedValue || translatedValue === key ? fallback : translatedValue;
    }, [t]);

    const updateSavingState = useCallback((field, value) => {
        setSavingState((prev) => {
            if (prev[field] === value) {
                return prev;
            }
            return { ...prev, [field]: value };
        });
    }, []);

    const syncCachedUser = useCallback((updates) => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const rawUser = window.localStorage.getItem('user');
            if (!rawUser) {
                return;
            }

            const parsedUser = JSON.parse(rawUser);
            const mergedUser = {
                ...parsedUser,
                ...updates,
                displayName: updates.full_name || parsedUser.displayName,
            };
            window.localStorage.setItem('user', JSON.stringify(mergedUser));
        } catch {
            // Ignore malformed user cache.
        }
    }, []);

    const applySettingsToState = useCallback((settings) => {
        setProfileForm({
            full_name: settings.full_name,
            email: settings.email,
        });

        setGeneralForm({
            timezone: settings.timezone,
        });

        setNotificationsForm({
            emailNotifications: settings.email_notifications,
            inAppAlerts: settings.in_app_alerts,
            smsNotifications: settings.sms_notifications,
        });

        setSecurityForm((prev) => ({
            ...prev,
            enable2FA: settings.enable_2fa,
        }));

        syncCachedUser({
            full_name: settings.full_name,
            email: settings.email,
            timezone: settings.timezone,
            email_notifications: settings.email_notifications,
            in_app_alerts: settings.in_app_alerts,
            sms_notifications: settings.sms_notifications,
            enable_2fa: settings.enable_2fa,
        });
    }, [syncCachedUser]);

    const migrateLegacySecretarySettings = useCallback(async (serverSettings) => {
        if (typeof window === 'undefined') {
            return null;
        }

        if (window.localStorage.getItem(SETTINGS_MIGRATION_FLAG_KEY) === 'true') {
            return null;
        }

        const rawLegacySettings = window.localStorage.getItem(LEGACY_SECRETARY_SETTINGS_KEY);
        if (!rawLegacySettings) {
            window.localStorage.setItem(SETTINGS_MIGRATION_FLAG_KEY, 'true');
            return null;
        }

        let parsedLegacy;
        try {
            parsedLegacy = JSON.parse(rawLegacySettings);
        } catch {
            window.localStorage.setItem(SETTINGS_MIGRATION_FLAG_KEY, 'true');
            return null;
        }

        const migrationPayload = {};
        const legacyTimezone = parsedLegacy?.timezone;
        const legacyNotifications = parsedLegacy?.notifications;

        if (
            typeof legacyTimezone === 'string' &&
            legacyTimezone.trim() &&
            legacyTimezone.trim() !== serverSettings.timezone
        ) {
            migrationPayload.timezone = legacyTimezone.trim();
        }

        if (
            legacyNotifications &&
            Object.prototype.hasOwnProperty.call(legacyNotifications, 'emailNotifications')
        ) {
            const value = Boolean(legacyNotifications.emailNotifications);
            if (value !== serverSettings.email_notifications) {
                migrationPayload.email_notifications = value;
            }
        }

        if (
            legacyNotifications &&
            Object.prototype.hasOwnProperty.call(legacyNotifications, 'inAppAlerts')
        ) {
            const value = Boolean(legacyNotifications.inAppAlerts);
            if (value !== serverSettings.in_app_alerts) {
                migrationPayload.in_app_alerts = value;
            }
        }

        if (
            legacyNotifications &&
            Object.prototype.hasOwnProperty.call(legacyNotifications, 'smsNotifications')
        ) {
            const value = Boolean(legacyNotifications.smsNotifications);
            if (value !== serverSettings.sms_notifications) {
                migrationPayload.sms_notifications = value;
            }
        }

        if (!Object.keys(migrationPayload).length) {
            window.localStorage.setItem(SETTINGS_MIGRATION_FLAG_KEY, 'true');
            return null;
        }

        try {
            await settingsService.updateProfileSettings(migrationPayload);
            window.localStorage.setItem(SETTINGS_MIGRATION_FLAG_KEY, 'true');
            return {
                ...serverSettings,
                ...migrationPayload,
            };
        } catch (error) {
            showError(`Failed to migrate legacy settings: ${error.message}`);
            return null;
        }
    }, [showError]);

    useEffect(() => {
        let cancelled = false;

        const loadSettings = async () => {
            setLoadingSettings(true);
            try {
                const response = await settingsService.getProfileSettings();
                const normalized = normalizeServerSettings(response, user);
                if (cancelled) {
                    return;
                }

                applySettingsToState(normalized);

                const migratedSettings = await migrateLegacySecretarySettings(normalized);
                if (!cancelled && migratedSettings) {
                    applySettingsToState(normalizeServerSettings(migratedSettings, user));
                }
            } catch (error) {
                if (!cancelled) {
                    showError(`Failed to load settings: ${error.message}`);
                    applySettingsToState(normalizeServerSettings(null, user));
                }
            } finally {
                if (!cancelled) {
                    setLoadingSettings(false);
                }
            }
        };

        loadSettings();

        return () => {
            cancelled = true;
        };
    }, [applySettingsToState, migrateLegacySecretarySettings, showError, user]);

    const tabs = useMemo(() => ([
        { id: 'general', label: translate('settings.general', 'General'), icon: Globe },
        { id: 'profile', label: translate('settings.profile', 'Profile'), icon: User },
        { id: 'security', label: translate('settings.security', 'Security'), icon: Shield },
        { id: 'notifications', label: translate('settings.notifications', 'Notifications'), icon: Bell },
    ]), [translate]);

    const timezoneOptions = useMemo(() => {
        if (!generalForm.timezone) {
            return TIMEZONE_OPTIONS;
        }

        const exists = TIMEZONE_OPTIONS.some((option) => option.value === generalForm.timezone);
        if (exists) {
            return TIMEZONE_OPTIONS;
        }

        return [{ value: generalForm.timezone, label: generalForm.timezone }, ...TIMEZONE_OPTIONS];
    }, [generalForm.timezone]);

    const handleSaveProfile = useCallback(async (event) => {
        event.preventDefault();
        const fullName = profileForm.full_name.trim();
        const email = profileForm.email.trim();

        if (!fullName) {
            showError('Full name is required.');
            return;
        }
        if (!email) {
            showError('Email address is required.');
            return;
        }

        updateSavingState('profile', true);
        try {
            await settingsService.updateProfileSettings({
                full_name: fullName,
                email,
            });
            setProfileForm({ full_name: fullName, email });
            syncCachedUser({ full_name: fullName, email });
            showSuccess('Profile updated successfully.');
        } catch (error) {
            showError(`Failed to update profile: ${error.message}`);
        } finally {
            updateSavingState('profile', false);
        }
    }, [profileForm, showError, showSuccess, syncCachedUser, updateSavingState]);

    const handleSaveGeneral = useCallback(async (event) => {
        event.preventDefault();
        updateSavingState('preferences', true);

        try {
            await settingsService.updateProfileSettings({
                timezone: generalForm.timezone,
            });
            syncCachedUser({ timezone: generalForm.timezone });
            showSuccess('General preferences saved successfully.');
        } catch (error) {
            showError(`Failed to save preferences: ${error.message}`);
        } finally {
            updateSavingState('preferences', false);
        }
    }, [generalForm.timezone, showError, showSuccess, syncCachedUser, updateSavingState]);

    const handleSaveNotifications = useCallback(async (event) => {
        event.preventDefault();
        updateSavingState('notifications', true);

        try {
            await settingsService.updateProfileSettings({
                email_notifications: notificationsForm.emailNotifications,
                in_app_alerts: notificationsForm.inAppAlerts,
                sms_notifications: notificationsForm.smsNotifications,
            });
            syncCachedUser({
                email_notifications: notificationsForm.emailNotifications,
                in_app_alerts: notificationsForm.inAppAlerts,
                sms_notifications: notificationsForm.smsNotifications,
            });
            showSuccess('Notification preferences saved successfully.');
        } catch (error) {
            showError(`Failed to save notifications: ${error.message}`);
        } finally {
            updateSavingState('notifications', false);
        }
    }, [notificationsForm, showError, showSuccess, syncCachedUser, updateSavingState]);

    const handleSaveSecurity = useCallback(async (event) => {
        event.preventDefault();

        const hasPasswordInput = Boolean(securityForm.newPassword || securityForm.confirmPassword || securityForm.currentPassword);

        if (hasPasswordInput) {
            if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
                showError('Please enter current, new, and confirmation passwords.');
                return;
            }

            if (securityForm.newPassword.length < 8) {
                showError('New password must be at least 8 characters.');
                return;
            }
            if (securityForm.newPassword !== securityForm.confirmPassword) {
                showError('New password and confirmation do not match.');
                return;
            }
        }

        const payload = {
            enable_2fa: securityForm.enable2FA,
        };

        if (hasPasswordInput) {
            payload.current_password = securityForm.currentPassword;
            payload.password = securityForm.newPassword;
        }

        updateSavingState('security', true);
        try {
            await settingsService.updateSecuritySettings(payload);
            syncCachedUser({ enable_2fa: securityForm.enable2FA });
            setSecurityForm((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));
            showSuccess('Security settings updated successfully.');
        } catch (error) {
            showError(`Failed to update security settings: ${error.message}`);
        } finally {
            updateSavingState('security', false);
        }
    }, [securityForm, showError, showSuccess, syncCachedUser, updateSavingState]);

    const renderGeneralTab = () => (
        <form className={styles.form} onSubmit={handleSaveGeneral}>
            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-language">
                    {translate('settings.language', 'Language')}
                </label>
                <div className={styles.control}>
                    <Globe className={styles.controlIcon} size={18} aria-hidden="true" />
                    <select
                        id="settings-language"
                        className={styles.select}
                        value={language}
                        onChange={(event) => changeLanguage(event.target.value)}
                    >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                    </select>
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <p className={styles.label}>{translate('settings.theme', 'Theme')}</p>
                <div className={styles.themeGrid}>
                    <label className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}>
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={theme === 'light'}
                            onChange={() => theme === 'dark' && toggleTheme()}
                        />
                        <Sun size={18} aria-hidden="true" />
                        <span>{translate('settings.lightMode', 'Light')}</span>
                    </label>
                    <label className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}>
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={theme === 'dark'}
                            onChange={() => theme === 'light' && toggleTheme()}
                        />
                        <Moon size={18} aria-hidden="true" />
                        <span>{translate('settings.darkMode', 'Dark')}</span>
                    </label>
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-timezone">
                    {translate('settings.timeZone', 'Time Zone')}
                </label>
                <div className={styles.control}>
                    <Clock className={styles.controlIcon} size={18} aria-hidden="true" />
                    <select
                        id="settings-timezone"
                        className={styles.select}
                        value={generalForm.timezone}
                        onChange={(event) => {
                            setGeneralForm((prev) => ({ ...prev, timezone: event.target.value }));
                        }}
                    >
                        {timezoneOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="primary" type="submit" disabled={savingState.preferences}>
                    {savingState.preferences ? 'Saving...' : translate('settings.saveChanges', 'Save Changes')}
                </Button>
            </div>
        </form>
    );

    const renderProfileTab = () => (
        <form className={styles.form} onSubmit={handleSaveProfile}>
            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-full-name">
                    {translate('settings.fullName', 'Full Name')}
                </label>
                <div className={styles.control}>
                    <User className={styles.controlIcon} size={18} aria-hidden="true" />
                    <input
                        id="settings-full-name"
                        className={styles.input}
                        type="text"
                        value={profileForm.full_name}
                        onChange={(event) => {
                            setProfileForm((prev) => ({ ...prev, full_name: event.target.value }));
                        }}
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-email">
                    {translate('settings.emailAddress', 'Email Address')}
                </label>
                <div className={styles.control}>
                    <Mail className={styles.controlIcon} size={18} aria-hidden="true" />
                    <input
                        id="settings-email"
                        className={styles.input}
                        type="email"
                        value={profileForm.email}
                        onChange={(event) => {
                            setProfileForm((prev) => ({ ...prev, email: event.target.value }));
                        }}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="primary" type="submit" disabled={savingState.profile}>
                    {savingState.profile ? 'Saving...' : translate('settings.updateProfile', 'Update Profile')}
                </Button>
            </div>
        </form>
    );

    const renderSecurityTab = () => (
        <form className={styles.form} onSubmit={handleSaveSecurity}>
            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-current-password">
                    {translate('settings.currentPassword', 'Current Password')}
                </label>
                <div className={styles.control}>
                    <Lock className={styles.controlIcon} size={18} aria-hidden="true" />
                    <input
                        id="settings-current-password"
                        className={styles.input}
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={(event) => {
                            setSecurityForm((prev) => ({ ...prev, currentPassword: event.target.value }));
                        }}
                        autoComplete="current-password"
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-new-password">
                    {translate('settings.newPassword', 'New Password')}
                </label>
                <div className={styles.control}>
                    <Lock className={styles.controlIcon} size={18} aria-hidden="true" />
                    <input
                        id="settings-new-password"
                        className={styles.input}
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(event) => {
                            setSecurityForm((prev) => ({ ...prev, newPassword: event.target.value }));
                        }}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="settings-confirm-password">
                    {translate('settings.confirmPassword', 'Confirm Password')}
                </label>
                <div className={styles.control}>
                    <Lock className={styles.controlIcon} size={18} aria-hidden="true" />
                    <input
                        id="settings-confirm-password"
                        className={styles.input}
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={(event) => {
                            setSecurityForm((prev) => ({ ...prev, confirmPassword: event.target.value }));
                        }}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <label className={styles.checkboxItem}>
                <input
                    type="checkbox"
                    checked={securityForm.enable2FA}
                    onChange={(event) => {
                        setSecurityForm((prev) => ({ ...prev, enable2FA: event.target.checked }));
                    }}
                />
                <div>
                    <p className={styles.checkboxTitle}>{translate('settings.enable2FA', 'Enable Two-Factor Authentication')}</p>
                    <p className={styles.checkboxHint}>Store preference for two-factor authentication.</p>
                </div>
            </label>

            <div className={styles.actions}>
                <Button variant="primary" type="submit" icon={Shield} disabled={savingState.security}>
                    {savingState.security ? 'Saving...' : translate('settings.updateSecurity', 'Update Security')}
                </Button>
            </div>
        </form>
    );

    const renderNotificationsTab = () => (
        <form className={styles.form} onSubmit={handleSaveNotifications}>
            <label className={styles.checkboxItem}>
                <input
                    type="checkbox"
                    checked={notificationsForm.emailNotifications}
                    onChange={(event) => {
                        setNotificationsForm((prev) => ({ ...prev, emailNotifications: event.target.checked }));
                    }}
                />
                <div>
                    <p className={styles.checkboxTitle}>{translate('settings.enableEmailNotifications', 'Email Notifications')}</p>
                    <p className={styles.checkboxHint}>Receive updates by email.</p>
                </div>
            </label>

            <label className={styles.checkboxItem}>
                <input
                    type="checkbox"
                    checked={notificationsForm.inAppAlerts}
                    onChange={(event) => {
                        setNotificationsForm((prev) => ({ ...prev, inAppAlerts: event.target.checked }));
                    }}
                />
                <div>
                    <p className={styles.checkboxTitle}>{translate('settings.enableInAppAlerts', 'In-App Alerts')}</p>
                    <p className={styles.checkboxHint}>Show badges and alert popups inside the app.</p>
                </div>
            </label>

            <label className={styles.checkboxItem}>
                <input
                    type="checkbox"
                    checked={notificationsForm.smsNotifications}
                    onChange={(event) => {
                        setNotificationsForm((prev) => ({ ...prev, smsNotifications: event.target.checked }));
                    }}
                />
                <div>
                    <p className={styles.checkboxTitle}>{translate('settings.enableSMSNotifications', 'SMS Notifications')}</p>
                    <p className={styles.checkboxHint}>Receive urgent alerts through SMS.</p>
                </div>
            </label>

            <div className={styles.actions}>
                <Button variant="primary" type="submit" icon={Bell} disabled={savingState.notifications}>
                    {savingState.notifications ? 'Saving...' : translate('settings.savePreferences', 'Save Preferences')}
                </Button>
            </div>
        </form>
    );

    const activeTabContent = (() => {
        if (activeTab === 'general') {
            return {
                title: translate('settings.generalSettings', 'General Settings'),
                subtitle: 'Language, theme, and timezone preferences.',
                content: renderGeneralTab(),
            };
        }

        if (activeTab === 'profile') {
            return {
                title: translate('settings.profileInformation', 'Profile Information'),
                subtitle: 'Update your personal profile information.',
                content: renderProfileTab(),
            };
        }

        if (activeTab === 'security') {
            return {
                title: translate('settings.securitySettings', 'Security Settings'),
                subtitle: 'Manage your password and security preference.',
                content: renderSecurityTab(),
            };
        }

        return {
            title: translate('settings.notificationPreferences', 'Notification Preferences'),
            subtitle: 'Control how alerts are delivered to you.',
            content: renderNotificationsTab(),
        };
    })();

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </header>

            <nav className={styles.tabs} aria-label="Settings sections">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={isActive}
                        >
                            <Icon size={16} aria-hidden="true" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            <article className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>{activeTabContent.title}</h2>
                    <p className={styles.panelSubtitle}>{activeTabContent.subtitle}</p>
                </div>

                {loadingSettings ? (
                    <div className={styles.loadingState}>Loading settings...</div>
                ) : (
                    activeTabContent.content
                )}
            </article>
        </section>
    );
};

export default UnifiedSettingsPage;
