import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import teacherService from '../services/teacherService';
import notificationService from '../services/notificationService';
import { toList, uniqueById, todayIsoDate } from '../utils/helpers';

export const teacherQueryKeys = {
    dashboardStats: ['teacher', 'dashboard-stats'],
    schedule: (date) => ['teacher', 'schedule', date],
    allocations: (date) => ['teacher', 'allocations', date],
    notifications: (params = {}) => ['teacher', 'notifications', params],
    students: (filters = {}) => ['teacher', 'students', filters],
    attendance: (allocationId, date) => ['teacher', 'attendance', allocationId, date],
    homeroomAttendance: (date) => ['teacher', 'homeroom-attendance', date],
    assignments: (filters = {}) => ['teacher', 'assignments', filters],
    assignmentDetail: (assignmentId) => ['teacher', 'assignment', assignmentId],
    assignmentSubmissions: (assignmentId) => ['teacher', 'assignment-submissions', assignmentId],
    marks: (assignmentId) => ['teacher', 'marks', assignmentId],
    lessonPlans: (filters = {}) => ['teacher', 'lesson-plans', filters],
    learningMaterials: (filters = {}) => ['teacher', 'learning-materials', filters],
    profile: (userId) => ['teacher', 'profile', userId],
    schoolContext: ['teacher', 'school-context'],
    messages: (params = {}) => ['teacher', 'messages', params],
    messageThread: (threadId) => ['teacher', 'message-thread', threadId],
    communicationUsers: (params = {}) => ['teacher', 'communication-users', params],
    knowledgeGaps: (allocationId, threshold = 50.0) => ['teacher', 'knowledge-gaps', allocationId, threshold]
};

const mapListData = (data, updater) => {
    const current = toList(data);
    const updated = updater(current);

    if (Array.isArray(data)) {
        return updated;
    }

    if (data && typeof data === 'object') {
        return {
            ...data,
            results: updated
        };
    }

    return { results: updated };
};

export const useTeacherDashboardStats = () =>
    useQuery({
        queryKey: teacherQueryKeys.dashboardStats,
        queryFn: () => teacherService.getDashboardStats()
    });

export const useTeacherSchedule = (date = todayIsoDate(), options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.schedule(date),
        queryFn: () => teacherService.getSchedule(date),
        staleTime: 5 * 60 * 1000,
        ...options
    });

export const useTeacherAllocations = (date = todayIsoDate(), options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.allocations(date),
        queryFn: () => teacherService.getCourseAllocations(date),
        select: (data) => uniqueById(data),
        staleTime: 5 * 60 * 1000,
        ...options
    });

export const useTeacherNotifications = (params = { page_size: 5 }, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.notifications(params),
        queryFn: () => notificationService.getNotifications(params),
        ...options
    });

export const useMarkAllTeacherNotificationsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['teacher', 'notifications'] });
            const previousEntries = queryClient.getQueriesData({ queryKey: ['teacher', 'notifications'] });

            previousEntries.forEach(([key, value]) => {
                queryClient.setQueryData(key, mapListData(value, (list) => (
                    list.map((item) => ({ ...item, is_read: true }))
                )));
            });

            return { previousEntries };
        },
        onError: (_error, _variables, context) => {
            if (!context?.previousEntries) {
                return;
            }

            context.previousEntries.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'notifications'] });
        }
    });
};

export const useMarkTeacherNotificationRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId) => notificationService.markAsRead(notificationId),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ['teacher', 'notifications'] });
            const previousEntries = queryClient.getQueriesData({ queryKey: ['teacher', 'notifications'] });

            previousEntries.forEach(([key, value]) => {
                queryClient.setQueryData(key, mapListData(value, (list) => (
                    list.map((item) => (
                        item.id === notificationId ? { ...item, is_read: true } : item
                    ))
                )));
            });

            return { previousEntries };
        },
        onError: (_error, _variables, context) => {
            if (!context?.previousEntries) {
                return;
            }

            context.previousEntries.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'notifications'] });
        }
    });
};

export const useTeacherStudents = (filters = {}, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.students(filters),
        queryFn: () => teacherService.getStudents(filters),
        ...options
    });

