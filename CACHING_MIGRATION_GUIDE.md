# EduTracker Session Caching - Migration Guide

## Overview
This guide shows how to migrate existing components from traditional API calls to the new cached API system. The session cache stores API responses for 30 minutes, preventing unnecessary refetches on page refresh.

---

## Quick Start

### 1. Import the Hook
```javascript
import { useCachedApi, useCachedMutation } from '../hooks/useCachedApi';
```

### 2. Replace Traditional API Calls

**Before (Traditional Pattern):**
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await studentService.getDashboardStats();
            setData(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);
```

**After (With Caching):**
```javascript
const { data, loading, error, refetch } = useCachedApi(
    () => studentService.getDashboardStats()
);
```

---

## Complete Examples

### Example 1: Simple Dashboard (No Parameters)

**Component: SuperAdmin Dashboard**

**Before:**
```javascript
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import notificationService from '../../services/notificationService';

const Dashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, unreadRes] = await Promise.all([
                    reportService.getDashboardStats(),
                    notificationService.getUnreadCount()
                ]);

                setStatsData(statsRes.statistics || {});
                setUnreadNotifications(unreadRes.unread_count || 0);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Rest of component...
};
```

**After:**
```javascript
import React from 'react';
import { useCachedApi } from '../../hooks/useCachedApi';
import reportService from '../../services/reportService';
import notificationService from '../../services/notificationService';

const Dashboard = () => {
    // Fetch stats with caching
    const {
        data: statsData,
        loading: statsLoading,
        error: statsError
    } = useCachedApi(
        () => reportService.getDashboardStats(),
        { cacheKey: 'admin_dashboard_stats' }
    );

    // Fetch unread notifications with caching
    const {
        data: unreadData,
        loading: unreadLoading
    } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            cacheKey: 'admin_unread_notifications',
            ttl: 5 * 60 * 1000 // 5 minutes for notifications
        }
    );

    const loading = statsLoading || unreadLoading;
    const unreadNotifications = unreadData?.unread_count || 0;

    // Rest of component...
};
```

---

### Example 2: With Parameters (Teacher Assignments)

**Before:**
```javascript
const TeacherAssignments = ({ classId }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const response = await teacherService.getAssignments({
                    class_id: classId
                });
                setAssignments(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [classId]);

    // Rest of component...
};
```

**After:**
```javascript
import { useCachedApi } from '../../hooks/useCachedApi';

const TeacherAssignments = ({ classId }) => {
    const { data: assignments, loading, error, refetch } = useCachedApi(
        () => teacherService.getAssignments({ class_id: classId }),
        {
            dependencies: [classId], // Re-fetch when classId changes
            cacheKey: `teacher_assignments_${classId}` // Unique cache per class
        }
    );

    // Rest of component...
};
```

---

### Example 3: Mutations with Cache Invalidation

**Use Case:** Creating a new assignment should refresh the assignments list.

```javascript
import { useCachedApi, useCachedMutation } from '../../hooks/useCachedApi';

const CreateAssignment = ({ classId }) => {
    // Fetch assignments list (cached)
    const {
        data: assignments,
        loading,
        refetch
    } = useCachedApi(
        () => teacherService.getAssignments({ class_id: classId }),
        {
            dependencies: [classId],
            cacheKey: `teacher_assignments_${classId}`
        }
    );

    // Create assignment mutation
    const {
        mutate: createAssignment,
        loading: creating
    } = useCachedMutation(
        (data) => teacherService.createAssignment(data),
        {
            // Invalidate all assignment caches after creation
            invalidateKeys: ['teacher_assignments_*'],
            onSuccess: () => {
                console.log('Assignment created!');
                refetch(); // Manually refetch if needed
            }
        }
    );

    const handleSubmit = async (formData) => {
        await createAssignment({
            ...formData,
            class_id: classId
        });
    };

    return (
        <div>
            {/* Form UI */}
            <button onClick={handleSubmit} disabled={creating}>
                {creating ? 'Creating...' : 'Create Assignment'}
            </button>
        </div>
    );
};
```

---

### Example 4: Conditional Fetching

**Use Case:** Only fetch data when a certain condition is met.

```javascript
const StudentMarks = ({ studentId, semesterId }) => {
    const { data, loading, error } = useCachedApi(
        () => studentService.getMarks(studentId, semesterId),
        {
            enabled: !!studentId && !!semesterId, // Only fetch if both exist
            dependencies: [studentId, semesterId],
            cacheKey: `student_marks_${studentId}_${semesterId}`
        }
    );

    if (!studentId || !semesterId) {
        return <div>Please select a student and semester</div>;
    }

    // Rest of component...
};
```

---

### Example 5: Force Refresh / Skip Cache

**Use Case:** Always fetch fresh data (e.g., live data, critical updates).

```javascript
const LiveAttendance = () => {
    const { data, loading, refetch } = useCachedApi(
        () => teacherService.getTodayAttendance(),
        {
            skipCache: true, // Always fetch fresh
            cacheKey: 'live_attendance'
        }
    );

    // Manual refresh button
    return (
        <div>
            <button onClick={refetch}>Refresh</button>
            {/* Display attendance */}
        </div>
    );
};
```

---

## API Reference

### `useCachedApi(apiFunction, options)`

Fetches data with automatic caching.

**Parameters:**
- `apiFunction` (Function): The API service function to call
- `options` (Object):
  - `cacheKey` (string): Custom cache key (auto-generated if not provided)
  - `ttl` (number): Time to live in milliseconds (default: 30 minutes)
  - `enabled` (boolean): Whether to execute the API call (default: true)
  - `dependencies` (Array): Dependencies array for re-fetching
  - `skipCache` (boolean): Skip cache and always fetch fresh (default: false)

**Returns:**
- `data`: The cached or fetched data
- `loading`: Loading state (true during initial fetch)
- `error`: Error message if fetch fails
- `refetch`: Function to manually refetch data (bypasses cache)
- `invalidateCache`: Function to clear cache for this endpoint

---

### `useCachedMutation(mutationFunction, options)`

Handles mutations (POST/PUT/DELETE) with automatic cache invalidation.

**Parameters:**
- `mutationFunction` (Function): The API mutation function
- `options` (Object):
  - `invalidateKeys` (Array<string>): Cache keys to invalidate (supports wildcards with *)
  - `onSuccess` (Function): Callback on successful mutation
  - `onError` (Function): Callback on error

**Returns:**
- `mutate`: Function to trigger the mutation
- `loading`: Loading state during mutation
- `error`: Error message if mutation fails
- `data`: Response data from mutation

---

## Cache Management

### Clear Cache on Logout
The cache is automatically cleared when users log out (already implemented in `AuthContext`).

### Manual Cache Invalidation
```javascript
import { sessionCache } from '../utils/sessionCache';

