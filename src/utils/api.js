import axios from 'axios';
import offlineQueue from './offlineQueue';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

const getCookie = (name) => {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

const getHeaderValue = (headers, key) => {
    if (!headers) {
        return undefined;
    }

    if (typeof headers.get === 'function') {
        return headers.get(key);
    }

    const normalizedKey = key.toLowerCase();
    const headerEntry = Object.entries(headers).find(([headerName]) => headerName.toLowerCase() === normalizedKey);
    return headerEntry?.[1];
};

const buildQueueHeaders = (headers) => {
    const allowedHeaders = ['authorization', 'x-csrftoken', 'content-type'];
    const queueHeaders = {};

    allowedHeaders.forEach((name) => {
        const value = getHeaderValue(headers, name);
        if (value !== undefined && value !== null && value !== '') {
            queueHeaders[name] = value;
        }
    });

    return queueHeaders;
};

const buildRequestUrl = (requestConfig) => {
    try {
        return apiClient.getUri(requestConfig);
    } catch {
        const base = requestConfig?.baseURL || BASE_URL;
        const path = requestConfig?.url || '';
        return `${base}${path}`;
    }
};

const normalizeRequestBody = (body) => {
    if (typeof body !== 'string') {
        return body;
    }

    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
};

const isAuthMutation = (url) => {
    if (!url) {
        return false;
    }

    return url.includes('/auth/');
};

const shouldQueueOfflineMutation = (requestConfig) => {
    if (!requestConfig) {
        return false;
    }

    if (requestConfig._skipOfflineQueue) {
        return false;
    }

    const method = (requestConfig.method || '').toLowerCase();
    if (!MUTATION_METHODS.includes(method)) {
        return false;
    }

    const url = requestConfig.url || '';
    if (isAuthMutation(url)) {
        return false;
    }

    return true;
};

const isCanceledRequestError = (error) => {
    if (!error) {
        return false;
    }

    const normalizedCode = String(error.code || '').toUpperCase();
    const normalizedName = String(error.name || '').toLowerCase();
    const normalizedMessage = String(error.message || '').toLowerCase();

    return normalizedCode === 'ERR_CANCELED'
        || normalizedName === 'cancelederror'
        || normalizedName === 'aborterror'
        || normalizedMessage === 'canceled';
};

const hasText = (value) => {
    if (value === null || value === undefined) {
        return false;
    }

    return String(value).trim().length > 0;
};

const extractFirstErrorValue = (payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return '';
    }

    for (const value of Object.values(payload)) {
        if (Array.isArray(value)) {
            const firstNonEmpty = value.find((item) => hasText(item));
            if (hasText(firstNonEmpty)) {
                return String(firstNonEmpty).trim();
            }
            continue;
        }

        if (hasText(value)) {
            return String(value).trim();
        }
    }

    return '';
};

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Separate instance for refreshing to avoid recursive interceptor calls
const refreshClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const method = (config.method || '').toLowerCase();
        if (MUTATION_METHODS.includes(method)) {
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // For blob responses (file downloads), return the full response data
        if (response.config.responseType === 'blob') {
            return response.data;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Let request-abort errors bubble through with original metadata.
        // Callers can detect and ignore these without showing UI errors.
        if (isCanceledRequestError(error)) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - Token Refresh Logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await refreshClient.post('/auth/token/refresh/', {
                        refresh: refreshToken,
                    });

                    const { access, refresh } = response.data;
                    localStorage.setItem('accessToken', access);
                    if (refresh) {
                        localStorage.setItem('refreshToken', refresh);
                    }

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                } catch {
                    // Refresh token is also invalid/expired
                    console.error('Session expired. Please log in again.');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            }
        }

        // Queue offline mutations for background sync when there is no server response.
        if (!error.response && shouldQueueOfflineMutation(originalRequest)) {
            try {
                const queuedAt = Date.now();
                const queueId = await offlineQueue.enqueue({
                    url: buildRequestUrl(originalRequest),
                    method: originalRequest.method,
                    body: normalizeRequestBody(originalRequest.data),
                    headers: buildQueueHeaders(originalRequest.headers),
                    timestamp: queuedAt,
                });

                return {
                    _offlineQueued: true,
                    _queuedAt: queuedAt,
                    _queueId: queueId,
                };
            } catch (queueError) {
                console.error('Failed to queue offline mutation:', queueError);
            }
        }

        // Map backend error codes to user-friendly messages
        let data = error.response?.data;

        // If the response is a blob (common in file exports), we need to read it as JSON to get the error message
        if (data instanceof Blob && data.type.includes('application/json')) {
            try {
                const text = await data.text();
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse error blob:', e);
            }
        }

        let message = '';

        if (!error.response) {
            const normalizedCode = String(error.code || '').toUpperCase();
            const normalizedMessage = String(error.message || '').toLowerCase();

            if (normalizedCode === 'ECONNABORTED' || normalizedMessage.includes('timeout')) {
                message = 'Request timed out. Please try again.';
            } else if (normalizedCode === 'ERR_NETWORK') {
                message = 'Unable to reach the server. Please check your connection and backend status.';
            } else if (hasText(error.message)) {
                message = String(error.message).trim();
            }
        }

        if (data) {
            if (typeof data === 'string') {
                if (hasText(data)) {
                    message = data.trim();
                }
            } else if (hasText(data.detail)) {
                message = String(data.detail).trim();
            } else if (hasText(data.message)) {
                message = String(data.message).trim();
            } else if (typeof data === 'object') {
                // Handle multiple validation errors (common in Django REST)
                const firstError = extractFirstErrorValue(data);
                if (hasText(firstError)) {
                    message = firstError;
                }
            }
        }

        if (!hasText(message) && hasText(error.message)) {
            message = String(error.message).trim();
        }

        if (!hasText(message)) {
            message = 'Something went wrong. Please try again.';
        }

        const errorToThrow = new Error(message);
        errorToThrow.response = error.response; // Re-attach for compatibility with catch blocks
        errorToThrow.status = error.response?.status;
        errorToThrow.data = data;
        errorToThrow.code = error.code;
        errorToThrow.name = error.name || errorToThrow.name;

        return Promise.reject(errorToThrow);
    }
);

export const api = {
    get: (endpoint, config) => apiClient.get(endpoint, config),
    post: (endpoint, body, config) => apiClient.post(endpoint, body, config),
    put: (endpoint, body, config) => apiClient.put(endpoint, body, config),
    patch: (endpoint, body, config) => apiClient.patch(endpoint, body, config),
    delete: (endpoint, config) => apiClient.delete(endpoint, config),
};
