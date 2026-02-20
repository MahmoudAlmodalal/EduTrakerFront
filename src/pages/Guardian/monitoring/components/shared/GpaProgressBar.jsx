import React from 'react';
import { formatPercentage } from '../../utils/monitoringUtils';

const GpaProgressBar = ({ value, color, showLabel = true }) => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) : 0;

    return (
        <div className="gpa-progress-container">
            <div className="gpa-progress-bar" role="presentation">
                <div
                    className="gpa-progress-fill"
                    style={{
                        width: `${safeValue}%`,
                        background: color,
                    }}
                />
            </div>
            {showLabel && (
                <div className="gpa-progress-label">{formatPercentage(safeValue)}</div>
            )}
        </div>
    );
};

export default GpaProgressBar;
