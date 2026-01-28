import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
    Settings,
    User,
    Shield,
    Bell,
    Globe,
    Moon,
    Sun,
    Clock,
    Mail,
    MessageSquare,
    Lock,
    Save,
    Camera,
    CheckCircle
} from 'lucide-react';
import styles from './SystemSettings.module.css';
import Button from '../../components/ui/Button';
import { api } from '../../utils/api';

const SystemSettings = () => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Security state
    const [securityData, setSecurityData] = useState({
        minPasswordLength: '8',
        sessionTimeout: '30',
        enable2FA: true
    });

    // Communication state
    const [commData, setCommData] = useState({
        emailNotifications: true,
        smsNotifications: false,
        inAppAlerts: true,
        systemAnnouncement: ''
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await api.get('/system-config/');
            const configData = data.results || data;
            setSettings(configData);

            // Map data to states
            configData.forEach(item => {
                if (item.config_key === 'min_password_length') setSecurityData(prev => ({ ...prev, minPasswordLength: item.config_value }));
                if (item.config_key === 'session_timeout') setSecurityData(prev => ({ ...prev, sessionTimeout: item.config_value }));
                if (item.config_key === 'enable_2fa') setSecurityData(prev => ({ ...prev, enable2FA: item.config_value === 'true' }));
                if (item.config_key === 'system_announcement') setCommData(prev => ({ ...prev, systemAnnouncement: item.config_value }));
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const saveSetting = async (key, value) => {
        const existing = settings.find(s => s.config_key === key);
        const payload = { config_key: key, config_value: value.toString() };

        try {
            if (existing) {
                await api.patch(`/system-config/${existing.id}/`, payload);
            } else {
                await api.post('/system-config/', payload);
            }
            return true;
        } catch (err) {
            console.error(`Error saving ${key}:`, err);
            return false;
        }
    };

    const handleSaveSecurity = async (e) => {
        e.preventDefault();
        const results = await Promise.all([
            saveSetting('min_password_length', securityData.minPasswordLength),
            saveSetting('session_timeout', securityData.sessionTimeout),
            saveSetting('enable_2fa', securityData.enable2FA)
        ]);
        if (results.every(r => r)) alert('Security settings updated');
        fetchSettings();
    };

    const handleSaveComm = async (e) => {
        e.preventDefault();
        const results = await Promise.all([
            saveSetting('system_announcement', commData.systemAnnouncement),
        ]);
        if (results.every(r => r)) alert('Communication settings updated');
        fetchSettings();
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.general')}</h2>
                            <p className={styles.cardSubtitle}>Configure global application settings and preferences</p>
                        </div>

                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.language')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <select
                                        className={styles.select}
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{ paddingLeft: '48px' }}
                                    >
                                        <option value="en">English (الإنجليزية)</option>
                                        <option value="ar">Arabic (العربية)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.theme')}</label>
                                <div className={styles.radioGroup}>
                                    <label className={`${styles.radioItem} ${theme === 'light' ? styles.activeRadio : ''}`}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="light"
                                            checked={theme === 'light'}
                                            onChange={() => theme === 'dark' && toggleTheme()}
                                        />
                                        <Sun size={20} />
                                        {t('settings.lightMode')}
                                    </label>
                                    <label className={`${styles.radioItem} ${theme === 'dark' ? styles.activeRadio : ''}`}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="dark"
                                            checked={theme === 'dark'}
                                            onChange={() => theme === 'light' && toggleTheme()}
                                        />
                                        <Moon size={20} />
                                        {t('settings.darkMode')}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.timeZone')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <select className={styles.select} style={{ paddingLeft: '48px' }}>
                                        <option>(GMT+02:00) Jerusalem</option>
                                        <option>(GMT+00:00) UTC</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                );
            case 'security':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.security')}</h2>
                            <p className={styles.cardSubtitle}>Manage system security policies and access controls</p>
                        </div>

                        <form className={styles.form} onSubmit={handleSaveSecurity}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.minPasswordLength')}</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={securityData.minPasswordLength}
                                    onChange={(e) => setSecurityData({ ...securityData, minPasswordLength: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.sessionTimeout')} (minutes)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={securityData.sessionTimeout}
                                    onChange={(e) => setSecurityData({ ...securityData, sessionTimeout: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input
                                        type="checkbox"
                                        checked={securityData.enable2FA}
                                        onChange={(e) => setSecurityData({ ...securityData, enable2FA: e.target.checked })}
                                    />
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>{t('settings.enable2FA')}</span>
                                        <p className={styles.hint}>Require two-factor authentication for all administrators</p>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.actions}>
                                <Button variant="primary" type="submit" icon={Shield}>
                                    {t('settings.updateSecurityPolicy')}
                                </Button>
                            </div>
                        </form>
                    </div>
                );
            case 'communication':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('nav.communication')}</h2>
                            <p className={styles.cardSubtitle}>Configure system-wide notifications and announcements</p>
                        </div>

                        <form className={styles.form} onSubmit={handleSaveComm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.globalNotifications')}</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" checked={commData.emailNotifications} onChange={(e) => setCommData({ ...commData, emailNotifications: e.target.checked })} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Mail size={18} />
                                            <span>{t('settings.enableEmailNotifications')}</span>
                                        </div>
                                    </label>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" checked={commData.smsNotifications} onChange={(e) => setCommData({ ...commData, smsNotifications: e.target.checked })} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <MessageSquare size={18} />
                                            <span>{t('settings.enableSMSNotifications')}</span>
                                        </div>
                                    </label>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" checked={commData.inAppAlerts} onChange={(e) => setCommData({ ...commData, inAppAlerts: e.target.checked })} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Bell size={18} />
                                            <span>{t('settings.enableInAppAlerts')}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.systemAnnouncement')}</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder={t('settings.announcementPlaceholder')}
                                    rows="5"
                                    value={commData.systemAnnouncement}
                                    onChange={(e) => setCommData({ ...commData, systemAnnouncement: e.target.value })}
                                ></textarea>
                                <p className={styles.hint}>{t('settings.announcementHint')}</p>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary" type="submit" icon={Bell}>
                                    {t('settings.saveAndBroadcast')}
                                </Button>
                            </div>
                        </form>
                    </div>
                );
            case 'profile':
                return (
                    <div className={styles.contentCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('settings.profile')}</h2>
                            <p className={styles.cardSubtitle}>Update your personal information and account security</p>
                        </div>

                        <div className={styles.profileSection}>
                            <div className={styles.avatarWrapper}>
                                <div className={styles.avatar}>{user?.full_name?.charAt(0) || 'A'}</div>
                                <button style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                                    <Camera size={18} />
                                </button>
                            </div>
                            <div className={styles.avatarInfo}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{user?.full_name}</h3>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{user?.role} &bull; {user?.email}</p>
                            </div>
                        </div>

                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.fullName')}</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <input type="text" className={styles.input} defaultValue={user?.full_name} style={{ paddingLeft: '48px' }} readOnly />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.emailAddress')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                                    <input type="email" className={styles.input} defaultValue={user?.email} style={{ paddingLeft: '48px' }} readOnly />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', background: 'var(--color-warning-light)', borderRadius: '14px', marginTop: '1rem' }}>
                                <Lock size={16} color="var(--color-warning-dark)" />
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-warning-dark)', fontWeight: 600 }}>Profile editing is restricted. Use User Management to update account details.</p>
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
            <header className={styles.header}>
                <h1 className={styles.title}>{t('settings.title')}</h1>
                <p className={styles.subtitle}>Manage global system preferences, security, and your personal account</p>
            </header>

            <nav className={styles.tabsContainer}>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTab : ''}`}
                >
                    <Settings size={20} />
                    {t('settings.general')}
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                >
                    <User size={20} />
                    {t('settings.profile')}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`${styles.tabButton} ${activeTab === 'security' ? styles.activeTab : ''}`}
                >
                    <Shield size={20} />
                    {t('settings.security')}
                </button>
                <button
                    onClick={() => setActiveTab('communication')}
                    className={`${styles.tabButton} ${activeTab === 'communication' ? styles.activeTab : ''}`}
                >
                    <Bell size={20} />
                    {t('nav.communication')}
                </button>
            </nav>

            <section className={styles.content}>
                {loading ? <div className={styles.emptyState}>Loading settings...</div> : renderTabContent()}
            </section>
        </div>
    );
};

export default SystemSettings;
