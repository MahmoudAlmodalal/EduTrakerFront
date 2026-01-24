import React, { useState } from 'react';
import { User, Lock, Globe, Save, Check, Shield, Moon, Sun, Camera, Mail, Phone, BookOpen, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Teacher.css';

const TeacherSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { language, changeLanguage, theme, toggleTheme, t } = useTheme();

    // Profile State
    const [profile, setProfile] = useState({
        name: 'Mr. Teacher',
        email: 'teacher@edutraker.com',
        phone: '+1 234 567 890',
        bio: 'Mathematics Teacher | Grade 10 & 11'
    });

    // Security State
    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactor: false
    });

    const handleSave = (section) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSuccessMessage(`${section} updated successfully!`);
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }, 800);
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
        { id: 'general', label: t('teacher.settings.tab.general'), icon: Globe, color: 'var(--teacher-secondary)' },
        { id: 'profile', label: t('teacher.settings.tab.profile'), icon: User, color: 'var(--teacher-primary)' },
        { id: 'security', label: t('teacher.settings.tab.security'), icon: Shield, color: 'var(--teacher-danger)' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="beauty-card animate-fade-in">
                        <div className="settings-card-header">
                            <div className="header-icon-shell" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--teacher-secondary)' }}>
                                <Globe size={24} />
                            </div>
                            <div>
                                <h2>{t('teacher.settings.general.title')}</h2>
                                <p>{t('teacher.settings.general.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <div className="settings-section">
                                <label className="section-label">
                                    <Globe size={16} />
                                    {t('teacher.settings.language')}
                                </label>
                                <div className="language-selector-grid">
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                                    >
                                        <span className="flag">🇺🇸</span>
                                        <div className="lang-info">
                                            <span className="name">English</span>
                                            <span className="desc">United States</span>
                                        </div>
                                        {language === 'en' && <Check size={18} className="check-icon" />}
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('ar')}
                                        className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
                                    >
                                        <span className="flag">🇸🇦</span>
                                        <div className="lang-info">
                                            <span className="name">العربية</span>
                                            <span className="desc">Saudi Arabia</span>
                                        </div>
                                        {language === 'ar' && <Check size={18} className="check-icon" />}
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section mt-8">
                                <label className="section-label">
                                    <Sparkles size={16} />
                                    {t('teacher.settings.appearance')}
                                </label>
                                <div className="theme-toggle-premium">
                                    <button
                                        onClick={() => theme !== 'light' && toggleTheme()}
                                        className={`theme-btn light ${theme === 'light' ? 'active' : ''}`}
                                    >
                                        <Sun size={20} />
                                        <span>{t('teacher.settings.lightMode')}</span>
                                    </button>
                                    <button
                                        onClick={() => theme !== 'dark' && toggleTheme()}
                                        className={`theme-btn dark ${theme === 'dark' ? 'active' : ''}`}
                                    >
                                        <Moon size={20} />
                                        <span>{t('teacher.settings.darkMode')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-actions mt-8">
                                <button className="btn-primary-premium" onClick={() => handleSave('Preferences')} disabled={isLoading}>
                                    {isLoading ? <span className="loader" /> : <Save size={18} />}
                                    <span>{t('teacher.settings.savePreferences')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="beauty-card animate-fade-in">
                        <div className="settings-card-header">
                            <div className="header-icon-shell" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--teacher-primary)' }}>
                                <User size={24} />
                            </div>
                            <div>
                                <h2>{t('teacher.settings.profile.title')}</h2>
                                <p>{t('teacher.settings.profile.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <div className="profile-upload-section">
                                <div className="avatar-wrapper">
                                    <div className="profile-avatar-large">
                                        {profile.name?.[0] || 'T'}
                                    </div>
                                    <button className="avatar-edit-btn">
                                        <Camera size={16} />
                                    </button>
                                </div>
                                <div className="profile-quick-info">
                                    <h3>{profile.name}</h3>
                                    <p>{profile.bio}</p>
                                </div>
                            </div>

                            <div className="settings-form-grid mt-8">
                                <div className="input-group">
                                    <label>{t('teacher.settings.fullName')}</label>
                                    <div className="input-wrapper">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            className="beauty-input-premium"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>{t('teacher.settings.phoneNumber')}</label>
                                    <div className="input-wrapper">
                                        <Phone size={18} className="input-icon" />
                                        <input
                                            type="tel"
                                            className="beauty-input-premium"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="input-group full-width">
                                    <label>{t('teacher.settings.emailAddress')}</label>
                                    <div className="input-wrapper disabled">
                                        <Mail size={18} className="input-icon" />
                                        <input
                                            type="email"
                                            className="beauty-input-premium"
                                            value={profile.email}
                                            readOnly
                                        />
                                        <Lock size={16} className="lock-icon" />
                                    </div>
                                    <p className="input-hint">{t('teacher.settings.emailManaged')}</p>
                                </div>

                                <div className="input-group full-width">
                                    <label>{t('teacher.settings.bio')}</label>
                                    <div className="input-wrapper">
                                        <BookOpen size={18} className="input-icon top" />
                                        <textarea
                                            rows="3"
                                            className="beauty-input-premium textarea"
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions mt-8">
                                <button className="btn-primary-premium" onClick={() => handleSave('Profile')} disabled={isLoading}>
                                    {isLoading ? <span className="loader" /> : <Save size={18} />}
                                    <span>{t('teacher.settings.updateProfile')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="beauty-card animate-fade-in">
                        <div className="settings-card-header">
                            <div className="header-icon-shell" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--teacher-danger)' }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2>{t('teacher.settings.security.title')}</h2>
                                <p>{t('teacher.settings.security.subtitle')}</p>
                            </div>
                        </div>

                        <div className="settings-card-body">
                            <div className="security-section">
                                <h3 className="section-subtitle">{t('teacher.settings.changePassword')}</h3>
                                <div className="settings-form-grid">
                                    <div className="input-group full-width">
                                        <label>{t('teacher.settings.currentPassword')}</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                className="beauty-input-premium"
                                                placeholder="••••••••"
                                                value={security.currentPassword}
                                                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>{t('teacher.settings.newPassword')}</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                className="beauty-input-premium"
                                                placeholder="••••••••"
                                                value={security.newPassword}
                                                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>{t('teacher.settings.confirmPassword')}</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                className="beauty-input-premium"
                                                placeholder="••••••••"
                                                value={security.confirmPassword}
                                                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="security-option-card mt-8">
                                <div className="option-info">
                                    <div className="option-icon-shell">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h4>{t('teacher.settings.twoFactor')}</h4>
                                        <p>{t('teacher.settings.twoFactorDesc')}</p>
                                    </div>
                                </div>
                                <label className="premium-toggle">
                                    <input
                                        type="checkbox"
                                        checked={security.twoFactor}
                                        onChange={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="form-actions mt-8">
                                <button className="btn-primary-premium danger" onClick={() => handleSave('Security')} disabled={isLoading}>
                                    {isLoading ? <span className="loader" /> : <Save size={18} />}
                                    <span>{t('teacher.settings.updateSecurity')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="teacher-settings-container animate-fade-in">
            {renderSuccessMessage()}

            <header className="settings-header-premium">
                <div>
                    <h1>{t('teacher.settings.title')}</h1>
                    <p>{t('teacher.settings.subtitle')}</p>
                </div>
            </header>

            <div className="settings-layout-premium">
                {/* Modern Sidebar Tabs */}
                <aside className="settings-sidebar-premium">
                    <nav className="settings-nav-pill">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`settings-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                                style={{ '--active-color': tab.color }}
                            >
                                <tab.icon size={20} />
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight size={16} className="chevron" />}
                            </button>
                        ))}
                    </nav>

                </aside>

                {/* Main Content Area */}
                <main className="settings-content-premium">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
};

export default TeacherSettings;
