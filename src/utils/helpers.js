export const toList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    return [];
};

export const uniqueById = (items) => {
    const seen = new Set();
    return toList(items).filter((item) => {
        const key = item?.id;
        if (key === undefined || key === null) {
            return false;
        }
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

const pad2 = (value) => String(value).padStart(2, '0');

export const toLocalIsoDate = (input = new Date()) => {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const todayIsoDate = () => toLocalIsoDate(new Date());

const getBackendOrigin = () => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
        return new URL(rawApiUrl, window.location.origin).origin;
    } catch {
        return window.location.origin;
    }
};

export const resolveBackendFileUrl = (value) => {
    if (!value) {
        return '';
    }

    try {
        const parsed = new URL(value, window.location.origin);
        const backendOrigin = getBackendOrigin();
        const isMediaPath = parsed.pathname.startsWith('/media/');

        // Media is served by backend (e.g. localhost:8000), not the Vite host.
        if (isMediaPath && parsed.origin !== backendOrigin) {
            return `${backendOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }

        return parsed.toString();
    } catch {
        return value;
    }
};
