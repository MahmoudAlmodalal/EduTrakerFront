import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, Globe, Save, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';

const SecretarySettings = () => {
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [notifications, setNotifications] = useState({ email: true, newApplicationAlerts: true });

    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        office_number: '',
        department: '',
        phone: '' // if available
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.user_id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await secretaryService.getProfile(user.user_id);
            setProfile({
                full_name: data.full_name,
                email: data.email,
                office_number: data.office_number || '',
                department: data.department || '',
                phone: data.phone || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await secretaryService.updateProfile(user.user_id, {
                full_name: profile.full_name,
                office_number: profile.office_number,
                department: profile.department
            });
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>{t('settings.general') || 'General Preferences'}</h2>
                            <Globe size={20} style={{ color: 'var(--sec-primary)' }} />
                        </div>
                        <form className="max-w-xl">
                            <div className="form-group">
                                <label className="form-label">{t('settings.language') || 'Language'}</label>
                                <select
                                    className="form-select"
                                    value={language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                >
                                    <option value="en">English (US)</option>
                                    <option value="ar">العربية (Arabic)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('settings.timezone') || 'Time Zone'}</label>
                                <select className="form-select">
                                    <option>(GMT+02:00) Jerusalem</option>
                                    <option>(GMT+00:00) UTC</option>
                                    <option>(GMT-05:00) Eastern Time</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('settings.theme') || 'Theme'}</label>
                                <div className="theme-toggle-group">
                                    <button
                                        type="button"
                                        onClick={() => theme !== 'light' && toggleTheme()}
                                        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                    >
                                        <Sun size={16} />
                                        {t('settings.lightMode') || 'Light'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => theme !== 'dark' && toggleTheme()}
                                        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                    >
                                        <Moon size={16} />
                                        {t('settings.darkMode') || 'Dark'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                );
            case 'profile':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>{t('settings.profile') || 'Profile Information'}</h2>
                            <User size={20} style={{ color: 'var(--sec-primary)' }} />
                        </div>
                        {loading ? <p>Loading profile...</p> : (
                            <form className="max-w-xl" onSubmit={handleUpdateProfile}>
                                <div className="profile-avatar-section">
                                    <div className="avatar-circle">{(profile.full_name || 'U').charAt(0)}</div>
                                    <div>
                                        <button type="button" className="btn-secondary">{t('settings.changeAvatar') || 'Change Avatar'}</button>
                                        <p className="avatar-hint">JPG, GIF or PNG. Max size 800K</p>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('settings.fullName') || 'Full Name'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('settings.email') || 'Email Address'}</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={profile.email}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.department}
                                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Office Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.office_number}
                                        onChange={(e) => setProfile({ ...profile, office_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Updating...' : (t('settings.updateProfile') || 'Update Profile')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                );
            case 'security':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>{t('settings.security') || 'Security Settings'}</h2>
                            <Lock size={20} style={{ color: 'var(--sec-primary)' }} />
                        </div>
                        <form className="max-w-xl">
                            <div className="form-group">
                                <label className="form-label">{t('settings.currentPassword') || 'Current Password'}</label>
                                <input type="password" className="form-input" />
                            </div>
                            <div className="password-grid">
                                <div className="form-group">
                                    <label className="form-label">{t('settings.newPassword') || 'New Password'}</label>
                                    <input type="password" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('settings.confirmPassword') || 'Confirm Password'}</label>
                                    <input type="password" className="form-input" />
                                </div>
                            </div>
                            <hr className="settings-divider" />
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" className="checkbox-input" />
                                    {t('settings.enable2FA') || 'Enable Two-Factor Authentication (2FA)'}
                                </label>
                                <p className="checkbox-hint">{t('settings.2FAHint') || 'Adds an extra layer of security to your account.'}</p>
                            </div>
                            <button type="button" className="btn-primary">{t('settings.updateSecurity') || 'Update Security'}</button>
                        </form>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>{t('settings.notifications') || 'Notification Preferences'}</h2>
                            <Bell size={20} style={{ color: 'var(--sec-primary)' }} />
                        </div>
                        <div className="notification-options">
                            <div className="notification-item">
                                <div>
                                    <h4>{t('settings.emailNotifications') || 'Email Notifications'}</h4>
                                    <p>{t('settings.emailNotificationsDesc') || 'Receive updates and alerts via email'}</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={notifications.email}
                                        onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="notification-item">
                                <div>
                                    <h4>{t('settings.newApplicationAlerts') || 'New Application Alerts'}</h4>
                                    <p>{t('settings.newApplicationAlertsDesc') || 'Get notified when a new student applies'}</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={notifications.newApplicationAlerts}
                                        onChange={() => setNotifications({ ...notifications, newApplicationAlerts: !notifications.newApplicationAlerts })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.settings.title') || 'Settings'}</h1>
                <p>{t('secretary.settings.subtitle') || 'Manage your profile, preferences, and account security.'}</p>
            </header>

            <div className="settings-tabs">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                >
                    {t('settings.general') || 'General'}
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                >
                    {t('settings.profile') || 'Profile'}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                >
                    {t('settings.security') || 'Security'}
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                >
                    {t('settings.notifications') || 'Notifications'}
                </button>
            </div>

            <div className="settings-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SecretarySettings;
