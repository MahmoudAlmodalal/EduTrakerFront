import { useQuery } from '@tanstack/react-query';
import guardianService from '../../../../services/guardianService';
import { toList } from '../../../../utils/helpers';

export const useStudentAttendance = (studentId, options = {}) => {
    const { enabled = true, ...queryOptions } = options;

    return useQuery({
        queryKey: ['guardian', 'attendance', studentId],
        queryFn: ({ signal }) => guardianService.getStudentAttendance(studentId, { signal }),
        enabled: Boolean(studentId) && enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        ...queryOptions,
        select: (data) => toList(data),
    });
};

export default useStudentAttendance;
