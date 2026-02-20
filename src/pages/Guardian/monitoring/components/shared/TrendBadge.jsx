import React from 'react';

const TREND_CONFIG = {
    up: { icon: '^', label: 'Improving', className: 'trend-badge trend-up' },
    down: { icon: 'v', label: 'Declining', className: 'trend-badge trend-down' },
    stable: { icon: '=', label: 'Stable', className: 'trend-badge trend-stable' },
    neutral: { icon: '-', label: 'N/A', className: 'trend-badge trend-neutral' },
};

const TrendBadge = ({ trend = 'neutral' }) => {
    const config = TREND_CONFIG[trend] || TREND_CONFIG.neutral;

    return (
        <span className={config.className}>
            {config.icon} {config.label}
        </span>
    );
};

export default TrendBadge;
