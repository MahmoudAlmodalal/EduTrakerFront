import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Separate instance for refreshing to avoid recursive interceptor calls
const refreshClient = axios.create({
    baseURL: BASE_URL,
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

        // Handle 401 Unauthorized - Token Refresh Logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await refreshClient.post('/auth/token/refresh/', {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh token is also invalid/expired
                    console.error('Session expired. Please log in again.');
                    localStorage.clear();
                    window.location.href = '/login';
                }
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

        let message = 'Something went wrong. Please try again.';

        if (data) {
            if (typeof data === 'string') {
                message = data;
            } else if (data.detail) {
                message = data.detail;
            } else if (data.message) {
                message = data.message;
            } else if (typeof data === 'object') {
                // Handle multiple validation errors (common in Django REST)
                const firstError = Object.values(data)[0];
                message = Array.isArray(firstError) ? firstError[0] : firstError;
            }
        }

        const errorToThrow = new Error(message);
        errorToThrow.response = error.response; // Re-attach for compatibility with catch blocks
        errorToThrow.status = error.response?.status;
        errorToThrow.data = data;

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