export const useTeacherAttendance = (allocationId, date, options = {}) => {
    const normalizedAllocationId = allocationId ? Number(allocationId) : allocationId;

    return useQuery({
        queryKey: teacherQueryKeys.attendance(normalizedAllocationId, date),
        queryFn: () => teacherService.getAttendance({
            course_allocation_id: normalizedAllocationId,
            date_from: date,
            date_to: date
        }),
        enabled: Boolean(normalizedAllocationId && date) && (options.enabled ?? true),
        ...options
    });
};

export const useHomeroomAttendanceSummary = (date, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.homeroomAttendance(date),
        queryFn: () => teacherService.getHomeroomAttendanceSummary(date),
        enabled: Boolean(date) && (options.enabled ?? true),
        staleTime: 2 * 60 * 1000,
        ...options
    });

export const useRecordBulkAttendanceMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (records) => teacherService.recordBulkAttendance(records),
        onSuccess: (_result, records = []) => {
            const firstRecord = records[0];
            if (firstRecord?.course_allocation_id && firstRecord?.date) {
                queryClient.invalidateQueries({
                    queryKey: teacherQueryKeys.attendance(firstRecord.course_allocation_id, firstRecord.date)
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['teacher', 'attendance'] });
            }

            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
            queryClient.invalidateQueries({ queryKey: ['teacher', 'students'] });
        }
    });
};

export const useTeacherAssignments = (filters = {}, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.assignments(filters),
        queryFn: () => teacherService.getAssignments(filters),
        ...options
    });

export const useTeacherAssignmentDetail = (assignmentId, options = {}) => {
    const normalizedAssignmentId = assignmentId ? Number(assignmentId) : assignmentId;

    return useQuery({
        queryKey: teacherQueryKeys.assignmentDetail(normalizedAssignmentId),
        queryFn: () => teacherService.getAssignmentDetail(normalizedAssignmentId),
        enabled: Boolean(normalizedAssignmentId) && (options.enabled ?? true),
        ...options
    });
};

export const useTeacherAssignmentSubmissions = (assignmentId, options = {}) => {
    const normalizedAssignmentId = assignmentId ? Number(assignmentId) : assignmentId;

    return useQuery({
        queryKey: teacherQueryKeys.assignmentSubmissions(normalizedAssignmentId),
        queryFn: () => teacherService.getAssignmentSubmissions(normalizedAssignmentId),
        enabled: Boolean(normalizedAssignmentId) && (options.enabled ?? true),
        ...options
    });
};

export const useTeacherMarks = (assignmentId, options = {}) => {
    const normalizedAssignmentId = assignmentId ? Number(assignmentId) : assignmentId;

    return useQuery({
        queryKey: teacherQueryKeys.marks(normalizedAssignmentId),
        queryFn: () => teacherService.getMarks({ assignment_id: normalizedAssignmentId }),
        enabled: Boolean(normalizedAssignmentId) && (options.enabled ?? true),
        ...options
    });
};

export const useCreateTeacherAssignmentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.createAssignment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
        }
    });
};

export const useUpdateTeacherAssignmentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }) => teacherService.updateAssignment(id, payload),
        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentDetail(Number(variables.id)) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
        }
    });
};

export const usePublishAssignmentGradesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assignmentId, is_grades_published }) => (
            teacherService.publishAssignmentGrades(assignmentId, is_grades_published)
        ),
        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentDetail(Number(variables.assignmentId)) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentSubmissions(Number(variables.assignmentId)) });
            queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
        }
    });
};

export const useGradeAssignmentSubmissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assignmentId, submissionId, payload }) => (
            teacherService.gradeAssignmentSubmission(assignmentId, submissionId, payload)
        ),
        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentSubmissions(Number(variables.assignmentId)) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.marks(Number(variables.assignmentId)) });
        }
    });
};

export const useDeactivateTeacherAssignmentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (assignmentId) => teacherService.deleteAssignment(assignmentId),
        onSuccess: (_response, assignmentId) => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentDetail(Number(assignmentId)) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
        }
    });
};

export const useActivateTeacherAssignmentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (assignmentId) => teacherService.activateAssignment(assignmentId),
        onSuccess: (_response, assignmentId) => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.assignmentDetail(Number(assignmentId)) });
        }
    });
};

export const useRecordTeacherMarkMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.recordMark(payload),
        onSuccess: (_response, payload) => {
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.marks(payload.assignment_id) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
        }
    });
};

export const useBulkImportTeacherMarksMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.bulkImportMarks(payload),
        onSuccess: (_response, payload) => {
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.marks(payload.assignment_id) });
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.dashboardStats });
        }
    });
};

