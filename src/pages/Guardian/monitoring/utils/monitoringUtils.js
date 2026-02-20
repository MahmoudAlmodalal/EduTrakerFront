export const getInitials = (name = '') => {
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const getGpaColor = (gpa) => {
    const value = Number(gpa);

    if (!Number.isFinite(value)) {
        return '#64748b';
    }

    if (value >= 85) {
        return '#16a34a';
    }

    if (value >= 70) {
        return '#2563eb';
    }

    if (value >= 60) {
        return '#d97706';
    }

    return '#dc2626';
};

export const formatPercentage = (value, digits = 1) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return '--';
    }
    return `${numberValue.toFixed(digits)}%`;
};

export const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};
