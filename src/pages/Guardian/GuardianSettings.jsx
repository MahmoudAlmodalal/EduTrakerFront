import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Save, Bell, Lock, Globe, Mail, Moon, Sun, Users, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './Guardian.css';
import { useAuth } from '../../context/AuthContext';
import guardianService from '../../services/guardianService';

const GuardianSettings = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [profileDraft, setProfileDraft] = useState(null);

    const {
        data: profileData,
        isLoading: loading,
        error: profileError,
        refetch: refetchProfile
    } = useQuery({
        queryKey: ['guardian', 'profile', user?.id],
        queryFn: ({ signal }) => guardianService.getProfile(user.id, { signal }),
        enabled: Boolean(user?.id)
    });

    const baseProfile = useMemo(() => {
        if (!profileData) {
            return {
                firstName: '',
                lastName: '',
                email: '',
                phone: ''
            };
        }
        const [firstName, ...lastNameParts] = (profileData.user?.full_name || '').split(' ');
        return {
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: profileData.user?.email || '',
            phone: profileData.phone_number || ''
        };
    }, [profileData]);

    const profile = profileDraft || baseProfile;

    const updateProfileField = (field, value) => {
        setProfileDraft((prev) => ({
            ...(prev || baseProfile),
            [field]: value
        }));
    };

    const updateProfileMutation = useMutation({
        mutationFn: (payload) => guardianService.updateProfile(user.id, payload),
        onSuccess: () => {
            setProfileDraft(null);
            queryClient.invalidateQueries({ queryKey: ['guardian', 'profile', user?.id] });
        }
    });

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                user: {
                    full_name: `${profile.firstName} ${profile.lastName}`.trim()
                },
                phone_number: profile.phone
            });
        } catch {
            // Error is exposed through updateProfileMutation.error for UI feedback.
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (profileError) {
        return (
            <div>
                <h1 className="guardian-page-title">{t('guardian.settings.title') || 'Settings'}</h1>
                <div className="guardian-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-500" />
                        <div>{profileError.message || t('common.somethingWentWrong') || 'Failed to load settings.'}</div>
                    </div>
                    <button className="btn-primary" onClick={() => refetchProfile()}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="guardian-page-title">{t('guardian.settings.title') || 'Settings'}</h1>

            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Settings Tabs */}
                <div className="guardian-card" style={{ width: '250px', padding: '1rem', height: 'fit-content' }}>
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
                        <Users size={18} /> {t('guardian.settings.tab.profile') || 'Profile'}
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
                        <Globe size={18} /> {t('guardian.settings.tab.preferences') || 'Preferences'}
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
                        <Bell size={18} /> {t('guardian.settings.tab.notifications') || 'Notifications'}
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
                        <Lock size={18} /> {t('guardian.settings.tab.security') || 'Security'}
                    </div>
                </div>

                {/* Settings Content */}
                <div className="guardian-card" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSaveProfile}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('guardian.settings.profile.title') || 'Profile Information'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('guardian.settings.profile.firstName') || 'First Name'}</label>
                                    <input
                                        type="text"
                                        value={profile.firstName}
                                        onChange={(e) => updateProfileField('firstName', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('guardian.settings.profile.lastName') || 'Last Name'}</label>
                                    <input
                                        type="text"
                                        value={profile.lastName}
                                        onChange={(e) => updateProfileField('lastName', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('guardian.settings.profile.email') || 'Email'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-body)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--color-text-main)' }}>{t('guardian.settings.profile.phone') || 'Phone Number'}</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => updateProfileField('phone', e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary" type="submit" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    {t('guardian.settings.profile.saveBtn') || 'Save Changes'}
                                </button>
                            </div>
                            {updateProfileMutation.isError && (
                                <p style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 500 }}>
                                    {updateProfileMutation.error?.message || t('common.somethingWentWrong') || 'Failed to save profile.'}
                                </p>
                            )}
                            {updateProfileMutation.isSuccess && (
                                <p style={{ marginTop: '1rem', color: '#16a34a', fontWeight: 500 }}>
                                    {t('guardian.settings.profile.saved') || 'Profile updated successfully.'}
                                </p>
                            )}
                        </form>
                    )}

                    {activeTab === 'preferences' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('guardian.settings.preferences.title') || 'Preferences'}</h3>

                            {/* Dark Mode */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('guardian.settings.preferences.theme') || 'Theme'}</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div
                                        onClick={() => theme === 'dark' && toggleTheme()}
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
                                        <Sun size={20} /> {t('guardian.settings.preferences.light') || 'Light Mode'}
                                    </div>
                                    <div
                                        onClick={() => theme === 'light' && toggleTheme()}
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
                                        <Moon size={20} /> {t('guardian.settings.preferences.dark') || 'Dark Mode'}
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{t('guardian.settings.preferences.language') || 'Language'}</h4>
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
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('guardian.settings.notifications.title') || 'Notification Settings'}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('guardian.settings.notifications.email') || 'Email Notifications'}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('guardian.settings.notifications.emailDesc') || 'Receive notifications via email'}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('guardian.settings.notifications.alerts') || 'Child Activity Alerts'}</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('guardian.settings.notifications.alertsDesc') || 'Get alerts about your children\'s activities'}</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{t('guardian.settings.security.title') || 'Security Settings'}</h3>
                            <button className="btn-primary" style={{ backgroundColor: 'var(--color-secondary)' }}>{t('guardian.settings.security.changePassword') || 'Change Password'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardianSettings;
