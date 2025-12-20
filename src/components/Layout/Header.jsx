import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, LogOut } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
    const { logout } = useAuth();
    const { t } = useTheme();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = React.useState(false);

    const notifications = [
        { id: 1, title: t('mock.notif.1.title'), time: '5 min ago', unread: true },
        { id: 2, title: t('mock.notif.2.title'), time: '1 hour ago', unread: false },
        { id: 3, title: t('mock.notif.3.title'), time: '2 hours ago', unread: true },
    ];

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button onClick={toggleSidebar} className={styles.menuBtn}>
                    <Menu size={24} />
                </button>
            </div>

            <div className={styles.right}>
                <div style={{ position: 'relative' }}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        <span className={styles.badge}>3</span>
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            insetInlineEnd: 0,
                            marginTop: '0.5rem',
                            width: '300px',
                            backgroundColor: 'var(--color-bg-surface)',
                            borderRadius: '0.5rem',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--color-border)',
                            zIndex: 50
                        }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('header.notifications')}</h3>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.map(notif => (
                                    <div key={notif.id} style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        backgroundColor: notif.unread ? 'var(--color-bg-body)' : 'var(--color-bg-surface)',
                                        cursor: 'pointer'
                                    }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{notif.title}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{notif.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/super-admin/communication', { state: { activeTab: 'notifications' } });
                                    }}
                                    style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {t('header.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={logout} className={styles.logoutBtn} title={t('header.logout')}>
                    <LogOut size={20} />
                </button>
            </div>
        </header >
    );
};

export default Header;
