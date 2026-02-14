import React, { memo } from 'react';
import { CheckCircle, AlertTriangle, Clock, MinusCircle } from 'lucide-react';

const normalizeStatus = (status = '') => status.toString().trim().toLowerCase();

const getTone = (status) => {
    const value = normalizeStatus(status);

    if (['active', 'present', 'approved', 'completed', 'success'].includes(value)) {
        return 'success';
    }

    if (['pending', 'late', 'warning', 'in_progress'].includes(value)) {
        return 'warning';
    }

    if (['absent', 'inactive', 'rejected', 'failed', 'error', 'suspended'].includes(value)) {
        return 'danger';
    }

    if (['excused', 'info', 'sent'].includes(value)) {
        return 'info';
    }

    return 'neutral';
};

const getLabel = (status) => {
    const value = normalizeStatus(status);
    if (!value) {
        return 'Unknown';
    }

    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getDefaultIcon = (status) => {
    const tone = getTone(status);
    if (tone === 'success') {
        return CheckCircle;
    }

    if (tone === 'warning') {
        return Clock;
    }

    if (tone === 'danger') {
        return AlertTriangle;
    }

    return MinusCircle;
};

const StatusBadge = memo(function StatusBadge({ status, icon: Icon }) {
    const tone = getTone(status);
    const resolvedIcon = Icon || getDefaultIcon(status);

    return (
        <span className={`sec-status-badge sec-status-badge--${tone}`}>
            {resolvedIcon ? React.createElement(resolvedIcon, { size: 14 }) : null}
            {getLabel(status)}
        </span>
    );
});

export default StatusBadge;