export const useTeacherLessonPlans = (filters = {}, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.lessonPlans(filters),
        queryFn: () => teacherService.getLessonPlans(filters),
        ...options
    });

export const useTeacherLearningMaterials = (filters = {}, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.learningMaterials(filters),
        queryFn: () => teacherService.getLearningMaterials(filters),
        ...options
    });

export const useCreateLessonPlanMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.createLessonPlan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'lesson-plans'] });
        }
    });
};

export const useUpdateLessonPlanMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }) => teacherService.updateLessonPlan(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'lesson-plans'] });
        }
    });
};

export const useDeleteLessonPlanMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => teacherService.deleteLessonPlan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'lesson-plans'] });
        }
    });
};

export const useCreateLearningMaterialMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.createLearningMaterial(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'learning-materials'] });
            queryClient.refetchQueries({ queryKey: ['teacher', 'learning-materials'] });
        }
    });
};

export const useUpdateLearningMaterialMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }) => teacherService.updateLearningMaterial(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'learning-materials'] });
            queryClient.refetchQueries({ queryKey: ['teacher', 'learning-materials'] });
        }
    });
};

export const usePublishLearningMaterialMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => teacherService.publishLearningMaterial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'learning-materials'] });
            queryClient.refetchQueries({ queryKey: ['teacher', 'learning-materials'] });
        }
    });
};

export const useUnpublishLearningMaterialMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => teacherService.unpublishLearningMaterial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'learning-materials'] });
            queryClient.refetchQueries({ queryKey: ['teacher', 'learning-materials'] });
        }
    });
};

export const useDeleteLearningMaterialMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => teacherService.deleteLearningMaterial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'learning-materials'] });
            queryClient.refetchQueries({ queryKey: ['teacher', 'learning-materials'] });
        }
    });
};

export const useTeacherMessages = (params = {}, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.messages(params),
        queryFn: () => teacherService.getMessages(params),
        ...options
    });

export const useTeacherMessageThread = (threadId, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.messageThread(threadId),
        queryFn: () => teacherService.getThread(threadId),
        enabled: Boolean(threadId) && (options.enabled ?? true),
        ...options
    });

export const useSendTeacherMessageMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => teacherService.sendMessage(payload),
        onSuccess: (_response, payload) => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'messages'] });
            if (payload?.thread_id) {
                queryClient.invalidateQueries({
                    queryKey: teacherQueryKeys.messageThread(payload.thread_id)
                });
            }
            queryClient.invalidateQueries({ queryKey: ['teacher', 'notifications'] });
        }
    });
};

export const useSearchCommunicationUsers = ({ query = '', category = 'all' } = {}, options = {}) => {
    const hasSearchText = Boolean(query && query.trim());
    const hasCategoryScope = category !== 'all';

    return useQuery({
        queryKey: teacherQueryKeys.communicationUsers({ query, category }),
        queryFn: () => teacherService.searchUsers({ query, category }),
        enabled: (hasSearchText || hasCategoryScope) && (options.enabled ?? true),
        staleTime: 2 * 60 * 1000,
        ...options
    });
};

export const useMarkTeacherMessageReadMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (messageId) => teacherService.markMessageRead(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'messages'] });
            queryClient.invalidateQueries({ queryKey: ['teacher', 'message-thread'] });
        }
    });
};

export const useTeacherProfile = (userId, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.profile(userId),
        queryFn: () => teacherService.getProfile(userId),
        enabled: Boolean(userId) && (options.enabled ?? true),
        ...options
    });

export const useTeacherSchoolContext = (options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.schoolContext,
        queryFn: () => teacherService.getSchoolContext(),
        staleTime: 5 * 60 * 1000,
        ...options
    });

export const useUpdateTeacherProfileMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, payload }) => teacherService.updateProfile(userId, payload),
        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: teacherQueryKeys.profile(variables.userId) });
        }
    });
};

export const useTeacherKnowledgeGaps = (allocationId, threshold = 50.0, options = {}) =>
    useQuery({
        queryKey: teacherQueryKeys.knowledgeGaps(allocationId, threshold),
        queryFn: () => teacherService.getKnowledgeGaps(allocationId, threshold),
        enabled: Boolean(allocationId) && (options.enabled ?? true),
        ...options
    });
