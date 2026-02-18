import React, { memo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { getSecretaryIconColorKey } from '../../../utils/secretaryHelpers';

const StatCard = memo(function StatCard({
    title,
    value,
    icon: Icon,
    color = 'indigo',
    trend,
    trendUp = true,
}) {
    const toneClass = `sec-icon-tone--${getSecretaryIconColorKey(color)}`;

    return (
        <article className="stat-card sec-stat-card">
            <div className="sec-stat-head">
                <p className="sec-stat-title">{title}</p>
                <div className={`sec-stat-icon ${toneClass}`}>
                    {Icon ? <Icon size={20} /> : null}
                </div>
            </div>
            <p className="sec-stat-value">{value}</p>
            {trend ? (
                <div className={`sec-stat-trend ${trendUp ? 'up' : 'down'}`}>
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trend}</span>
                    <span className="sec-stat-trend-label">this month</span>
                </div>
            ) : null}
        </article>
    );
});

export default StatCard;
