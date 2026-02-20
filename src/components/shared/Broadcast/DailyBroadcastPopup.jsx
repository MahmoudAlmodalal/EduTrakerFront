import React, { useEffect, useMemo, useState } from 'react';
import { Megaphone, X, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import broadcastService from '../../../services/broadcastService';
import styles from './DailyBroadcastPopup.module.css';

const AUTH_ROUTE_PREFIXES = ['/login', '/register', '/password-reset', '/unauthorized'];

const isAuthRoute = (pathname = '') => {
    if (pathname === '/') {
        return true;
    }
    return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const DailyBroadcastPopup = () => {
    const { user } = useAuth();
    const { t } = useTheme();
    const location = useLocation();
    const [broadcasts, setBroadcasts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const sessionKey = useMemo(() => {
        if (!user?.id) {
            return null;
        }
        const accessToken = localStorage.getItem('accessToken') || 'no-token';
        return `daily_broadcast_seen_${user.id}_${accessToken}`;
    }, [user?.id]);

    useEffect(() => {
        let ignore = false;

        const loadDailyBroadcasts = async () => {
            if (!user?.id || isAuthRoute(location.pathname) || !sessionKey) {
                return;
            }
            if (sessionStorage.getItem(sessionKey) === '1') {
                return;
            }

            setIsLoading(true);
            try {
                const response = await broadcastService.getTodayBroadcasts();
                if (ignore) {
                    return;
                }
                const list = response?.results || response || [];
                if (Array.isArray(list) && list.length > 0) {
                    setBroadcasts(list);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Failed to load daily broadcasts:', error);
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        loadDailyBroadcasts();

        return () => {
            ignore = true;
        };
    }, [location.pathname, sessionKey, user?.id]);

    const handleClose = () => {
        if (sessionKey) {
            sessionStorage.setItem(sessionKey, '1');
        }
        setIsOpen(false);
    };

    if (!isOpen || broadcasts.length === 0 || isLoading) {
        return null;
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Daily broadcast">
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        <div className={styles.iconWrap}>
                            <Megaphone size={18} />
                        </div>
                        <div>
                            <h3 className={styles.title}>{t('broadcast.title') || 'System Broadcast'}</h3>
                            <p className={styles.subtitle}>
                                {t('broadcast.subtitle') || 'Published today. Read before continuing.'}
                            </p>
                        </div>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.body}>
                    {broadcasts.map((broadcast) => (
                        <article key={broadcast.id} className={styles.card}>
                            <h4 className={styles.subject}>{broadcast.subject || (t('communication.noSubject') || '(No Subject)')}</h4>
                            <p className={styles.message}>{broadcast.body}</p>
                            <div className={styles.meta}>
                                <span className={styles.metaSource}>
                                    <ShieldCheck size={14} />
                                    {broadcast.source_label || (t('broadcast.defaultSource') || 'System')}
                                </span>
                                <span className={styles.metaTime}>
                                    {new Date(broadcast.published_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button type="button" className={styles.actionBtn} onClick={handleClose}>
                        {t('broadcast.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyBroadcastPopup;
