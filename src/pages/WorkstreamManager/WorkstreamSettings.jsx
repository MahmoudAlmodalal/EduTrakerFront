import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Save, Bell, Lock, Globe, Mail, Moon, Sun, Monitor, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import workstreamService from '../../services/workstreamService';
import './Workstream.css';

const WorkstreamSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const response = await workstreamService.getUserProfile(user.id);
                const nameParts = response.full_name?.split(' ') || ['', ''];
                setProfileData({
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    email: response.email || ''
                });
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const payload = {
                full_name: `${profileData.first_name} ${profileData.last_name}`.trim(),
                email: profileData.email
            };
            await workstreamService.updateUserProfile(user.id, payload);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">{t('workstream.settings.title')}</h1>
                <p className="workstream-subtitle">{t('workstream.settings.subtitle')}</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <div className="management-card" style={{ width: '250px', padding: '1rem', height: 'fit-content' }}>
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
                        <Users size={18} /> {t('workstream.settings.tab.profile')}
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
                        <Globe size={18} /> {t('workstream.settings.tab.preferences')}
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
                        <Bell size={18} /> {t('workstream.settings.tab.notifications')}
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
                        <Lock size={18} /> {t('workstream.settings.tab.security')}
                    </div>
                </div>

                <div className="management-card" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.settings.profile.title')}</h3>
                            {loading ? (
                                <div>Loading profile...</div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('workstream.settings.profile.firstName')}</label>
                                            <input
                                                type="text"
                                                value={profileData.first_name}
                                                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('workstream.settings.profile.lastName')}</label>
                                            <input
                                                type="text"
                                                value={profileData.last_name}
                                                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('workstream.settings.profile.email')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                                            <Save size={18} /> {saving ? 'Saving...' : t('workstream.settings.profile.saveBtn')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.settings.preferences.title')}</h3>

                            {/* Dark Mode */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('workstream.settings.preferences.theme')}</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div
                                        onClick={() => toggleTheme()}
                                        style={{
                                            border: `2px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
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
                                        <Sun size={20} /> {t('workstream.settings.preferences.light')}
                                    </div>
                                    <div
                                        onClick={() => toggleTheme()}
                                        style={{
                                            border: `2px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
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
                                        <Moon size={20} /> {t('workstream.settings.preferences.dark')}
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('workstream.settings.preferences.language')}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'en'}
                                            onChange={() => changeLanguage('en')}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        English (US)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'ar'}
                                            onChange={() => changeLanguage('ar')}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        Arabic (العربية)
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.settings.notifications.title')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600' }}>{t('workstream.settings.notifications.email')}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.settings.notifications.emailDesc')}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600' }}>{t('workstream.settings.notifications.alerts')}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('workstream.settings.notifications.alertsDesc')}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>{t('workstream.settings.security.title')}</h3>
                            <button className="btn-primary" style={{ backgroundColor: 'var(--color-secondary)' }}>{t('workstream.settings.security.changePassword')}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default WorkstreamSettings;
