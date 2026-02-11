import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const SECRETARY_ICON_STYLES = {
    indigo: { background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5' },
    green: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' },
    amber: { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706' },
    rose: { background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', color: '#e11d48' },
    purple: { background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#7c3aed' },
    blue: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb' },
};

const ATTENDANCE_STATUS_STYLES = {
    present: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' },
    absent: { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#dc2626' },
    late: { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706' },
    excused: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb' },
};

const ATTENDANCE_STATUS_ICONS = {
    present: CheckCircle,
    absent: XCircle,
    late: Clock,
    excused: AlertCircle,
};

export const getSecretaryIconStyle = (color) => {
    return SECRETARY_ICON_STYLES[color] || SECRETARY_ICON_STYLES.indigo;
};

export const getAttendanceStatusStyle = (status) => {
    return ATTENDANCE_STATUS_STYLES[status] || { background: 'var(--sec-border)', color: 'var(--sec-text-muted)' };
};

export const getAttendanceStatusIcon = (status) => {
    return ATTENDANCE_STATUS_ICONS[status] || null;
};
