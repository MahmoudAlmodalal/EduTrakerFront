import React, { useState } from 'react';
import { Save, Bell, Lock, Globe, Mail } from 'lucide-react';
import './Workstream.css';

const WorkstreamSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="workstream-dashboard">
            <div className="workstream-header">
                <h1 className="workstream-title">Settings</h1>
                <p className="workstream-subtitle">Manage your account and workstream preferences.</p>
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
                            gap: '0.75rem'
                        }}
                    >
                        <Users size={18} /> Profile
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
                            gap: '0.75rem'
                        }}
                    >
                        <Bell size={18} /> Notifications
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
                            gap: '0.75rem'
                        }}
                    >
                        <Lock size={18} /> Security
                    </div>
                </div>

                <div className="management-card" style={{ flex: 1, padding: '2rem' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>Profile Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>First Name</label>
                                    <input type="text" defaultValue="Mahmoud" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Last Name</label>
                                    <input type="text" defaultValue="Almodalal" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                        <input type="email" defaultValue="admin@edutraker.com" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary">
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>Notification Preferences</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600' }}>Email Notifications</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Receive daily summaries of school performance.</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '600' }}>Alerts & Warnings</h4>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Get notified about attendance drops or capacity issues.</p>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 className="chart-title" style={{ marginBottom: '1.5rem' }}>Security Settings</h3>
                            <button className="btn-primary" style={{ backgroundColor: 'var(--color-secondary)' }}>Change Password</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
import { Users } from 'lucide-react'; // Import missing icon

export default WorkstreamSettings;
