import React, { useState } from 'react';
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
    BookOpen
} from 'lucide-react';
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, toggleTheme, language, changeLanguage, t } = useTheme();
    const { user } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        student_id_code: ''
    });

    React.useEffect(() => {
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
                                        <h4>Grade Announcements</h4>
                                        <p>Be notified when grades are posted</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="notification-item">
                                    <div className="notification-icon">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="notification-info">
                                        <h4>Push Notifications</h4>
                                        <p>Receive notifications on your device</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" />
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

                            <div className="security-card">
                                <div className="security-icon">
                                    <Shield size={24} />
                                </div>
                                <div className="security-info">
                                    <h3>Password</h3>
                                    <p>Last changed 30 days ago</p>
                                </div>
                                <button className="btn-outline">Change Password</button>
                            </div>

                            <div className="password-form">
                                <h3>Update Password</h3>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="input-with-icon password-input">
                                        <Lock size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter current password"
                                            className="form-input"
                                        />
                                        <button
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input type="password" placeholder="Enter new password" className="form-input" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input type="password" placeholder="Confirm new password" className="form-input" />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button className="btn-primary">
                                        <Lock size={18} /> Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .settings-layout {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 1.5rem;
                    align-items: start;
                }
                
                @media (max-width: 1024px) {
                    .settings-layout {
                        grid-template-columns: 1fr;
                    }
                }
                
                .settings-sidebar {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    position: sticky;
                    top: 2rem;
                }
                
                .settings-profile-card {
                    text-align: center;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                    margin-bottom: 1rem;
                }
                
                .settings-avatar {
                    width: 80px;
                    height: 80px;
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    position: relative;
                }
                
                .settings-avatar span {
                    color: white;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .avatar-edit-btn {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    width: 28px;
                    height: 28px;
                    background: white;
                    border: 2px solid var(--student-primary, #0891b2);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--student-primary, #0891b2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .avatar-edit-btn:hover {
                    background: var(--student-primary, #0891b2);
                    color: white;
                }
                
                .settings-profile-name {
                    display: block;
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin-bottom: 0.25rem;
                }
                
                .settings-profile-email {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .settings-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }
                
                .settings-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 10px;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: var(--color-text-muted, #64748b);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                
                .settings-nav-item:hover {
                    background: #f0f9ff;
                    color: var(--student-primary, #0891b2);
                }
                
                .settings-nav-item.active {
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.1));
                    color: var(--student-primary, #0891b2);
                    font-weight: 600;
                }
                
                .settings-content {
                    background: white;
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                }
                
                .section-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .section-header h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.375rem;
                }
                
                .section-header p {
                    font-size: 0.875rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0;
                }
                
                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                
                @media (max-width: 640px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-main, #334155);
                    margin-bottom: 0.5rem;
                }
                
                .form-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9375rem;
                    color: var(--color-text-main, #1e293b);
                    background: #f8fafc;
                    transition: all 0.2s ease;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: var(--student-primary, #0891b2);
                    background: white;
                    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
                }
                
                .form-input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .input-with-icon {
                    position: relative;
                }
                
                .input-with-icon svg {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .input-with-icon .form-input {
                    padding-left: 2.75rem;
                }
                
                .password-input .form-input {
                    padding-right: 2.75rem;
                }
                
                .password-toggle {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--color-text-muted, #94a3b8);
                    cursor: pointer;
                    padding: 0;
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }
                
                .btn-primary, .btn-secondary, .btn-outline {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.25);
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.35);
                }
                
                .btn-secondary {
                    background: #f1f5f9;
                    color: var(--color-text-main, #334155);
                    border: none;
                }
                
                .btn-secondary:hover {
                    background: #e2e8f0;
                }
                
                .btn-outline {
                    background: transparent;
                    color: var(--student-primary, #0891b2);
                    border: 1px solid var(--student-primary, #0891b2);
                }
                
                .btn-outline:hover {
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.1));
                }
                
                /* Preferences Styles */
                .preference-group {
                    margin-bottom: 2rem;
                }
                
                .preference-group h3 {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: var(--color-text-main, #334155);
                    margin: 0 0 1rem;
                }
                
                .theme-options {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                
                .theme-option {
                    padding: 1.25rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 14px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .theme-option:hover {
                    border-color: var(--student-primary, #0891b2);
                }
                
                .theme-option.active {
                    border-color: var(--student-primary, #0891b2);
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.05));
                }
                
                .theme-preview {
                    width: 64px;
                    height: 64px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 0.75rem;
                }
                
                .theme-preview.light {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    color: #f59e0b;
                }
                
                .theme-preview.dark {
                    background: linear-gradient(135deg, #1e293b, #334155);
                    color: #94a3b8;
                }
                
                .theme-option span {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-main, #334155);
                }
                
                .check-icon {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    color: var(--student-primary, #0891b2);
                }
                
                .language-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .language-option {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .language-option input {
                    display: none;
                }
                
                .language-option:hover {
                    border-color: var(--student-primary, #0891b2);
                }
                
                .language-option.active {
                    border-color: var(--student-primary, #0891b2);
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.05));
                }
                
                .language-flag {
                    font-size: 1.5rem;
                }
                
                .language-info {
                    flex: 1;
                }
                
                .language-name {
                    display: block;
                    font-weight: 600;
                    color: var(--color-text-main, #1e293b);
                }
                
                .language-region {
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                /* Notification Styles */
                .notification-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .notification-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                
                .notification-item:hover {
                    background: #f0f9ff;
                }
                
                .notification-icon {
                    width: 44px;
                    height: 44px;
                    background: white;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--student-primary, #0891b2);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }
                
                .notification-info {
                    flex: 1;
                }
                
                .notification-info h4 {
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: var(--color-text-main, #1e293b);
                    margin: 0 0 0.25rem;
                }
                
                .notification-info p {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0;
                }
                
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 48px;
                    height: 26px;
                }
                
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #e2e8f0;
                    transition: 0.3s;
                    border-radius: 26px;
                }
                
                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .toggle-switch input:checked + .toggle-slider {
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                }
                
                .toggle-switch input:checked + .toggle-slider:before {
                    transform: translateX(22px);
                }
                
                /* Security Styles */
                .security-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem;
                    background: #f8fafc;
                    border-radius: 14px;
                    margin-bottom: 2rem;
                }
                
                .security-icon {
                    width: 52px;
                    height: 52px;
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .security-info {
                    flex: 1;
                }
                
                .security-info h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-main, #1e293b);
                    margin: 0 0 0.25rem;
                }
                
                .security-info p {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                    margin: 0;
                }
                
                .password-form {
                    background: #f8fafc;
                    border-radius: 14px;
                    padding: 1.5rem;
                }
                
                .password-form h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-main, #1e293b);
                    margin: 0 0 1.5rem;
                }
                
                .password-form .form-group {
                    margin-bottom: 1rem;
                }
                
                /* Dark Mode */
                [data-theme="dark"] .settings-sidebar,
                [data-theme="dark"] .settings-content {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .settings-nav-item:hover,
                [data-theme="dark"] .settings-nav-item.active {
                    background: rgba(8, 145, 178, 0.15);
                }
                
                [data-theme="dark"] .form-input {
                    background: #334155;
                    border-color: #475569;
                    color: #f1f5f9;
                }
                
                [data-theme="dark"] .notification-item,
                [data-theme="dark"] .security-card,
                [data-theme="dark"] .password-form {
                    background: rgba(30, 41, 59, 0.8);
                }
                
                [data-theme="dark"] .theme-option,
                [data-theme="dark"] .language-option {
                    border-color: #475569;
                }
                
                [data-theme="dark"] .settings-profile-name,
                [data-theme="dark"] .section-header h2,
                [data-theme="dark"] .preference-group h3,
                [data-theme="dark"] .notification-info h4,
                [data-theme="dark"] .security-info h3,
                [data-theme="dark"] .password-form h3,
                [data-theme="dark"] .theme-option span,
                [data-theme="dark"] .language-name {
                    color: #f1f5f9;
                }
            `}</style>
        </div>
    );
};

export default StudentSettings;
