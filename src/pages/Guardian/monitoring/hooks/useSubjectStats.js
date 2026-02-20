import { useMemo } from 'react';

const average = (values) => {
    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
};

const toPercentage = (obtained, max) => {
    const obtainedValue = Number(obtained);
    const maxValue = Number(max);

    if (!Number.isFinite(obtainedValue) || !Number.isFinite(maxValue) || maxValue <= 0) {
        return 0;
    }

    return (obtainedValue / maxValue) * 100;
};

const toTimestamp = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const computeSubjectStats = (marks = []) => {
    const grouped = marks.reduce((accumulator, mark) => {
        const subject = mark?.course_name || 'Unknown Subject';
        if (!accumulator[subject]) {
            accumulator[subject] = [];
        }

        accumulator[subject].push({
            percentage: toPercentage(mark?.marks_obtained, mark?.max_marks),
            date: mark?.date_recorded,
            raw: mark,
        });

        return accumulator;
    }, {});

    Object.values(grouped).forEach((records) => {
        records.sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date));
    });

    return Object.entries(grouped)
        .map(([subject, records]) => {
            const scores = records.map((record) => record.percentage);
            const count = scores.length;

            let trend = 'neutral';
            if (count >= 2) {
                const midpoint = Math.floor(count / 2);
                const firstHalf = average(scores.slice(0, midpoint));
                const secondHalf = average(scores.slice(midpoint));
                const delta = secondHalf - firstHalf;

                if (delta > 5) {
                    trend = 'up';
                } else if (delta < -5) {
                    trend = 'down';
                } else {
                    trend = 'stable';
                }
            }

            return {
                subject,
                average: average(scores),
                best: Math.max(...scores),
                worst: Math.min(...scores),
                last: scores[count - 1],
                totalAssessments: count,
                trend,
                records,
            };
        })
        .sort((left, right) => right.average - left.average);
};

export const useSubjectStats = (marks = []) => {
    return useMemo(() => {
        if (!Array.isArray(marks) || marks.length === 0) {
            return [];
        }

        return computeSubjectStats(marks);
    }, [marks]);
};

export default useSubjectStats;
