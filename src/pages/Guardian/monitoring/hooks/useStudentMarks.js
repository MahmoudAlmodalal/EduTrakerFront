import { useQuery } from '@tanstack/react-query';
import guardianService from '../../../../services/guardianService';
import { toList } from '../../../../utils/helpers';

export const useStudentMarks = (studentId) => {
    return useQuery({
        queryKey: ['guardian', 'marks', studentId],
        queryFn: ({ signal }) => guardianService.getStudentMarks(studentId, { signal }),
        enabled: Boolean(studentId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => toList(data),
    });
};

export default useStudentMarks;
