import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Clock, User, Activity, FileText, Calendar } from 'lucide-react';
import styles from './ActivityLog.module.css';

const ActivityLog = () => {
    const { t } = useTheme();

    const logs = [
        { id: 1, action: t('mock.log.1.action'), user: 'Admin User', details: t('mock.log.1.details'), time: '2025-12-14 10:30 AM' },
        { id: 2, action: t('mock.log.2.action'), user: 'Super Admin', details: t('mock.log.2.details'), time: '2025-12-14 09:15 AM' },
        { id: 3, action: t('mock.log.3.action'), user: 'Super Admin', details: t('mock.log.3.details'), time: '2025-12-13 04:45 PM' },
        { id: 4, action: t('mock.log.4.action'), user: 'Unknown', details: t('mock.log.4.details'), time: '2025-12-13 02:20 PM' },
        { id: 5, action: 'User Created', user: 'System', details: 'New teacher account created for "John Doe"', time: '2025-12-12 11:05 AM' },
        { id: 6, action: 'Settings Updated', user: 'Super Admin', details: 'System email configuration updated', time: '2025-12-12 09:30 AM' },
    ];

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
                                        <Calendar size={14} />
                                        {t('activity.table.timestamp')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={14} />
                                        {t('activity.table.action')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={14} />
                                        {t('activity.table.user')}
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={14} />
                                        {t('activity.table.details')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className={styles.timestamp}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} style={{ color: 'var(--color-text-light)' }} />
                                            {log.time}
                                        </div>
                                    </td>
                                    <td className={styles.actionText}>{log.action}</td>
                                    <td className={styles.userCell}>
                                        <User size={14} className={styles.userIcon} />
                                        {log.user}
                                    </td>
                                    <td className={styles.detailsCell}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;