// Clear specific cache
sessionCache.remove('teacher_assignments_123');

// Clear by pattern (all assignments)
sessionCache.removeByPattern('teacher_assignments_*');

// Clear all cache
sessionCache.clear();
```

### Check Cache Status
```javascript
const cacheInfo = sessionCache.getInfo('my_cache_key');
console.log(cacheInfo);
// {
//   timestamp: 1234567890,
//   age: 120000, // 2 minutes
//   ttl: 1800000, // 30 minutes
//   expired: false,
//   remainingTime: 1680000 // 28 minutes remaining
// }
```

---

## Best Practices

### 1. Use Descriptive Cache Keys
```javascript
// ❌ Bad
cacheKey: 'data'

// ✅ Good
cacheKey: `teacher_assignments_class_${classId}_semester_${semesterId}`
```

### 2. Set Appropriate TTL
```javascript
// Static data (rarely changes) - longer TTL
cacheKey: 'school_list',
ttl: 60 * 60 * 1000 // 1 hour

// Live data (frequently changes) - shorter TTL
cacheKey: 'live_notifications',
ttl: 2 * 60 * 1000 // 2 minutes
```

### 3. Invalidate Related Caches After Mutations
```javascript
// When creating/updating/deleting assignments, invalidate all assignment caches
invalidateKeys: [
    'teacher_assignments_*',
    'student_assignments_*',
    'class_assignments_*'
]
```

### 4. Use Dependencies for Dynamic Data
```javascript
// Re-fetch when filters change
const { data } = useCachedApi(
    () => teacherService.getStudents(filters),
    { dependencies: [filters.class, filters.semester] }
);
```

### 5. Handle Loading States Properly
```javascript
const { data, loading, error } = useCachedApi(...);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

---

## Migration Checklist

For each component using API calls:

- [ ] Import `useCachedApi` from `hooks/useCachedApi`
- [ ] Replace `useState` and `useEffect` with `useCachedApi`
- [ ] Add appropriate `cacheKey` (descriptive and unique)
- [ ] Set `dependencies` if data depends on props/state
- [ ] Set custom `ttl` if default 30 minutes isn't appropriate
- [ ] For mutations, use `useCachedMutation` with `invalidateKeys`
- [ ] Test page refresh to verify data loads from cache
- [ ] Test data updates to ensure cache invalidation works

---

## Common Patterns

### Pattern 1: Dashboard with Multiple API Calls
```javascript
const Dashboard = () => {
    const { data: stats } = useCachedApi(() => api.getStats());
    const { data: activity } = useCachedApi(() => api.getActivity());
    const { data: notifications } = useCachedApi(() => api.getNotifications(), {
        ttl: 5 * 60 * 1000 // Refresh notifications more frequently
    });

    // Render dashboard...
};
```

### Pattern 2: List with Create/Update/Delete
```javascript
const ManageStudents = () => {
    const { data: students, refetch } = useCachedApi(
        () => managerService.getStudents(),
        { cacheKey: 'manager_students' }
    );

    const { mutate: deleteStudent } = useCachedMutation(
        (id) => managerService.deleteStudent(id),
        {
            invalidateKeys: ['manager_students'],
            onSuccess: refetch
        }
    );

    // Render list...
};
```

### Pattern 3: Search/Filter with Debouncing
```javascript
const SearchStudents = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: students, loading } = useCachedApi(
        () => managerService.searchStudents(searchTerm),
        {
            dependencies: [searchTerm],
            enabled: searchTerm.length >= 3,
            cacheKey: `student_search_${searchTerm}`,
            ttl: 10 * 60 * 1000 // 10 minutes for search results
        }
    );

    // Render search results...
};
```

---

## Troubleshooting

### Issue: Data not updating after mutation
**Solution:** Make sure to invalidate related cache keys or call `refetch()`

### Issue: Cache showing stale data
**Solution:** Reduce TTL or use `skipCache: true` for critical data

### Issue: Different cache per user role
**Solution:** Include user ID or role in cache key
```javascript
cacheKey: `dashboard_${user.role}_${user.id}`
```

---

## Summary

The caching system provides:
- ✅ **Reduced server load** - Fewer API calls
- ✅ **Faster page loads** - Instant data from cache on refresh
- ✅ **Better UX** - No loading spinners on refresh
- ✅ **Automatic management** - Cache clears on logout
- ✅ **Flexible control** - TTL, invalidation, manual refresh

Start migrating your most-visited pages first (dashboards, lists) for immediate impact!
