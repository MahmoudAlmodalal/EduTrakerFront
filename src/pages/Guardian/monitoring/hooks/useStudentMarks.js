import { useQuery } from '@tanstack/react-query';
import guardianService from '../../../../services/guardianService';
import { toList } from '../../../../utils/helpers';

const toNumber = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeMark = (entry = {}) => {
    const score = toNumber(entry?.score ?? entry?.marks_obtained);
    const maxScore = toNumber(entry?.max_score ?? entry?.max_marks ?? entry?.full_mark);
    const assignmentId = toNumber(entry?.assignment_id ?? entry?.assignment?.id ?? entry?.assignment);
    const percentageValue = toNumber(entry?.percentage);
    const computedPercentage =
        Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0
            ? (score / maxScore) * 100
            : null;

    const normalizedScore = score ?? 0;
    const normalizedMax = maxScore ?? 0;
    const normalizedPercentage = percentageValue ?? computedPercentage ?? 0;

    return {
        ...entry,
        assignment_id: assignmentId,
        title: entry?.title || entry?.assignment_title || 'Assessment',
        assignment_title: entry?.assignment_title || entry?.title || 'Assessment',
        course_name: entry?.course_name || entry?.subject_name || entry?.subject || entry?.course?.name || null,
        assessment_type: entry?.assessment_type || entry?.exam_type || entry?.assignment_type || 'Assessment',
        score: normalizedScore,
        max_score: normalizedMax,
        full_mark: toNumber(entry?.full_mark) ?? normalizedMax,
        percentage: normalizedPercentage,
        marks_obtained: normalizedScore,
        max_marks: normalizedMax,
        date_recorded: entry?.date_recorded || entry?.graded_at || entry?.created_at || null,
    };
};

export const useStudentMarks = (studentId) => {
    return useQuery({
        queryKey: ['guardian', 'marks', studentId],
        queryFn: ({ signal }) => guardianService.getStudentMarks(studentId, { signal }),
        enabled: Boolean(studentId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => toList(data).map(normalizeMark),
    });
};

export default useStudentMarks;
