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

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('activity.title')}</h1>
                <p className={styles.subtitle}>Monitor all administrative actions and system events</p>
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
                                        <div className={styles.loadingPulse}>Fetching system logs...</div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className={styles.timestamp}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} opacity={0.6} />
                                                {log.created_at_human}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.actionText}>{log.action_type}</span>
                                        </td>
                                        <td>
                                            <div className={styles.userCell}>
                                                <UserIcon size={14} className={styles.userIcon} />
                                                {log.actor_name}
                                            </div>
                                        </td>
                                        <td className={styles.detailsCell}>{log.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                        No activity logs found.
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
                        Previous
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                        Page {page} of {pagination.total_pages}
                    </span>
                    <Button
                        variant="outline"
                        size="small"
                        disabled={page === pagination.total_pages}
                        onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;

