/**
 * Session Storage Cache Utility
 * Provides caching functionality with TTL (Time To Live) support
 */

const CACHE_PREFIX = 'edutracker_cache_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Cache utility class for managing sessionStorage with TTL
 */
class SessionCache {
    /**
     * Set a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Data to cache
     * @param {number} ttl - Time to live in milliseconds (default: 30 minutes)
     */
    set(key, value, ttl = DEFAULT_TTL) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cacheData = {
                value,
                timestamp: Date.now(),
                ttl
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to set cache:', error);
        }
    }

    /**
     * Get a value from cache if not expired
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if expired/not found
     */
    get(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cached = sessionStorage.getItem(cacheKey);

            if (!cached) {
                return null;
            }

            const cacheData = JSON.parse(cached);
            const now = Date.now();
            const age = now - cacheData.timestamp;

            // Check if cache is expired
            if (age > cacheData.ttl) {
                this.remove(key);
                return null;
            }

            return cacheData.value;
        } catch (error) {
            console.warn('Failed to get cache:', error);
            return null;
        }
    }

    /**
     * Remove a specific cache entry
     * @param {string} key - Cache key
     */
    remove(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            sessionStorage.removeItem(cacheKey);
        } catch (error) {
            console.warn('Failed to remove cache:', error);
        }
    }

    /**
     * Remove multiple cache entries by pattern
     * @param {string} pattern - Pattern to match cache keys (supports wildcards with *)
     */
    removeByPattern(pattern) {
        try {
            const regex = new RegExp(pattern.replace('*', '.*'));
            const keys = Object.keys(sessionStorage);

            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    const cacheKey = key.substring(CACHE_PREFIX.length);
                    if (regex.test(cacheKey)) {
                        sessionStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.warn('Failed to remove cache by pattern:', error);
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    /**
     * Check if a cache entry exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean} True if cache exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Get cache info (timestamp, age, TTL)
     * @param {string} key - Cache key
     * @returns {object|null} Cache metadata or null if not found
     */
    getInfo(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cached = sessionStorage.getItem(cacheKey);

            if (!cached) {
                return null;
            }

            const cacheData = JSON.parse(cached);
            const now = Date.now();
            const age = now - cacheData.timestamp;

            return {
                timestamp: cacheData.timestamp,
                age,
                ttl: cacheData.ttl,
                expired: age > cacheData.ttl,
                remainingTime: Math.max(0, cacheData.ttl - age)
            };
        } catch (error) {
            console.warn('Failed to get cache info:', error);
            return null;
        }
    }
}

// Export singleton instance
export const sessionCache = new SessionCache();

/**
 * Generate a cache key from API endpoint and parameters
 * @param {string} endpoint - API endpoint
 * @param {object} params - Request parameters
 * @returns {string} Generated cache key
 */
export const generateCacheKey = (endpoint, params = {}) => {
    const paramString = JSON.stringify(params);
    return `${endpoint}_${paramString}`;
};

export default sessionCache;
