import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './Dashboard.module.css'; // Reusing dashboard styles
import Button from '../../components/UI/Button';

const SystemSettings = () => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const [activeTab, setActiveTab] = useState('general');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className={styles.chartCard} style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                        <h2 className={styles.cardTitle} style={{ color: 'var(--color-text-main)' }}>{t('settings.general')}</h2>
                        <form className={styles.form} style={{ maxWidth: '600px' }}>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.language')}</label>
                                <select
                                    value={language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-body)',
                                        color: 'var(--color-text-main)'
                                    }}
                                >
                                    <option value="en">English (الإنجليزية)</option>
                                    <option value="ar">Arabic (العربية)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.theme')}</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="light"
                                            checked={theme === 'light'}
                                            onChange={() => theme === 'dark' && toggleTheme()}
                                        />
                                        {t('settings.lightMode')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="theme"
                                            value="dark"
                                            checked={theme === 'dark'}
                                            onChange={() => theme === 'light' && toggleTheme()}
                                        />
                                        {t('settings.darkMode')}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.timeZone')}</label>
                                <select style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-body)',
                                    color: 'var(--color-text-main)'
                                }}>
                                    <option>(GMT+02:00) Jerusalem</option>
                                    <option>(GMT+00:00) UTC</option>
                                </select>
                            </div>
                            <Button variant="primary">{t('settings.save')}</Button>
                        </form>
                    </div>
                );
            case 'security':
                return (
                    <div className={styles.chartCard} style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                        <h2 className={styles.cardTitle} style={{ color: 'var(--color-text-main)' }}>{t('settings.security')}</h2>
                        <form className={styles.form} style={{ maxWidth: '600px' }}>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.minPasswordLength')}</label>
                                <input type="number" defaultValue="8" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)' }} />
                            </div>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.sessionTimeout')}</label>
                                <input type="number" defaultValue="30" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)' }} />
                            </div>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                    <input type="checkbox" defaultChecked /> {t('settings.enable2FA')}
                                </label>
                            </div>
                            <Button variant="primary">{t('settings.updateSecurityPolicy')}</Button>
                        </form>
                    </div>
                );
            case 'communication':
                return (
                    <div className={styles.chartCard} style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                        <h2 className={styles.cardTitle} style={{ color: 'var(--color-text-main)' }}>{t('nav.communication')}</h2>
                        <form className={styles.form} style={{ maxWidth: '600px' }}>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{t('settings.globalNotifications')}</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" defaultChecked /> {t('settings.enableEmailNotifications')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" /> {t('settings.enableSMSNotifications')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" defaultChecked /> {t('settings.enableInAppAlerts')}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginBottom: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{t('settings.systemAnnouncement')}</label>
                                <textarea
                                    placeholder={t('settings.announcementPlaceholder')}
                                    rows="4"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)', resize: 'vertical' }}
                                ></textarea>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{t('settings.announcementHint')}</p>
                            </div>

                            <Button variant="primary">{t('settings.saveAndBroadcast')}</Button>
                        </form>
                    </div>
                );
            case 'profile':
                return (
                    <div className={styles.chartCard} style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                        <h2 className={styles.cardTitle} style={{ color: 'var(--color-text-main)' }}>{t('settings.profile')}</h2>
                        <form className={styles.form} style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-body)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                    SA
                                </div>
                                <div>
                                    <Button variant="secondary" size="small">{t('settings.changeAvatar')}</Button>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{t('settings.avatarHint')}</p>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.fullName')}</label>
                                <input type="text" defaultValue="Super Admin" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)' }} />
                            </div>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.emailAddress')}</label>
                                <input type="email" defaultValue="admin@edutraker.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)' }} />
                            </div>
                            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('settings.currentPassword')}</label>
                                <input type="password" placeholder={t('settings.currentPasswordPlaceholder')} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-main)' }} />
                            </div>

                            <Button variant="primary">{t('settings.updateProfile')}</Button>
                        </form>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle} style={{ color: 'var(--color-text-main)' }}>{t('settings.title')}</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        background: activeTab === 'general' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: activeTab === 'general' ? '#fff' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                    }}
                >
                    {t('settings.general')}
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        background: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: activeTab === 'profile' ? '#fff' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                    }}
                >
                    {t('settings.profile')}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        background: activeTab === 'security' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: activeTab === 'security' ? '#fff' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                    }}
                >
                    {t('settings.security')}
                </button>
                <button
                    onClick={() => setActiveTab('communication')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        background: activeTab === 'communication' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                        color: activeTab === 'communication' ? '#fff' : 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                    }}
                >
                    {t('nav.communication')}
                </button>
            </div>

            {renderTabContent()}
        </div>
    );
};

export default SystemSettings;
