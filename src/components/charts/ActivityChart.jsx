import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './ActivityChart.module.css';

const ActivityChart = ({ data, loading, title, subtitle }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    <p className={styles.tooltipValue}>
                        Logins: <span style={{ color: 'var(--color-primary)' }}>{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleShimmer} />
                    <div className={styles.subtitleShimmer} />
                </div>
                <div className={styles.chartShimmer} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title || 'System Activity'}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="logins"
                            stroke="var(--color-primary)"
                            fillOpacity={1}
                            fill="url(#colorLogins)"
                            strokeWidth={3}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityChart;
