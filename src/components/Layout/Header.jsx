import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, LogOut, Sun, Moon, Search, User, GraduationCap } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    const { logout, user } = useAuth();
    const { t, theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const notifications = [
        { id: 1, title: t('mock.notif.1.title'), time: '5 min ago', unread: true },
        { id: 2, title: t('mock.notif.2.title'), time: '1 hour ago', unread: false },
        { id: 3, title: t('mock.notif.3.title'), time: '2 hours ago', unread: true },
    ];

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {!isSidebarOpen && (
                    <button onClick={toggleSidebar} className={styles.logoIconToggle} title="Toggle Sidebar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <div className="_logoIcon_lgw59_28" style={{
                            width: '44px',
                            height: '44px',
                            background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                            color: 'white',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                            position: 'relative'
                        }}>
                            <GraduationCap size={24} />
                        </div>
                    </button>
                )}

                {/* Search Bar - Aesthetic Placeholder */}
                <div className={styles.searchBar} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--slate-100)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    width: '300px',
                    marginLeft: 'var(--spacing-4)',
                    color: 'var(--color-text-muted)'
                }}>
                    <Search size={16} />
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>Search anything...</span>
                </div>
            </div>

            <div className={styles.right}>
                {/* Theme Toggle */}
                <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className={styles.divider}></div>

                <div style={{ position: 'relative' }}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <Bell size={20} />
                        <span className={styles.badge}>3</span>
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown} style={{
                            position: 'absolute',
                            top: '120%',
                            insetInlineEnd: 0,
                            width: '320px',
                            backgroundColor: 'var(--color-bg-surface)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--color-border)',
                            zIndex: 100,
                            overflow: 'hidden',
                            animation: 'scaleIn var(--transition-normal)'
                        }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('header.notifications')}</h3>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>Mark all as read</span>
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {notifications.map(notif => (
                                    <div key={notif.id} style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border-subtle)',
                                        backgroundColor: notif.unread ? 'var(--color-primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', marginBottom: '0.25rem', fontWeight: notif.unread ? 600 : 400 }}>{notif.title}</p>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{notif.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/super-admin/communication', { state: { activeTab: 'notifications' } });
                                    }}
                                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {t('header.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.divider}></div>

                <div className={styles.userSection} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1 }}>{user?.displayName || user?.email || 'Admin'}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user?.role?.replace('_', ' ').toLowerCase() || 'super admin'}</p>
                    </div>
                </div>
            </div>
        </header >
    );
};

export default Header;
