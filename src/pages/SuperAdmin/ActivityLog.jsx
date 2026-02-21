import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Clock, User as UserIcon, Activity, FileText, Calendar } from 'lucide-react';
import styles from './ActivityLog.module.css';
import { api } from '../../utils/api';
import Button from '../../components/ui/Button';

const ActivityLog = () => {
    const { t } = useTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ count: 0, total_pages: 1 });

    const fetchLogs = async (currentPage) => {
        setLoading(true);
        try {
            const data = await api.get(`/activity-logs/?page=${currentPage}`);
            setLogs(data.results || []);
            setPagination({
                count: data.count,
                total_pages: data.total_pages
            });
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderActivityDescription = (activity) => {
        const desc = activity.description || '';

        // Handle Export Pattern
        const exportMatch = desc.match(/Exported (.*) report as (.*)/i);
        if (exportMatch) {
            return t('activity.patterns.exportedReport', {
                report: exportMatch[1],
                format: exportMatch[2]
            });
        }

        if (desc.startsWith('Updated user:')) {
            const name = desc.replace('Updated user:', '').trim();
            return t('activity.patterns.updatedUser', { name });
        }
        if (desc.startsWith('Created Workstream Manager:')) {
            const name = desc.replace('Created Workstream Manager:', '').trim();
            return t('activity.patterns.createdWSManager', { name });
        }

        // Handle Login Pattern
        if (desc.toLowerCase().endsWith('logged in')) {
            const email = desc.replace(/User\s+/i, '').replace(/logged in/i, '').trim();
            return t('activity.patterns.loggedIn', { email });
        }

        return activity.description || t(activity.action_type);
    };

    const renderActorName = (actor) => {
        if (actor === 'Super User' || actor === 'الادمن') return t('activity.actor.superUser');
        return actor;
    };

    const renderActionType = (action) => {
        const key = `activity.action.${action?.toLowerCase()}`;
        const translated = t(key);
        return translated === key ? action : translated;
    };

    const renderRelativeTime = (timeStr) => {
        if (!timeStr) return t('dashboard.activity.justNow');

        const hrMinMatch = timeStr.match(/(\d+)\s+hour[s]?,\s+(\d+)\s+minute[s]?\s+ago/i);
        if (hrMinMatch) {
            return t('activity.time.hoursMinutesAgo', { hours: hrMinMatch[1], minutes: hrMinMatch[2] });
        }

        const minMatch = timeStr.match(/(\d+)\s+minute[s]?\s+ago/i);
        if (minMatch) {
            return t('activity.time.minutesAgo', { count: minMatch[1] });
        }

        const hrMatch = timeStr.match(/(\d+)\s+hour[s]?\s+ago/i);
        if (hrMatch) {
            return t('activity.time.hoursAgo', { count: hrMatch[1] });
        }

        return timeStr;
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('activity.title')}</h1>
                <p className={styles.subtitle}>{t('activity.subtitle')}</p>
            </header>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} color="var(--color-primary)" />
                                        {t('activity.table.timestamp')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={16} color="var(--color-primary)" />
                                        {t('activity.table.action')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserIcon size={16} color="var(--color-primary)" />
                                        {t('activity.table.user')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={16} color="var(--color-primary)" />
                                        {t('activity.table.details')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className={styles.loadingPulse}>{t('activity.loading')}</div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className={styles.timestamp}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} opacity={0.6} />
                                                {renderRelativeTime(log.created_at_human)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.actionText}>{renderActionType(log.action_type)}</span>
                                        </td>
                                        <td>
                                            <div className={styles.userCell}>
                                                <UserIcon size={14} className={styles.userIcon} />
                                                {renderActorName(log.actor_name)}
                                            </div>
                                        </td>
                                        <td className={styles.detailsCell}>{renderActivityDescription(log)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                        {t('activity.noLogs')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.total_pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                    <Button
                        variant="outline"
                        size="small"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        {t('users.pagination.previous')}
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                        {t('users.pagination.info', { current: page, total: pagination.total_pages })}
                    </span>
                    <Button
                        variant="outline"
                        size="small"
                        disabled={page === pagination.total_pages}
                        onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                    >
                        {t('users.pagination.next')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;

