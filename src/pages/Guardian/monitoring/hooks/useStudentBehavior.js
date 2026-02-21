import { useQuery } from '@tanstack/react-query';
import guardianService from '../../../../services/guardianService';
import { toList } from '../../../../utils/helpers';

const normalizeBehaviorEntry = (entry = {}) => {
    const type = String(entry?.type || entry?.behavior_type || '').toLowerCase();

    return {
        ...entry,
        type: type || 'negative',
        behavior_type: type || entry?.behavior_type || 'negative',
        date: entry?.date_recorded || entry?.date || null,
        comment: entry?.message || entry?.comment || '',
    };
};

export const useStudentBehavior = (studentId, options = {}) => {
    const { enabled = true, autoRefresh = true, ...queryOptions } = options;

    return useQuery({
        queryKey: ['guardian', 'behavior', studentId],
        queryFn: ({ signal }) => guardianService.getStudentBehavior(studentId, { signal }),
        enabled: Boolean(studentId) && enabled,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchInterval: autoRefresh ? 15000 : false,
        refetchIntervalInBackground: false,
        ...queryOptions,
        select: (data) => toList(data).map(normalizeBehaviorEntry),
    });
};

export default useStudentBehavior;
