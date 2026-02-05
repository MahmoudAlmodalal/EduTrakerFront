/**
 * EXAMPLE: Complete CRUD Component with Caching
 *
 * This example demonstrates:
 * - Fetching data with caching
 * - Creating new records with cache invalidation
 * - Updating records with cache refresh
 * - Deleting records with cache cleanup
 */

import React, { useState } from 'react';
import { useCachedApi, useCachedMutation } from './hooks/useCachedApi';
import teacherService from './services/teacherService';

const TeacherAssignmentsManager = ({ classId }) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });

    // ========================================
    // FETCH: Get assignments list (with caching)
    // ========================================
    const {
        data: assignments,
        loading,
        error,
        refetch
    } = useCachedApi(
        () => teacherService.getAssignments({ class_id: classId }),
        {
            dependencies: [classId],
            cacheKey: `teacher_assignments_class_${classId}`,
            ttl: 30 * 60 * 1000 // 30 minutes
        }
    );

    // ========================================
    // CREATE: Add new assignment
    // ========================================
    const {
        mutate: createAssignment,
        loading: creating,
        error: createError
    } = useCachedMutation(
        (data) => teacherService.createAssignment(data),
        {
            // Invalidate all assignment caches after creation
            invalidateKeys: [
                'teacher_assignments_*',  // All teacher assignment caches
                'student_assignments_*'   // Student views might also be affected
            ],
            onSuccess: (newAssignment) => {
                console.log('Assignment created:', newAssignment);
                setShowCreateForm(false);
                setFormData({ title: '', description: '', due_date: '' });
                refetch(); // Manually refresh the list
            },
            onError: (error) => {
                console.error('Failed to create assignment:', error);
            }
        }
    );

    // ========================================
    // UPDATE: Edit existing assignment
    // ========================================
    const {
        mutate: updateAssignment,
        loading: updating
    } = useCachedMutation(
        ({ id, data }) => teacherService.updateAssignment(id, data),
        {
            invalidateKeys: ['teacher_assignments_*', 'student_assignments_*'],
            onSuccess: () => {
                console.log('Assignment updated');
                refetch();
            }
        }
    );

    // ========================================
    // DELETE: Remove assignment
    // ========================================
    const {
        mutate: deleteAssignment,
        loading: deleting
    } = useCachedMutation(
        (id) => teacherService.deleteAssignment(id),
        {
            invalidateKeys: ['teacher_assignments_*', 'student_assignments_*'],
            onSuccess: () => {
                console.log('Assignment deleted');
                refetch();
            }
        }
    );

    // ========================================
    // HANDLERS
    // ========================================
    const handleCreate = async (e) => {
        e.preventDefault();
        await createAssignment({
            ...formData,
            class_id: classId
        });
    };

    const handleUpdate = async (id, updatedData) => {
        await updateAssignment({ id, data: updatedData });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            await deleteAssignment(id);
        }
    };

    const handleManualRefresh = () => {
        refetch(); // Force refresh, bypasses cache
    };

    // ========================================
    // RENDER
    // ========================================
    if (loading) {
        return (
            <div className="loading">
                <p>Loading assignments...</p>
                <p className="hint">First load: fetching from server</p>
                <p className="hint">On refresh: loading from cache (instant!)</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <p>Error: {error}</p>
                <button onClick={handleManualRefresh}>Retry</button>
            </div>
        );
    }

    return (
        <div className="assignments-manager">
            {/* Header */}
            <div className="header">
                <h2>Assignments for Class {classId}</h2>
                <div className="actions">
                    <button onClick={handleManualRefresh} disabled={loading}>
                        🔄 Refresh
                    </button>
                    <button onClick={() => setShowCreateForm(true)}>
                        ➕ Create Assignment
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="create-form">
                    <h3>Create New Assignment</h3>
                    <form onSubmit={handleCreate}>
                        <input
                            type="text"
                            placeholder="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            required
                        />
                        <div className="form-actions">
                            <button type="submit" disabled={creating}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                            <button type="button" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </button>
                        </div>
                        {createError && <p className="error">{createError}</p>}
                    </form>
                </div>
            )}

            {/* Assignments List */}
            <div className="assignments-list">
                {assignments?.length > 0 ? (
                    assignments.map((assignment) => (
                        <div key={assignment.id} className="assignment-card">
                            <h4>{assignment.title}</h4>
                            <p>{assignment.description}</p>
                            <p className="due-date">Due: {assignment.due_date}</p>
                            <div className="card-actions">
                                <button
                                    onClick={() => handleUpdate(assignment.id, {
                                        ...assignment,
                                        status: 'published'
                                    })}
                                    disabled={updating}
                                >
                                    ✏️ Publish
                                </button>
                                <button
                                    onClick={() => handleDelete(assignment.id)}
                                    disabled={deleting}
                                    className="danger"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No assignments yet</p>
                        <button onClick={() => setShowCreateForm(true)}>
                            Create your first assignment
                        </button>
                    </div>
                )}
            </div>

            {/* Cache Info (for demonstration) */}
            <div className="cache-info">
                <p>💡 <strong>Cache Status:</strong></p>
                <ul>
                    <li>Data cached for 30 minutes</li>
                    <li>Automatically refreshes after create/update/delete</li>
                    <li>Try refreshing the page - data loads instantly from cache!</li>
                    <li>Cache clears when you log out</li>
                </ul>
            </div>
        </div>
    );
};

export default TeacherAssignmentsManager;

/*
 * ========================================
 * HOW THIS COMPONENT WORKS
 * ========================================
 *
 * 1. INITIAL LOAD:
 *    - Component mounts
 *    - useCachedApi checks sessionStorage for cached data
 *    - If not found, fetches from API
 *    - Stores response in cache with 30-min TTL
 *
 * 2. PAGE REFRESH:
 *    - Component mounts again
 *    - useCachedApi finds cached data in sessionStorage
 *    - Returns cached data instantly (no API call!)
 *    - User sees data immediately
 *
 * 3. CREATE NEW ASSIGNMENT:
 *    - User submits form
 *    - useCachedMutation calls API
 *    - On success: invalidates cache keys matching 'teacher_assignments_*'
 *    - Calls refetch() to get fresh data
 *    - New data is cached again
 *
 * 4. UPDATE ASSIGNMENT:
 *    - User clicks publish
 *    - Mutation updates the assignment
 *    - Cache invalidated and refetched
 *
 * 5. DELETE ASSIGNMENT:
 *    - User confirms deletion
 *    - Assignment deleted via API
 *    - Cache cleared and list refetched
 *
 * 6. MANUAL REFRESH:
 *    - User clicks refresh button
 *    - refetch() bypasses cache and fetches fresh data
 *    - New data replaces cache
 *
 * 7. LOGOUT:
 *    - AuthContext calls sessionCache.clear()
 *    - All cached data removed
 *    - Next user session starts fresh
 *
 * ========================================
 * BENEFITS DEMONSTRATED
 * ========================================
 *
 * ✅ Instant page loads after refresh
 * ✅ Reduced server load (no redundant API calls)
 * ✅ Automatic cache invalidation on mutations
 * ✅ Manual refresh when needed
 * ✅ Consistent data across components
 * ✅ Better user experience
 *
 * ========================================
 * TESTING TIPS
 * ========================================
 *
 * 1. Open browser DevTools > Application > Session Storage
 * 2. Load the page and see cached data appear
 * 3. Refresh page - notice instant load from cache
 * 4. Create/update/delete - see cache update
 * 5. Wait 30 minutes - cache expires, fresh fetch
 * 6. Logout - cache cleared
 */
