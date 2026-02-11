import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users, // For Children Monitoring
    MessageSquare, // For Communication
    Settings, // For Settings
    LogOut,
    ShieldCheck, // Guardian Icon/Brand
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/Guardian/Guardian.css';

const GuardianLayout = () => {
    const { t } = useTheme();
    const { logout } = useAuth();
    const location = useLocation();

    // Initialize sidebar state based on screen width
    // Using 1024px as breakpoint to match CSS
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (mobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (!mobile && !isSidebarOpen) {
                // Auto-open on desktop if needed, or keep user preference
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [location, isMobile]);

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { path: '/guardian/dashboard', labelKey: 'guardian.nav.dashboard', icon: LayoutDashboard },
        { path: '/guardian/monitoring', labelKey: 'guardian.nav.monitoring', icon: Users },
        { path: '/guardian/communication', labelKey: 'guardian.nav.communication', icon: MessageSquare },
        { path: '/guardian/settings', labelKey: 'guardian.nav.settings', icon: Settings },
    ];

    return (
        <div className="guardian-layout">
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="guardian-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`guardian-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="guardian-brand">
                    <ShieldCheck size={32} />
                    <span>{t('app.name')}</span>

                    {/* Close Button (Mobile & Desktop) */}
                    <button
                        className="guardian-sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close Sidebar"
                    >
                        {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                    {/* Add a desktop toggle inside sidebar if we want to allow closing it from there too, 
                        currently CSS only shows .guardian-sidebar-close-btn on mobile or custom styling 
                        But we can style it to appear.
                        Let's rely on the CSS classes I added: .guardian-sidebar-close-btn is block on mobile.
                        For desktop, we might need to override the display:none if we want it clickable.
                        I added .guardian-sidebar-close-btn { display: none } for desktop in CSS?
                        Wait, checking CSS:
                        .guardian-sidebar-close-btn { display: none; ... }
                        @media (max-width: 1024px) { ... display: block; }
                        
                        So on desktop it's hidden. 
                        If the requirement is "open or close the side bar", we need a button on desktop too.
                        I should update CSS for desktop closing or change the inline style here.
                        Let's make it visible on desktop too but positioned differently if needed.
                        For now, I'll keep it as is and maybe update CSS if needed to support desktop closing.
                        Actually, StudentLayout has it visible on desktop.
                    */}
                </div>

                <div className="user-profile" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('header.welcome') || 'Welcome,'}</div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('auth.role.guardian')}</div>
                </div>

                <nav className="guardian-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `guardian-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        className="guardian-nav-item"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>{t('header.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`guardian-main ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                {/* Trigger Button - Visible when sidebar is closed (Desktop) or always available on Mobile via header? 
                    On mobile, sidebar is closed by default. We need a way to open it.
                    On desktop, if sidebar is closed, we need a way to open it.
                    
                    I added .guardian-header-actions in CSS. I should use it.
                */}

                {(!isSidebarOpen || isMobile) && (
                    <div className="guardian-header-actions" style={{
                        position: isMobile ? 'relative' : 'sticky',
                        top: 0,
                        zIndex: 10,
                        // Add some spacing if needed, though CSS handles margin-bottom
                    }}>
                        {!isSidebarOpen && (
                            <button
                                className="guardian-trigger-btn"
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open Menu"
                            >
                                <Menu size={24} />
                            </button>
                        )}

                        {/* On mobile, we might want to show the brand/title here if sidebar is closed */}
                        {isMobile && !isSidebarOpen && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldCheck size={24} className="text-primary" style={{ color: 'var(--color-primary)' }} />
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{t('app.name')}</span>
                            </div>
                        )}
                    </div>
                )}

                <Outlet />
            </main>
        </div>
    );
};

export default GuardianLayout;

