import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Save, Bell, Lock, Globe, Mail, Moon, Sun, Users } from 'lucide-react';
import '../Student.css';

const StudentSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();

    return (
        <div>
            <h1 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{t('student.settings.title') || 'Settings'}</h1>

            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Settings Tabs */}
                <div className="dashboard-card" style={{ width: '250px', padding: '1rem', height: 'fit-content' }}>
                    <div
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'profile' ? 'var(--color-bg-body)' : 'transparent',
                            fontWeight: activeTab === 'profile' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        <Users size={18} /> {t('student.settings.tab.profile') || 'Profile'}
                    </div>
                    <div
                        onClick={() => setActiveTab('preferences')}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'preferences' ? 'var(--color-bg-body)' : 'transparent',
                            fontWeight: activeTab === 'preferences' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        <Globe size={18} /> {t('student.settings.tab.preferences') || 'Preferences'}
                    </div>
                    <div
                        onClick={() => setActiveTab('notifications')}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'notifications' ? 'var(--color-bg-body)' : 'transparent',
                            fontWeight: activeTab === 'notifications' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        <Bell size={18} /> {t('student.settings.tab.notifications') || 'Notifications'}
                    </div>
                    <div
                        onClick={() => setActiveTab('security')}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'security' ? 'var(--color-bg-body)' : 'transparent',
                            fontWeight: activeTab === 'security' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        <Lock size={18} /> {t('student.settings.tab.security') || 'Security'}
                    </div>
                </div>

                {/* Settings Content */}
                <div className="dashboard-card" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('student.settings.profile.title') || 'Profile Information'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('student.settings.profile.firstName') || 'First Name'}</label>
                                    <input type="text" defaultValue="Student" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('student.settings.profile.lastName') || 'Last Name'}</label>
                                    <input type="text" defaultValue="User" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('student.settings.profile.email') || 'Email'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input type="email" defaultValue="student@edutraker.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button style={{
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <Save size={18} /> {t('student.settings.profile.saveBtn') || 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('student.settings.preferences.title') || 'Preferences'}</h3>

                            {/* Dark Mode */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('student.settings.preferences.theme') || 'Theme'}</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div
                                        onClick={() => theme === 'dark' && toggleTheme()}
                                        style={{
                                            border: `2px solid ${theme === 'light' ? '#2563eb' : 'var(--color-border)'}`,
                                            borderRadius: '0.5rem',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: theme === 'light' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <Sun size={20} /> {t('student.settings.preferences.light') || 'Light Mode'}
                                    </div>
                                    <div
                                        onClick={() => theme === 'light' && toggleTheme()}
                                        style={{
                                            border: `2px solid ${theme === 'dark' ? '#2563eb' : 'var(--color-border)'}`,
                                            borderRadius: '0.5rem',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: theme === 'dark' ? 'var(--color-bg-surface)' : 'transparent',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <Moon size={20} /> {t('student.settings.preferences.dark') || 'Dark Mode'}
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('student.settings.preferences.language') || 'Language'}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'en'}
                                            onChange={() => changeLanguage('en')}
                                            style={{ accentColor: '#2563eb' }}
                                        />
                                        English (US)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'ar'}
                                            onChange={() => changeLanguage('ar')}
                                            style={{ accentColor: '#2563eb' }}
                                        />
                                        Arabic (العربية)
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('student.settings.notifications.title') || 'Notification Settings'}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('student.settings.notifications.email') || 'Email Notifications'}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('student.settings.notifications.emailDesc') || 'Receive notifications via email'}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('student.settings.notifications.alerts') || 'Assignment Alerts'}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('student.settings.notifications.alertsDesc') || 'Get notified about upcoming assignments and deadlines'}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('student.settings.security.title') || 'Security Settings'}</h3>
                            <button style={{
                                backgroundColor: '#0f172a',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}>{t('student.settings.security.changePassword') || 'Change Password'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;
