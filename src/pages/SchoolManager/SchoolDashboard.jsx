import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    Clock,
    TrendingUp,
    Calendar,
    AlertCircle,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    UserCheck,
    Briefcase
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const SchoolDashboard = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await managerService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const dashboardCards = [
        { title: 'Total Students', value: stats?.statistics?.total_students || '0', icon: Users, trend: '+0%', isUp: true, color: 'blue' },
        { title: 'Active Teachers', value: stats?.statistics?.total_teachers || '0', icon: UserCheck, trend: '+0%', isUp: true, color: 'green' },
        { title: 'Secretaries', value: stats?.statistics?.total_secretaries || '0', icon: Briefcase, trend: '0%', isUp: true, color: 'purple' },
        { title: 'Classrooms', value: stats?.statistics?.classroom_count || '0', icon: GraduationCap, trend: '0%', isUp: true, color: 'orange' }
    ];

    if (loading) return <div className="school-dashboard-page">Loading...</div>;

    return (
        <div className="school-dashboard-page">
            <div className="school-manager-header">
                <div>
                    <h1 className="school-manager-title">{t('school.dashboard.title') || 'Command Center'}</h1>
                    <p className="school-manager-subtitle">Real-time overview of school operations and academic status.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Calendar size={18} />
                        Academic Year: 2024-2025
                    </button>
                    <button className="btn-primary">Generate Report</button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                {dashboardCards.map((card, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header">
                            <div className={`stat-icon-wrapper color-${card.color}`} style={{
                                backgroundColor: `var(--color-${card.color}-light)`,
                                color: `var(--color-${card.color})`,
                                padding: '10px',
                                borderRadius: '12px'
                            }}>
                                <card.icon size={24} />
                            </div>
                            <span className={`stat-trend ${card.isUp ? 'trend-up' : 'trend-down'}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: card.isUp ? 'var(--color-success)' : 'var(--color-error)'
                            }}>
                                {card.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {card.trend}
                            </span>
                        </div>
                        <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '1rem', color: 'var(--color-text-main)' }}>{card.value}</div>
                        <div className="stat-label" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{card.title}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Performance Chart Placeholder */}
                <div className="management-card">
                    <div className="table-header-actions">
                        <h3 className="chart-title">Academic Performance Trend</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', cursor: 'pointer' }}>Weekly</button>
                            <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>Monthly</button>
                        </div>
                    </div>
                    <div style={{ padding: '1.5rem', height: '350px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        {[45, 52, 48, 61, 58, 72, 68, 81, 75, 84, 79, 88].map((val, i) => (
                            <div key={i} style={{ width: '6%', height: `${val}%`, backgroundColor: 'var(--color-primary)', borderRadius: '4px 4px 0 0', opacity: 0.8, position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', fontSize: '10px', color: 'var(--color-text-muted)' }}>M{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications/Alerts Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="management-card">
                        <div className="table-header-actions">
                            <h3 className="chart-title">Attention Needed</h3>
                        </div>
                        <div style={{ padding: '0' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-error-light)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0, color: 'var(--color-text-main)' }}>Teacher Certification Expiring</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>3 teachers need to renew credentials within 30 days.</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
                                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0, color: 'var(--color-text-main)' }}>Unsubmitted Grade Reports</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>Grade submission deadline is in 48 hours for Q2.</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                            <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}>
                                View All Alerts
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="management-card" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>System Health</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>98%</span>
                                </div>
                                <p style={{ fontSize: '0.875rem', opacity: 0.9, lineHeight: '1.4' }}>All services are running smoothly within optimal parameters.</p>
                            </div>
                            <button style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>System Monitor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;
