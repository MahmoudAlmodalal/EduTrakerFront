import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
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
    Camera
} from 'lucide-react';
import styles from './SystemSettings.module.css';
import Button from '../../components/ui/Button';

const SystemSettings = () => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const [activeTab, setActiveTab] = useState('general');

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
                                    <Globe size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <select
                                        className={styles.select}
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
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
                                        <Sun size={18} />
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
                                        <Moon size={18} />
                                        {t('settings.darkMode')}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.timeZone')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <select className={styles.select} style={{ paddingLeft: '40px' }}>
                                        <option>(GMT+02:00) Jerusalem</option>
                                        <option>(GMT+00:00) UTC</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary">
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {t('settings.save')}
                                </Button>
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

                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.minPasswordLength')}</label>
                                <input type="number" className={styles.input} defaultValue="8" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.sessionTimeout')} (minutes)</label>
                                <input type="number" className={styles.input} defaultValue="30" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxItem}>
                                    <input type="checkbox" defaultChecked />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{t('settings.enable2FA')}</span>
                                        <span className={styles.hint}>Require two-factor authentication for all administrators</span>
                                    </div>
                                </label>
                            </div>
                            <div className={styles.actions}>
                                <Button variant="primary">
                                    <Shield size={18} style={{ marginRight: '8px' }} />
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

                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.globalNotifications')}</label>
                                <div className={styles.checkboxGroup}>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" defaultChecked />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Mail size={16} />
                                            {t('settings.enableEmailNotifications')}
                                        </div>
                                    </label>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MessageSquare size={16} />
                                            {t('settings.enableSMSNotifications')}
                                        </div>
                                    </label>
                                    <label className={styles.checkboxItem}>
                                        <input type="checkbox" defaultChecked />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Bell size={16} />
                                            {t('settings.enableInAppAlerts')}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.systemAnnouncement')}</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder={t('settings.announcementPlaceholder')}
                                    rows="4"
                                ></textarea>
                                <p className={styles.hint}>{t('settings.announcementHint')}</p>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary">
                                    <Bell size={18} style={{ marginRight: '8px' }} />
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
                                <div className={styles.avatar}>SA</div>
                                <button className={styles.avatarEditBtn} style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
                                    <Camera size={16} />
                                </button>
                            </div>
                            <div className={styles.profileInfo}>
                                <Button variant="secondary" size="small">{t('settings.changeAvatar')}</Button>
                                <p className={styles.hint}>{t('settings.avatarHint')}</p>
                            </div>
                        </div>

                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.fullName')}</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <input type="text" className={styles.input} defaultValue="Super Admin" style={{ paddingLeft: '40px' }} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.emailAddress')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <input type="email" className={styles.input} defaultValue="admin@edutraker.com" style={{ paddingLeft: '40px' }} />
                                </div>
                            </div>
                            <div className={styles.divider}></div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('settings.currentPassword')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <input type="password" className={styles.input} placeholder={t('settings.currentPasswordPlaceholder')} style={{ paddingLeft: '40px' }} />
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="primary">
                                    <User size={18} style={{ marginRight: '8px' }} />
                                    {t('settings.updateProfile')}
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
            <header className={styles.header}>
                <h1 className={styles.title}>{t('settings.title')}</h1>
                <p className={styles.subtitle}>Manage global system preferences, security, and your personal account</p>
            </header>

            <nav className={styles.tabsContainer}>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTab : ''}`}
                >
                    <Settings size={18} />
                    {t('settings.general')}
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                >
                    <User size={18} />
                    {t('settings.profile')}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`${styles.tabButton} ${activeTab === 'security' ? styles.activeTab : ''}`}
                >
                    <Shield size={18} />
                    {t('settings.security')}
                </button>
                <button
                    onClick={() => setActiveTab('communication')}
                    className={`${styles.tabButton} ${activeTab === 'communication' ? styles.activeTab : ''}`}
                >
                    <Bell size={18} />
                    {t('nav.communication')}
                </button>
            </nav>

            <section className={styles.content}>
                {renderTabContent()}
            </section>
        </div>
    );
};

export default SystemSettings;

