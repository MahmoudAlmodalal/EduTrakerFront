import { useQuery } from '@tanstack/react-query';
import guardianService from '../../../../services/guardianService';
import { toList } from '../../../../utils/helpers';

export const useStudentAssessments = (studentId) => {
    return useQuery({
        queryKey: ['guardian', 'assessments', studentId],
        queryFn: ({ signal }) => guardianService.getStudentAssessments(studentId, { signal }),
        enabled: Boolean(studentId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => toList(data),
    });
};

export default useStudentAssessments;
