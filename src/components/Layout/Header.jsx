import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, LogOut, Sun, Moon, Search, User } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
    const { logout, user } = useAuth();
    const { t, theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notifRef = useRef(null);
    const userMenuRef = useRef(null);

    const notifications = [
        { id: 1, title: t('mock.notif.1.title'), time: '5 min ago', unread: true },
        { id: 2, title: t('mock.notif.2.title'), time: '1 hour ago', unread: false },
        { id: 3, title: t('mock.notif.3.title'), time: '2 hours ago', unread: true },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdowns on mobile when navigating
    const handleNavigation = (path, state = {}) => {
        setShowNotifications(false);
        setShowUserMenu(false);
        navigate(path, { state });
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button 
                    onClick={toggleSidebar} 
                    className={styles.menuBtn} 
                    title="Toggle Sidebar"
                    aria-label="Toggle navigation menu"
                >
                    <Menu size={20} />
                </button>

                {/* Search Bar */}
                <div className={styles.searchBar}>
                    <Search size={16} />
                    <span>Search anything...</span>
                </div>
            </div>

            <div className={styles.right}>
                {/* Theme Toggle */}
                <button 
                    className={styles.themeToggle} 
                    onClick={toggleTheme} 
                    title="Toggle Theme"
                    aria-label="Toggle dark/light theme"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className={styles.divider}></div>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                        aria-label="Toggle notifications"
                        aria-expanded={showNotifications}
                    >
                        <Bell size={20} />
                        {notifications.some(n => n.unread) && <span className={styles.badge}>{notifications.filter(n => n.unread).length}</span>}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            width: 'clamp(280px, 90vw, 360px)',
                            backgroundColor: 'var(--color-bg-surface)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--color-border)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            marginTop: 'var(--spacing-2)',
                            animation: 'scaleIn var(--transition-normal)'
                        }}>
                            <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>{t('header.notifications')}</h3>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>Mark all as read</span>
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {notifications.map(notif => (
                                    <div key={notif.id} style={{
                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                        borderBottom: '1px solid var(--color-border-subtle)',
                                        backgroundColor: notif.unread ? 'var(--color-primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', marginBottom: '0.25rem', fontWeight: notif.unread ? 600 : 400, margin: 0 }}>{notif.title}</p>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{notif.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: 'var(--spacing-3)', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => handleNavigation('/super-admin/communication', { activeTab: 'notifications' })}
                                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}
                                >
                                    {t('header.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.divider}></div>

                {/* User Menu */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                    <button 
                        className={styles.iconBtn}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        title="User Menu"
                        aria-label="User menu"
                        aria-expanded={showUserMenu}
                    >
                        <User size={20} />
                    </button>

                    {showUserMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            width: 'clamp(220px, 90vw, 280px)',
                            backgroundColor: 'var(--color-bg-surface)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--color-border)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            marginTop: 'var(--spacing-2)',
                            animation: 'scaleIn var(--transition-normal)'
                        }}>
                            <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)', margin: 0, marginBottom: '0.25rem' }}>{user?.name || 'User'}</p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>{user?.role?.replace('_', ' ').toLowerCase() || 'admin'}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-3) var(--spacing-4)',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderTop: '1px solid var(--color-border)',
                                    color: 'var(--color-danger)',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-size-sm)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-danger-light)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
