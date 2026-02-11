import React, { useState, useEffect } from 'react';
import { User, Lock, Globe, Save, Camera, Check, AlertCircle, Shield, Moon, Sun, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTeacherProfile, useUpdateTeacherProfileMutation } from '../../hooks/useTeacherQueries';
import './Teacher.css';

const TeacherSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Get language, theme, and translation function from context
    const { language, changeLanguage, theme, toggleTheme, t } = useTheme();

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        specialization: ''
    });

    const {
        data: profileData,
        isLoading: loading
    } = useTeacherProfile(user.user_id, {
        enabled: Boolean(user?.user_id)
    });

    const updateProfileMutation = useUpdateTeacherProfileMutation();

    useEffect(() => {
        if (!profileData) {
            return;
        }

        setProfile({
            name: profileData.user_name || profileData.user?.full_name || '',
            email: profileData.user_email || profileData.user?.email || '',
            phone: profileData.phone_number || '',
            bio: profileData.bio || '',
            specialization: profileData.specialization || ''
        });
    }, [profileData]);

    // Security State
    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactor: false
    });

    const handleSave = async (section) => {
        setIsLoading(true);
        try {
            if (section === 'Profile') {
                await updateProfileMutation.mutateAsync({
                    userId: user.user_id,
                    payload: {
                    bio: profile.bio,
                    specialization: profile.specialization
                    // Other fields might be read-only or handled differently in backend
                    }
                });
            }
            setSuccessMessage(`${section} updated successfully!`);
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error(`Error updating ${section}:`, error);
            alert(`Failed to update ${section}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderSuccessMessage = () => {
        if (!successMessage) return null;
        return (
            <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in z-50 border border-white/20 backdrop-blur-md">
                <div className="bg-white/20 p-1 rounded-full">
                    <Check size={20} />
                </div>
                <span className="font-bold tracking-wide text-sm">{successMessage}</span>
            </div>
        );
    };

    const tabs = [
        { id: 'general', label: t('teacher.settings.tab.general'), icon: Globe },
        { id: 'profile', label: t('teacher.settings.tab.profile'), icon: User },
        { id: 'security', label: t('teacher.settings.tab.security'), icon: Lock }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-teacher-primary" size={48} />
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="beauty-card fade-in">
                        <div className="settings-card-header">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Globe size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{t('teacher.settings.general.title')}</h2>
                                <p className="text-sm text-slate-500">{t('teacher.settings.general.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <form className="space-y-8">
                                {/* Language Toggle */}
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-slate-700">{t('teacher.settings.language')}</label>

                                    {/* Beautiful Segmented Button */}
                                    <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => changeLanguage('en')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${language === 'en'
                                                ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <span className="text-lg">🇺🇸</span>
                                            <span>English</span>
                                            {language === 'en' && <Check size={16} className="text-blue-600" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeLanguage('ar')}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${language === 'ar'
                                                ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <span className="text-lg">🇸🇦</span>
                                            <span>العربية</span>
                                            {language === 'ar' && <Check size={16} className="text-blue-600" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Theme Selection - Checkbox Style Buttons */}
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-slate-700">{t('teacher.settings.appearance')}</label>

                                    {/* Segmented Toggle like Language */}
                                    <div className="inline-flex p-1 rounded-xl border" style={{ backgroundColor: 'var(--teacher-bg)', borderColor: 'var(--teacher-border)' }}>
                                        <button
                                            type="button"
                                            onClick={() => theme !== 'light' && toggleTheme()}
                                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200"
                                            style={{
                                                backgroundColor: theme === 'light' ? 'var(--teacher-surface)' : 'transparent',
                                                color: theme === 'light' ? '#F59E0B' : 'var(--teacher-text-muted)',
                                                boxShadow: theme === 'light' ? 'var(--shadow-md)' : 'none',
                                                border: theme === 'light' ? '1px solid #FDE68A' : 'none'
                                            }}
                                        >
                                            <Sun size={18} />
                                            <span>{t('teacher.settings.lightMode')}</span>
                                            {theme === 'light' && <Check size={16} style={{ color: '#F59E0B' }} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200"
                                            style={{
                                                backgroundColor: theme === 'dark' ? 'var(--teacher-surface)' : 'transparent',
                                                color: theme === 'dark' ? '#818CF8' : 'var(--teacher-text-muted)',
                                                boxShadow: theme === 'dark' ? 'var(--shadow-md)' : 'none',
                                                border: theme === 'dark' ? '1px solid #818CF8' : 'none'
                                            }}
                                        >
                                            <Moon size={18} />
                                            <span>{t('teacher.settings.darkMode')}</span>
                                            {theme === 'dark' && <Check size={16} style={{ color: '#818CF8' }} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handleSave('Preferences')}
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        <span>{t('teacher.settings.savePreferences')}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="beauty-card fade-in">
                        <div className="settings-card-header">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <User size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{t('teacher.settings.profile.title')}</h2>
                                <p className="text-sm text-slate-500">{t('teacher.settings.profile.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <form className="space-y-8">
                                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600 border border-slate-200">
                                        {profile.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-slate-800">{profile.name}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                                onClick={() => setSuccessMessage('Avatar upload feature coming soon!')}
                                            >
                                                {t('teacher.settings.changeAvatar')}
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                                onClick={() => setSuccessMessage('Avatar removed successfully!')}
                                            >
                                                {t('teacher.settings.remove')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">{t('teacher.settings.fullName')}</label>
                                        <input
                                            type="text"
                                            className="teacher-input w-full bg-gray-50 text-gray-500"
                                            value={profile.name}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Specialization</label>
                                        <input
                                            type="text"
                                            className="teacher-input w-full"
                                            value={profile.specialization}
                                            onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">{t('teacher.settings.emailAddress')}</label>
                                        <input
                                            type="email"
                                            className="teacher-input w-full bg-gray-50 text-gray-500"
                                            value={profile.email}
                                            readOnly
                                            disabled
                                        />
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Lock size={12} /> {t('teacher.settings.emailManaged')}
                                        </p>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">{t('teacher.settings.bio')}</label>
                                        <textarea
                                            rows="3"
                                            className="teacher-input w-full"
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handleSave('Profile')}
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        <span>{t('teacher.settings.updateProfile')}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="beauty-card fade-in">
                        <div className="settings-card-header">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <Shield size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{t('teacher.settings.security.title')}</h2>
                                <p className="text-sm text-slate-500">{t('teacher.settings.security.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <form className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t('teacher.settings.changePassword')}</h3>
                                    <div className="space-y-4">
                                        <input
                                            type="password"
                                            className="teacher-input w-full"
                                            placeholder={t('teacher.settings.currentPassword')}
                                            value={security.currentPassword}
                                            onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="password"
                                                className="teacher-input w-full"
                                                placeholder={t('teacher.settings.newPassword')}
                                                value={security.newPassword}
                                                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                            />
                                            <input
                                                type="password"
                                                className="teacher-input w-full"
                                                placeholder={t('teacher.settings.confirmPassword')}
                                                value={security.confirmPassword}
                                                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="max-w-md">
                                            <h4 className="font-bold text-slate-800 mb-1">{t('teacher.settings.twoFactor')}</h4>
                                            <p className="text-sm text-slate-500">{t('teacher.settings.twoFactorDesc')}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={security.twoFactor}
                                                onChange={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handleSave('Security Settings')}
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <span className="loader px-2"></span> : <Save size={18} />}
                                        <span>{t('teacher.settings.updateSecurity')}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12 w-full">
            {renderSuccessMessage()}

            {/* Simple Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('teacher.settings.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('teacher.settings.subtitle')}</p>
                </div>
            </header>

            {/* Centered Navigation */}
            <div className="flex flex-col gap-8 items-center max-w-4xl mx-auto w-full">

                {/* Top Tabs Modern Pill Design */}
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full p-1.5 shadow-sm inline-flex items-center gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`beauty-tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content - Centered */}
                <div className="w-full">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default TeacherSettings;
