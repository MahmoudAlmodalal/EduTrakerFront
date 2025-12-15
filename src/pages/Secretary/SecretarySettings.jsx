import React, { useState } from 'react';
import { User, Bell, Lock, Globe, Save } from 'lucide-react';
import './Secretary.css';
// import { useTheme } from '../../context/ThemeContext'; // Assuming ThemeContext is globally available if needed, but for now using local state/mocks to match current file

const SecretarySettings = () => {
    const [activeTab, setActiveTab] = useState('general');

    // Mock States for form fields
    const [language, setLanguage] = useState('en');
    const [notifications, setNotifications] = useState({ email: true, newApplicationAlerts: true }); // Renamed 'push' to 'newApplicationAlerts' for clarity based on UI

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>General Preferences</h2>
                            <Globe size={20} className="text-blue-500" />
                        </div>
                        <form className="max-w-xl">
                            <div className="form-group">
                                <label className="form-label">Language</label>
                                <select
                                    className="form-select"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English (US)</option>
                                    <option value="es">Spanish</option>
                                    <option value="ar">Arabic</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time Zone</label>
                                <select className="form-select">
                                    <option>(GMT+02:00) Jerusalem</option>
                                    <option>(GMT+00:00) UTC</option>
                                    <option>(GMT-05:00) Eastern Time</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Theme</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="theme" defaultChecked /> Light
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="theme" /> Dark
                                    </label>
                                </div>
                            </div>
                            <button type="button" className="btn-primary mt-4">
                                <Save size={18} className="mr-2" />
                                Save Changes
                            </button>
                        </form>
                    </div>
                );
            case 'profile':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>Profile Information</h2>
                            <User size={20} className="text-blue-500" />
                        </div>
                        <form className="max-w-xl">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 border border-gray-200">
                                    MD
                                </div>
                                <div>
                                    <button type="button" className="btn-secondary bg-white border border-gray-300">Change Avatar</button>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size 800K</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-input" defaultValue="Maria Davis" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-input" defaultValue="secretary@school.edu" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input type="tel" className="form-input" defaultValue="+1 234 567 890" />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button type="button" className="btn-primary">Update Profile</button>
                            </div>
                        </form>
                    </div>
                );
            case 'security':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>Security Settings</h2>
                            <Lock size={20} className="text-blue-500" />
                        </div>
                        <form className="max-w-xl">
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-input" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input type="password" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input type="password" className="form-input" />
                                </div>
                            </div>
                            <hr className="my-6 border-gray-100" />
                            <div className="form-group">
                                <label className="flex items-center gap-2 font-medium text-gray-800">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                                    Enable Two-Factor Authentication (2FA)
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">Adds an extra layer of security to your account.</p>
                            </div>
                            <button type="button" className="btn-primary mt-4">Update Security</button>
                        </form>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="management-card fade-in">
                        <div className="widget-header">
                            <h2>Notification Preferences</h2>
                            <Bell size={20} className="text-blue-500" />
                        </div>
                        <div className="max-w-xl space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-gray-800">Email Notifications</h4>
                                    <p className="text-sm text-gray-500">Receive updates and alerts via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications.email}
                                        onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-gray-800">New Application Alerts</h4>
                                    <p className="text-sm text-gray-500">Get notified when a new student applies</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications.newApplicationAlerts}
                                        onChange={() => setNotifications({ ...notifications, newApplicationAlerts: !notifications.newApplicationAlerts })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                <h1>Settings</h1>
                <p>Manage your profile, preferences, and account security.</p>
            </header>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    Notifications
                </button>
            </div>

            <div className="settings-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SecretarySettings;
