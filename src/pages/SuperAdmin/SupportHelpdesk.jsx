import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import styles from './Dashboard.module.css';
import { api } from '../../utils/api';

const SupportHelpdesk = () => {
    const { t } = useTheme();

    const tickets = [
        { id: 'TKT-001', subject: 'Login Issue at Al-Amal School', priority: 'High', status: 'Open', date: '2025-12-14' },
        { id: 'TKT-002', subject: 'Data Sync Error', priority: 'Medium', status: 'In Progress', date: '2025-12-13' },
        { id: 'TKT-003', subject: 'Feature Request: Bulk Upload', priority: 'Low', status: 'Closed', date: '2025-12-10' },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>{t('support.title')}</h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>{t('support.stats.open')}</span>
                        <div className={`${styles.iconWrapper}`} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>5</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>{t('support.stats.pending')}</span>
                        <div className={`${styles.iconWrapper}`} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>12</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>{t('support.stats.resolved')}</span>
                        <div className={`${styles.iconWrapper}`} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>28</span>
                    </div>
                </div>
            </div>

            <div className={styles.chartCard} style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                <h2 className={styles.cardTitle}>{t('support.recent')}</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-bg-body)', textAlign: 'inherit' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.id')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.subject')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.date')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.priority')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.status')}</th>
                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{t('support.table.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket.id}>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>{ticket.id}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>{ticket.subject}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>{ticket.date}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        background: ticket.priority === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-body)',
                                        color: ticket.priority === 'High' ? 'var(--color-error)' : 'var(--color-text-main)',
                                        border: ticket.priority !== 'High' ? '1px solid var(--color-border)' : 'none'
                                    }}>
                                        {t(`support.priority.${ticket.priority.toLowerCase()}`)}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
                                    {ticket.status}
                                </td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('support.view')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupportHelpdesk;
