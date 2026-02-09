import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import {
    Save,
    Bell,
    Lock,
    Globe,
    Mail,
    Moon,
    Sun,
    User,
    Shield,
    Eye,
    EyeOff,
    Check,
    Camera,
    Smartphone,
    BookOpen,
    RefreshCw
} from 'lucide-react';
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        student_id_code: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const data = await studentService.getProfile(user.id);
                setProfile({
                    first_name: data.full_name?.split(' ')[0] || '',
                    last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
                    email: data.email || '',
                    phone: data.phone || data.user?.phone || '',
                    student_id_code: data.id_code || 'N/A'
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user?.id]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await studentService.updateProfile(user.id, {
                full_name: `${profile.first_name} ${profile.last_name}`,
                email: profile.email,
                phone: profile.phone
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const tabs = [
        { id: 'profile', label: t('student.settings.tab.profile') || 'Profile', icon: User },
        { id: 'preferences', label: t('student.settings.tab.preferences') || 'Preferences', icon: Globe },
        { id: 'notifications', label: t('student.settings.tab.notifications') || 'Notifications', icon: Bell },
        { id: 'security', label: t('student.settings.tab.security') || 'Security', icon: Lock },
    ];

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="student-settings">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.settings.title') || 'Settings'}</h1>
                    <p className="page-subtitle">Manage your account preferences and security</p>
                </div>
            </header>

            <div className="settings-layout">
                {/* Settings Sidebar */}
                <div className="settings-sidebar">
                    {/* Profile Card */}
                    <div className="settings-profile-card">
                        <div className="settings-avatar">
                            <span>{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}</span>
                            <button className="avatar-edit-btn">
                                <Camera size={14} />
                            </button>
                        </div>
                        <div className="settings-profile-info">
                            <span className="settings-profile-name">{user?.full_name || 'Student User'}</span>
                            <span className="settings-profile-email">{user?.email || 'student@edutraker.com'}</span>
                        </div>
                    </div>

                    {/* Nav Tabs */}
                    <nav className="settings-nav">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2>{t('student.settings.profile.title') || 'Profile Information'}</h2>
                                <p>Update your personal details and contact information</p>
                            </div>

                            <div className="settings-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('student.settings.profile.firstName') || 'First Name'}</label>
                                        <input
                                            type="text"
                                            value={profile.first_name}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('student.settings.profile.lastName') || 'Last Name'}</label>
                                        <input
                                            type="text"
                                            value={profile.last_name}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>{t('student.settings.profile.email') || 'Email Address'}</label>
                                    <div className="input-with-icon">
                                        <Mail size={18} />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="input-with-icon">
                                        <Smartphone size={18} />
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Student ID</label>
                                    <div className="input-with-icon">
                                        <BookOpen size={18} />
                                        <input type="text" value={profile.student_id_code} className="form-input" disabled />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button className="btn-secondary">Cancel</button>
                                    <button className="btn-primary" onClick={handleSave}>
                                        {saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2>{t('student.settings.preferences.title') || 'Preferences'}</h2>
                                <p>Customize your experience with theme and language options</p>
                            </div>

                            {/* Theme Selection */}
                            <div className="preference-group">
                                <h3>{t('student.settings.preferences.theme') || 'Theme'}</h3>
                                <div className="theme-options">
                                    <div
                                        onClick={() => theme === 'dark' && toggleTheme()}
                                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                    >
                                        <div className="theme-preview light">
                                            <Sun size={24} />
                                        </div>
                                        <span>{t('student.settings.preferences.light') || 'Light Mode'}</span>
                                        {theme === 'light' && <Check size={16} className="check-icon" />}
                                    </div>
                                    <div
                                        onClick={() => theme === 'light' && toggleTheme()}
                                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                    >
                                        <div className="theme-preview dark">
                                            <Moon size={24} />
                                        </div>
                                        <span>{t('student.settings.preferences.dark') || 'Dark Mode'}</span>
                                        {theme === 'dark' && <Check size={16} className="check-icon" />}
                                    </div>
                                </div>
                            </div>

                            {/* Language Selection */}
                            <div className="preference-group">
                                <h3>{t('student.settings.preferences.language') || 'Language'}</h3>
                                <div className="language-options">
                                    <label className={`language-option ${language === 'en' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'en'}
                                            onChange={() => changeLanguage('en')}
                                        />
                                        <div className="language-flag">🇺🇸</div>
                                        <div className="language-info">
                                            <span className="language-name">English</span>
                                            <span className="language-region">United States</span>
                                        </div>
                                        {language === 'en' && <Check size={16} className="check-icon" />}
                                    </label>
                                    <label className={`language-option ${language === 'ar' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="language"
                                            checked={language === 'ar'}
                                            onChange={() => changeLanguage('ar')}
                                        />
                                        <div className="language-flag">🇸🇦</div>
                                        <div className="language-info">
                                            <span className="language-name">العربية</span>
                                            <span className="language-region">Arabic</span>
                                        </div>
                                        {language === 'ar' && <Check size={16} className="check-icon" />}
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2>{t('student.settings.notifications.title') || 'Notification Settings'}</h2>
                                <p>Control how and when you receive notifications</p>
                            </div>

                            <div className="notification-options">
                                <div className="notification-item">
                                    <div className="notification-icon">
                                        <Mail size={20} />
                                    </div>
                                    <div className="notification-info">
                                        <h4>{t('student.settings.notifications.email') || 'Email Notifications'}</h4>
                                        <p>{t('student.settings.notifications.emailDesc') || 'Receive important updates via email'}</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="notification-item">
                                    <div className="notification-icon">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="notification-info">
                                        <h4>{t('student.settings.notifications.alerts') || 'Assignment Alerts'}</h4>
                                        <p>{t('student.settings.notifications.alertsDesc') || 'Get notified about deadlines and submissions'}</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="notification-item">
                                    <div className="notification-icon">
                                        <Bell size={20} />
                                    </div>
                                    <div className="notification-info">
                                        <h4>{t('student.settings.notifications.push') || 'Push Notifications'}</h4>
                                        <p>{t('student.settings.notifications.pushDesc') || 'Receive real-time alerts on your device'}</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2>{t('student.settings.security.title') || 'Security Settings'}</h2>
                                <p>Manage your password and account security</p>
                            </div>

                            <div className="security-options">
                                <div className="form-group">
                                    <label>{t('student.settings.security.currentPassword') || 'Current Password'}</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input type="password" placeholder="••••••••" className="form-input" />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('student.settings.security.newPassword') || 'New Password'}</label>
                                        <div className="input-with-icon">
                                            <Shield size={18} />
                                            <input type="password" placeholder="••••••••" className="form-input" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('student.settings.security.confirmPassword') || 'Confirm New Password'}</label>
                                        <div className="input-with-icon">
                                            <Shield size={18} />
                                            <input type="password" placeholder="••••••••" className="form-input" />
                                        </div>
                                    </div>
                                </div>

                                <div className="security-info-card">
                                    <Shield size={20} />
                                    <p>Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.</p>
                                </div>

                                <div className="form-actions">
                                    <button className="btn-primary">Update Password</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;
