import { useMemo } from 'react';

const normalizeStatus = (value) => String(value || '').toLowerCase();

export const useAttendanceStats = (attendance = []) => {
    return useMemo(() => {
        if (!Array.isArray(attendance) || attendance.length === 0) {
            return {
                present: 0,
                absent: 0,
                late: 0,
                total: 0,
                rate: null,
            };
        }

        const present = attendance.filter((entry) => normalizeStatus(entry?.status) === 'present').length;
        const absent = attendance.filter((entry) => normalizeStatus(entry?.status) === 'absent').length;
        const late = attendance.filter((entry) => normalizeStatus(entry?.status) === 'late').length;
        const total = attendance.length;
        const rate = total > 0 ? (present / total) * 100 : null;

        return {
            present,
            absent,
            late,
            total,
            rate,
        };
    }, [attendance]);
};

export default useAttendanceStats;
