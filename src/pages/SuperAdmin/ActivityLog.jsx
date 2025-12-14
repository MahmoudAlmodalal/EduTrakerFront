import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './Dashboard.module.css';

const ActivityLog = () => {
    const { t } = useTheme();

    const logs = [
        { id: 1, action: t('mock.log.1.action'), user: 'Admin User', details: t('mock.log.1.details'), time: '2025-12-14 10:30 AM' },
        { id: 2, action: t('mock.log.2.action'), user: 'Super Admin', details: t('mock.log.2.details'), time: '2025-12-14 09:15 AM' },
        { id: 3, action: t('mock.log.3.action'), user: 'Super Admin', details: t('mock.log.3.details'), time: '2025-12-13 04:45 PM' },
        { id: 4, action: t('mock.log.4.action'), user: 'Unknown', details: t('mock.log.4.details'), time: '2025-12-13 02:20 PM' },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>{t('activity.title')}</h1>

            <div className={styles.chartCard} style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-body)', textAlign: 'inherit' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('activity.table.timestamp')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('activity.table.action')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('activity.table.user')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('activity.table.details')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{log.time}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', fontWeight: '500', color: 'var(--color-text-main)' }}>{log.action}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>{log.user}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivityLog;
