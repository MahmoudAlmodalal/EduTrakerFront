import React, { useState, useEffect } from 'react';
import {
    Settings,
    User,
    Lock,
    Bell,
    Globe,
    Shield,
    CreditCard,
    ChevronRight,
    Save,
    Camera,
    CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import './SchoolManager.css';

const SchoolManagerSettings = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [profileData, setProfileData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        language: 'English',
        timezone: 'UTC +00:00'
    });

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update user profile
            await api.patch('/profile/update/', {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone_number: profileData.phone
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const renderProfileSettings = () => (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-body)', borderRadius: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700' }}>
                        {profileData.first_name.charAt(0)}{profileData.last_name.charAt(0)}
                    </div>
                    <button style={{ position: 'absolute', bottom: '0', right: '0', padding: '6px', borderRadius: '50%', border: '2px solid var(--color-bg-surface)', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
                        <Camera size={16} />
                    </button>
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{profileData.first_name} {profileData.last_name}</h3>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>School Manager • Middle East International School</p>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Change Logo</button>
                </div>
            </div>

            <form onSubmit={handleProfileSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-main)' }}>First Name</label>
                    <input
                        type="text"
                        value={profileData.first_name}
                        onChange={e => setProfileData({ ...profileData, first_name: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-main)' }}>Last Name</label>
                    <input
                        type="text"
                        value={profileData.last_name}
                        onChange={e => setProfileData({ ...profileData, last_name: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-main)' }}>Email Address</label>
                    <input
                        type="email"
                        readOnly
                        value={profileData.email}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-main)' }}>Phone Number</label>
                    <input
                        type="text"
                        value={profileData.phone}
                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                    />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 2rem' }}>
                        {success ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSecuritySettings = () => (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Security & Authentication</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600' }}>Change Password</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Update your account password regularly for better security.</p>
                    </div>
                    <button className="btn-secondary">Update</button>
                </div>
                <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600' }}>Two-Factor Authentication</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Add an extra layer of security to your account.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: '600' }}>Disabled</span>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Enable</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const menuItems = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'School Subscription', icon: CreditCard },
        { id: 'advanced', label: 'Advanced Settings', icon: Settings }
    ];

    return (
        <div className="school-settings-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Account Settings</h1>
                <p className="school-manager-subtitle">Manage your personal information and application preferences.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', height: 'calc(100vh - 250px)' }}>
                {/* Sidebar Menu */}
                <div className="management-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    background: activeSection === item.id ? 'var(--color-primary-light)' : 'transparent',
                                    color: activeSection === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: activeSection === item.id ? '600' : '500',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <item.icon size={20} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {activeSection === item.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="management-card" style={{ padding: '2rem', overflowY: 'auto' }}>
                    {activeSection === 'profile' && renderProfileSettings()}
                    {activeSection === 'security' && renderSecuritySettings()}
                    {(activeSection !== 'profile' && activeSection !== 'security') && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                            <Settings size={64} style={{ marginBottom: '1rem' }} />
                            <h3>Coming Soon</h3>
                            <p>This settings section is under development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolManagerSettings;
