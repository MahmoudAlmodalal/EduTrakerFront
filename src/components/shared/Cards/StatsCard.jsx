import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';
import './StatsCard.css';

/**
 * Dynamic icon component
 */
const DynamicIcon = ({ name, size = 24, ...props }) => {
    if (!name) return null;

    // Handle both string icon names and component references
    if (typeof name === 'function') {
        const IconComponent = name;
        return <IconComponent size={size} {...props} />;
    }

    const IconComponent = Icons[name];
    if (!IconComponent) return null;
    return <IconComponent size={size} {...props} />;
};

/**
 * Unified Statistics Card Component
 * Used across all role dashboards for consistent metrics display
 * 
 * @param {string} title - Card title/label
 * @param {string|number} value - Main value to display
 * @param {number} change - Percentage change (positive or negative)
 * @param {string|Component} icon - Icon name or component
 * @param {string} color - Color variant (primary, success, warning, danger, info)
 * @param {string} trend - Trend direction ('up', 'down', 'neutral')
 * @param {boolean} loading - Show skeleton loading state
 * @param {string} subtitle - Optional subtitle text
 * @param {function} onClick - Optional click handler
 */
const StatsCard = ({
    title,
    value,
    change,
    icon,
    color = 'primary',
    trend,
    loading = false,
    subtitle,
    onClick,
    className = ''
}) => {
    // Determine trend from change if not explicitly set
    const actualTrend = trend || (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
    const isPositive = actualTrend === 'up';
    const isNegative = actualTrend === 'down';

    // Render the appropriate trend icon
    const renderTrendIcon = () => {
        switch (actualTrend) {
            case 'up': return <TrendingUp size={14} />;
            case 'down': return <TrendingDown size={14} />;
            default: return <Minus size={14} />;
        }
    };

    if (loading) {
        return (
            <div className={`stats-card stats-card--${color} stats-card--loading ${className}`}>
                <div className="stats-card__skeleton stats-card__skeleton--icon" />
                <div className="stats-card__content">
                    <div className="stats-card__skeleton stats-card__skeleton--title" />
                    <div className="stats-card__skeleton stats-card__skeleton--value" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`stats-card stats-card--${color} ${onClick ? 'stats-card--clickable' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* Icon Container */}
            <div className="stats-card__icon-container">
                <DynamicIcon name={icon} size={24} />
            </div>

            {/* Content */}
            <div className="stats-card__content">
                <p className="stats-card__title">{title}</p>
                <p className="stats-card__value">{value}</p>

                {/* Subtitle or Change Indicator */}
                {(subtitle || change !== undefined) && (
                    <div className="stats-card__footer">
                        {change !== undefined ? (
                            <span className={`stats-card__change ${isPositive ? 'stats-card__change--positive' : ''} ${isNegative ? 'stats-card__change--negative' : ''}`}>
                                {renderTrendIcon()}
                                <span>{Math.abs(change)}%</span>
                            </span>
                        ) : subtitle ? (
                            <span className="stats-card__subtitle">{subtitle}</span>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Stats Card Grid Container
 * Responsive grid for displaying multiple stats cards
 */
const StatsCardGrid = ({ children, columns = 4, className = '' }) => {
    return (
        <div
            className={`stats-card-grid stats-card-grid--cols-${columns} ${className}`}
        >
            {children}
        </div>
    );
};

export { StatsCard, StatsCardGrid };
export default StatsCard;
