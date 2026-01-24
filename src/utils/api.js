const BASE_URL = 'http://localhost:8000/api';

const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || data.message || 'Something went wrong');
    }
    return data;
};

export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },
    post: async (endpoint, body) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },
    put: async (endpoint, body) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },
    patch: async (endpoint, body) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },
    delete: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    }
};
