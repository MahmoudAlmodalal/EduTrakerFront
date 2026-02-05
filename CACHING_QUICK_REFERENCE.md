# Session Caching - Quick Reference Card

## Basic Usage

### Simple Fetch (No Parameters)
```javascript
import { useCachedApi } from '../hooks/useCachedApi';

const { data, loading, error } = useCachedApi(
    () => studentService.getDashboard()
);
```

### Fetch with Parameters
```javascript
const { data, loading, error, refetch } = useCachedApi(
    () => teacherService.getAssignments({ class_id: classId }),
    {
        dependencies: [classId],
        cacheKey: `assignments_${classId}`
    }
);
```

### Custom TTL
```javascript
const { data } = useCachedApi(
    () => api.getNotifications(),
    {
        cacheKey: 'notifications',
        ttl: 5 * 60 * 1000 // 5 minutes
    }
);
```

### Conditional Fetch
```javascript
const { data } = useCachedApi(
    () => api.getData(id),
    {
        enabled: !!id, // Only fetch if id exists
        dependencies: [id]
    }
);
```

### Always Fresh (Skip Cache)
```javascript
const { data, refetch } = useCachedApi(
    () => api.getLiveData(),
    {
        skipCache: true // Always fetch fresh
    }
);
```

---

## Mutations

### Basic Mutation
```javascript
import { useCachedMutation } from '../hooks/useCachedApi';

const { mutate, loading } = useCachedMutation(
    (data) => teacherService.createAssignment(data),
    {
        invalidateKeys: ['assignments_*'],
        onSuccess: () => console.log('Created!')
    }
);

// Usage
await mutate({ title: 'Test', class_id: 1 });
```

### Update with Cache Refresh
```javascript
const { data, refetch } = useCachedApi(
    () => api.getStudents()
);

const { mutate: updateStudent } = useCachedMutation(
    (data) => api.updateStudent(data),
    {
        invalidateKeys: ['students_*'],
        onSuccess: refetch
    }
);
```

---

## Manual Cache Control

```javascript
import { sessionCache } from '../utils/sessionCache';

// Remove specific cache
sessionCache.remove('my_key');

// Remove by pattern (wildcard)
sessionCache.removeByPattern('students_*');

// Clear all cache
sessionCache.clear();

// Check cache info
const info = sessionCache.getInfo('my_key');
console.log(info.remainingTime); // Time until expiry
```

---

## Common Patterns

### Dashboard with Multiple Calls
```javascript
const { data: stats } = useCachedApi(() => api.getStats());
const { data: users } = useCachedApi(() => api.getUsers());
const { data: alerts } = useCachedApi(() => api.getAlerts(), {
    ttl: 2 * 60 * 1000 // 2 min
});
```

### List + Create/Delete
```javascript
// Fetch list
const { data: items, refetch } = useCachedApi(
    () => api.getItems(),
    { cacheKey: 'items_list' }
);

// Delete mutation
const { mutate: deleteItem } = useCachedMutation(
    (id) => api.deleteItem(id),
    {
        invalidateKeys: ['items_list'],
        onSuccess: refetch
    }
);
```

### Search with Dynamic Parameters
```javascript
const [search, setSearch] = useState('');

const { data, loading } = useCachedApi(
    () => api.search(search),
    {
        enabled: search.length >= 3,
        dependencies: [search],
        cacheKey: `search_${search}`
    }
);
```

---

## Default Values

| Option | Default |
|--------|---------|
| `ttl` | 30 minutes (1,800,000 ms) |
| `enabled` | `true` |
| `skipCache` | `false` |
| `dependencies` | `[]` |
| `cacheKey` | Auto-generated |

---

## Cache Key Naming Convention

```
{role}_{resource}_{identifier}_{filter}
```

Examples:
- `teacher_assignments_class_123`
- `student_marks_semester_2024_1`
- `admin_dashboard_stats`
- `manager_students_class_5_active`

---

## TTL Guidelines

| Data Type | Recommended TTL |
|-----------|-----------------|
| Dashboard stats | 30 minutes |
| Notifications | 5 minutes |
| User lists | 15-30 minutes |
| Static data (schools, classes) | 1 hour |
| Live data (attendance, chat) | Skip cache or 1-2 min |
| Reports | 1 hour |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stale data after update | Add `invalidateKeys` or call `refetch()` |
| Cache not working | Check browser console for errors |
| Data not refreshing | Verify `dependencies` array |
| Different data per user | Include `user.id` in `cacheKey` |

---

## Migration Steps

1. ✅ Import `useCachedApi`
2. ✅ Replace `useState` + `useEffect` with `useCachedApi`
3. ✅ Add `cacheKey` (descriptive + unique)
4. ✅ Set `dependencies` if needed
5. ✅ Test refresh behavior
6. ✅ Add `invalidateKeys` for mutations

---

## Benefits

- ⚡ **Instant loads** on page refresh
- 📉 **Reduced API calls** by ~70-90%
- 🔄 **Auto-refresh** when dependencies change
- 🧹 **Auto-cleanup** on logout
- 💾 **Session-based** (clears on tab close)

---

**Note:** Cache is stored in `sessionStorage` and cleared automatically when:
- User logs out
- Browser tab is closed
- TTL expires
