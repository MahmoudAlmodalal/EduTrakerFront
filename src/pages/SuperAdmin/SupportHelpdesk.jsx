import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Plus, Search, Filter, X } from 'lucide-react';
import styles from './Dashboard.module.css'; // Reusing some dashboard styles but we might need more
import { api } from '../../utils/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const SupportHelpdesk = () => {
    const { t } = useTheme();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        closed_tickets: 0,
        high_priority_tickets: 0
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });

    const fetchStats = async () => {
        try {
            const data = await api.get('/custom-admin/support-tickets/stats/');
            setStats(data);
        } catch (err) {
            console.error('Error fetching ticket stats:', err);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await api.get('/custom-admin/support-tickets/');
            setTickets(data.results || data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchTickets();
    }, []);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await api.post('/custom-admin/support-tickets/', newTicket);
            setIsModalOpen(false);
            setNewTicket({ subject: '', description: '', priority: 'medium' });
            fetchTickets();
            fetchStats();
        } catch (err) {
            alert('Failed to create ticket: ' + err.message);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            await api.patch(`/custom-admin/support-tickets/${ticketId}/`, { status: newStatus });
            fetchTickets();
            fetchStats();
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className={styles.pageTitle}>{t('support.title')}</h1>
                <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>{t('support.newTicket')}</Button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>{t('support.stats.open')}</span>
                        <div className={`${styles.iconWrapper}`} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className={styles.statBody}>
                        <span className={styles.statValue}>{stats.open_tickets}</span>
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
                        <span className={styles.statValue}>{stats.in_progress_tickets}</span>
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
                        <span className={styles.statValue}>{stats.closed_tickets}</span>
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
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>{t('support.loading')}</td></tr>
                        ) : tickets.length > 0 ? (
                            tickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>{ticket.ticket_id}</td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{ticket.subject}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>from {ticket.created_by_name}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            background: ticket.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-body)',
                                            color: ticket.priority === 'high' ? 'var(--color-error)' : 'var(--color-text-main)',
                                            border: ticket.priority !== 'high' ? '1px solid var(--color-border)' : 'none'
                                        }}>
                                            {t(`support.priority.${ticket.priority}`).toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent' }}
                                        >
                                            <option value="open">{t('support.status.open')}</option>
                                            <option value="in_progress">{t('support.status.inProgress')}</option>
                                            <option value="closed">{t('support.status.closed')}</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('support.view')}</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>{t('support.noTickets')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('support.modal.createTitle')}>
                <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>{t('support.form.subject')}</label>
                        <input
                            type="text"
                            required
                            placeholder={t('support.form.subjectPlaceholder')}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>{t('support.form.description')}</label>
                        <textarea
                            required
                            placeholder={t('support.form.descriptionPlaceholder')}
                            rows={4}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            value={newTicket.description}
                            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>{t('support.form.priority')}</label>
                        <select
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            value={newTicket.priority}
                            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        >
                            <option value="low">{t('support.priority.low')}</option>
                            <option value="medium">{t('support.priority.medium')}</option>
                            <option value="high">{t('support.priority.high')}</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">{t('common.cancel')}</Button>
                        <Button variant="primary" type="submit">{t('support.createTicket')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SupportHelpdesk;
