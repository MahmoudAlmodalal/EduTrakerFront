import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { sessionCache, generateCacheKey } from '../utils/sessionCache';

const stableSerialize = (value) => {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'function') return `[function:${value.name || 'anonymous'}]`;
    if (typeof value !== 'object') {
        const serialized = JSON.stringify(value);
        return serialized === undefined ? String(value) : serialized;
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }

    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
};

/**
 * Custom hook for API calls with session storage caching
 *
 * @param {Function} apiFunction - The API service function to call
 * @param {Object} options - Configuration options
 * @param {string} options.cacheKey - Custom cache key (optional, auto-generated if not provided)
 * @param {number} options.ttl - Time to live in milliseconds (default: 30 minutes)
 * @param {boolean} options.enabled - Whether to execute the API call (default: true)
 * @param {Array} options.dependencies - Dependencies array for re-fetching (like useEffect deps)
 * @param {boolean} options.skipCache - Skip cache and always fetch fresh data (default: false)
 *
 * @returns {Object} { data, loading, error, refetch, invalidateCache }
 *
 * @example
 * // Basic usage
 * const { data, loading, error } = useCachedApi(
 *   () => studentService.getDashboardStats()
 * );
 *
 * @example
 * // With parameters
 * const { data, loading, error, refetch } = useCachedApi(
 *   () => teacherService.getAssignments({ class_id: classId }),
 *   { dependencies: [classId] }
 * );
 *
 * @example
 * // With custom cache key and TTL
 * const { data, loading, error, invalidateCache } = useCachedApi(
 *   () => managerService.getStudents(),
 *   {
 *     cacheKey: 'manager_students_list',
 *     ttl: 15 * 60 * 1000 // 15 minutes
 *   }
 * );
 */
export const useCachedApi = (apiFunction, options = {}) => {
    const {
        cacheKey: customCacheKey,
        ttl = 30 * 60 * 1000, // 30 minutes default
        enabled = true,
        dependencies = [],
        skipCache = false
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Store apiFunction in ref to prevent it from triggering re-fetches
    const apiFunctionRef = useRef(apiFunction);
    useEffect(() => {
        apiFunctionRef.current = apiFunction;
    }, [apiFunction]);

    const dependenciesKey = useMemo(() => stableSerialize(dependencies), [dependencies]);

    // Generate cache key based on function name and dependencies
    const functionName = useRef(apiFunction.name || 'api_call');
    const cacheKey = useMemo(
        () => customCacheKey || generateCacheKey(functionName.current, dependenciesKey),
        [customCacheKey, dependenciesKey]
    );

    /**
     * Fetch data from API
     */
    const fetchData = useCallback(async (forceRefresh = false) => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Check cache first (unless skipCache or forceRefresh)
            if (!skipCache && !forceRefresh) {
                const cachedData = sessionCache.get(cacheKey);
                if (cachedData !== null) {
                    setData(cachedData);
                    setLoading(false);
                    return;
                }
            }

            // Make API call using ref to get latest function
            const response = await apiFunctionRef.current();

            // Handle different response structures
            const responseData = response?.data !== undefined ? response.data : response;

            setData(responseData);

            // Store in cache
            if (!skipCache) {
                sessionCache.set(cacheKey, responseData, ttl);
            }

        } catch (err) {
            const errorMessage = err?.response?.data?.message ||
                                err?.message ||
                                'An error occurred while fetching data';
            setError(errorMessage);
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    }, [cacheKey, enabled, skipCache, ttl]);

    /**
     * Invalidate cache for this endpoint
     */
    const invalidateCache = useCallback(() => {
        sessionCache.remove(cacheKey);
    }, [cacheKey]);

    /**
     * Refetch data (bypasses cache)
     */
    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, cacheKey, skipCache]);

    return {
        data,
        loading,
        error,
        refetch,
        invalidateCache
    };
};

/**
 * Hook for mutations (POST, PUT, DELETE) with automatic cache invalidation
 *
 * @param {Function} mutationFunction - The API mutation function
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.invalidateKeys - Cache keys to invalidate after mutation
 * @param {Function} options.onSuccess - Callback on successful mutation
 * @param {Function} options.onError - Callback on error
 *
 * @returns {Object} { mutate, loading, error, data }
 *
 * @example
 * const { mutate, loading } = useCachedMutation(
 *   (data) => teacherService.createAssignment(data),
 *   {
 *     invalidateKeys: ['teacher_assignments_*'],
 *     onSuccess: () => console.log('Assignment created!')
 *   }
 * );
 */
export const useCachedMutation = (mutationFunction, options = {}) => {
    const {
        invalidateKeys = [],
        onSuccess,
        onError
    } = options;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const mutationFunctionRef = useRef(mutationFunction);
    const invalidateKeysRef = useRef(invalidateKeys);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        mutationFunctionRef.current = mutationFunction;
    }, [mutationFunction]);

    useEffect(() => {
        invalidateKeysRef.current = invalidateKeys;
    }, [invalidateKeys]);

    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const mutate = useCallback(async (mutationData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await mutationFunctionRef.current(mutationData);
            const responseData = response?.data !== undefined ? response.data : response;

            setData(responseData);

            // Invalidate related caches
            (invalidateKeysRef.current || []).forEach(key => {
                if (key.includes('*')) {
                    sessionCache.removeByPattern(key);
                } else {
                    sessionCache.remove(key);
                }
            });

            if (onSuccessRef.current) {
                onSuccessRef.current(responseData);
            }

            return responseData;

        } catch (err) {
            const errorMessage = err?.response?.data?.message ||
                                err?.message ||
                                'An error occurred during the operation';
            setError(errorMessage);

            if (onErrorRef.current) {
                onErrorRef.current(err);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        mutate,
        loading,
        error,
        data
    };
};

export default useCachedApi;
