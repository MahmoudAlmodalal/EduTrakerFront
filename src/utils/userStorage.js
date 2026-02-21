const USER_STORAGE_KEY = 'user';

const safeGetItem = (storage, key) => {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
};

const safeSetItem = (storage, key, value) => {
    try {
        storage?.setItem(key, value);
    } catch {
        // Ignore storage quota/security failures.
    }
};

const safeRemoveItem = (storage, key) => {
    try {
        storage?.removeItem(key);
    } catch {
        // Ignore storage quota/security failures.
    }
};

export const getStoredUserRaw = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const sessionUser = safeGetItem(window.sessionStorage, USER_STORAGE_KEY);
    if (sessionUser) {
        return sessionUser;
    }

    const legacyLocalUser = safeGetItem(window.localStorage, USER_STORAGE_KEY);
    if (!legacyLocalUser) {
        return null;
    }

    // Migrate legacy user cache from localStorage to sessionStorage.
    safeSetItem(window.sessionStorage, USER_STORAGE_KEY, legacyLocalUser);
    safeRemoveItem(window.localStorage, USER_STORAGE_KEY);
    return legacyLocalUser;
};

export const setStoredUser = (userData) => {
    if (typeof window === 'undefined') {
        return;
    }

    safeSetItem(window.sessionStorage, USER_STORAGE_KEY, JSON.stringify(userData));
    safeRemoveItem(window.localStorage, USER_STORAGE_KEY);
};

export const clearStoredUser = () => {
    if (typeof window === 'undefined') {
        return;
    }

    safeRemoveItem(window.sessionStorage, USER_STORAGE_KEY);
    safeRemoveItem(window.localStorage, USER_STORAGE_KEY);
};
