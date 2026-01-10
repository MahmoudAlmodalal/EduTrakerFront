import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
    Settings, User, Shield, Bell,
    AppWindow, Globe, Moon, Sun,
    Lock, Mail, Smartphone
} from 'lucide-react';
import styles from './SchoolManagerSettings.module.css';

const SchoolManagerSettings = () => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: t('settings.general'), icon: AppWindow },
        { id: 'profile', label: t('settings.profile'), icon: User },
        { id: 'security', label: t('settings.security'), icon: Shield },
        { id: 'communication', label: t('nav.communication'), icon: Bell },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className={styles.settingsCard}>
                        <h2 className={styles.sectionTitle}>
                            <Globe className="text-secondary" />
                            {t('settings.generalSettings')}
                        </h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.language')}</label>
                            <select
                                className={styles.select}
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                            >
                                <option value="en">English (United States)</option>
                                <option value="ar">Arabic (العربية)</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.theme')}</label>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="radio"
                                        name="theme"
                                        className={styles.checkbox}
                                        checked={theme === 'light'}
                                        onChange={() => theme === 'dark' && toggleTheme()}
                                    />
                                    <Sun size={20} />
                                    {t('settings.lightMode')}
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="radio"
                                        name="theme"
                                        className={styles.checkbox}
                                        checked={theme === 'dark'}
                                        onChange={() => theme === 'light' && toggleTheme()}
                                    />
                                    <Moon size={20} />
                                    {t('settings.darkMode')}
                                </label>
                            </div>
                        </div>

                        <button className={styles.btnPrimary}>{t('settings.saveChanges')}</button>
                    </div>
                );

            case 'profile':
                return (
                    <div className={styles.settingsCard}>
                        <h2 className={styles.sectionTitle}>
                            <User className="text-secondary" />
                            {t('settings.profileInformation')}
                        </h2>

                        <div className={styles.avatarSection}>
                            <div className={styles.avatar}>SM</div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>School Manager</h3>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className={styles.btnSecondary}>{t('settings.changeAvatar')}</button>
                                    <button className={styles.btnSecondary} style={{ color: '#ef4444', borderColor: '#fee2e2' }}>{t('settings.remove')}</button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.fullName')}</label>
                            <input type="text" className={styles.input} defaultValue="Mahmoud Almodalal" />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.email')}</label>
                            <input type="email" className={styles.input} defaultValue="manager@school.edu" />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.phoneNumber')}</label>
                            <input type="tel" className={styles.input} defaultValue="+1 234 567 890" />
                        </div>

                        <button className={styles.btnPrimary}>{t('settings.updateProfile')}</button>
                    </div>
                );

            case 'security':
                return (
                    <div className={styles.settingsCard}>
                        <h2 className={styles.sectionTitle}>
                            <Shield className="text-secondary" />
                            {t('settings.securitySettings')}
                        </h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.currentPassword')}</label>
                            <input type="password" className={styles.input} placeholder="••••••••" />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.newPassword')}</label>
                            <input type="password" className={styles.input} placeholder={t('settings.enterNewPassword')} />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.confirmPassword')}</label>
                            <input type="password" className={styles.input} placeholder={t('settings.confirmNewPassword')} />
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--sm-border)' }}>
                            <label className={styles.label}>{t('settings.twoFactorAuth')}</label>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" className={styles.checkbox} defaultChecked />
                                <Lock size={20} />
                                {t('settings.enable2FA')}
                            </label>
                        </div>

                        <button className={styles.btnPrimary}>{t('settings.updateSecurity')}</button>
                    </div>
                );

            case 'communication':
                return (
                    <div className={styles.settingsCard}>
                        <h2 className={styles.sectionTitle}>
                            <Bell className="text-secondary" />
                            {t('settings.notificationPreferences')}
                        </h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.emailNotifications')}</label>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" className={styles.checkbox} defaultChecked />
                                    <Mail size={20} />
                                    {t('settings.newsAndUpdates')}
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" className={styles.checkbox} defaultChecked />
                                    <User size={20} />
                                    {t('settings.accountActivity')}
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('settings.pushNotifications')}</label>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" className={styles.checkbox} defaultChecked />
                                    <Smartphone size={20} />
                                    {t('settings.mobileAlerts')}
                                </label>
                            </div>
                        </div>

                        <button className={styles.btnPrimary}>{t('settings.savePreferences')}</button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{t('settings.title')}</h1>
            </div>

            <div className={styles.tabsContainer}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.contentArea}>
                {renderContent()}
            </div>
        </div>
    );
};

export default SchoolManagerSettings;
