import offlineQueue from './offlineQueue';

const SYNC_PROGRESS_EVENT = 'edutraker:sync-progress';
const SYNC_COMPLETE_EVENT = 'edutraker:sync-complete';

let isSyncing = false;
let isInitialized = false;

const isRetryableStatus = (status) => status >= 500;

const dispatchSyncEvent = (eventName, detail) => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const replayRequest = async (item) => {
    const method = (item.method || 'POST').toUpperCase();
    const headers = item.headers || {};
    const options = {
        method,
        headers,
        credentials: 'include',
    };

    if (!['GET', 'HEAD'].includes(method) && item.body !== undefined && item.body !== null) {
        const hasContentType = Object.keys(headers).some((header) => header.toLowerCase() === 'content-type');
        const isRawBody =
            item.body instanceof FormData ||
            item.body instanceof Blob ||
            item.body instanceof ArrayBuffer ||
            ArrayBuffer.isView(item.body) ||
            item.body instanceof URLSearchParams;

        if (isRawBody) {
            options.body = item.body;
        } else if (typeof item.body === 'string') {
            options.body = item.body;
        } else {
            options.body = JSON.stringify(item.body);
            if (!hasContentType) {
                options.headers = { ...headers, 'Content-Type': 'application/json' };
            }
        }
    }

    return fetch(item.url, options);
};

export const syncQueuedMutations = async () => {
    if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
        return;
    }

    isSyncing = true;
    let synced = 0;
    let dropped = 0;

    try {
        let queue = await offlineQueue.peekAll();
        const initialTotal = queue.length;

        if (initialTotal === 0) {
            dispatchSyncEvent(SYNC_COMPLETE_EVENT, {
                success: true,
                synced: 0,
                dropped: 0,
                remaining: 0,
            });
            return;
        }

        while (queue.length > 0) {
            const item = queue[0];
            const remainingBefore = queue.length;

            try {
                const response = await replayRequest(item);

                if (response.ok) {
                    await offlineQueue.dequeue();
                    synced += 1;
                    const remaining = await offlineQueue.getCount();
                    dispatchSyncEvent(SYNC_PROGRESS_EVENT, {
                        total: initialTotal,
                        synced,
                        dropped,
                        remaining,
                    });
                    queue = await offlineQueue.peekAll();
                    continue;
                }

                if (response.status >= 400 && response.status < 500) {
                    await offlineQueue.dequeue();
                    dropped += 1;
                    const remaining = await offlineQueue.getCount();
                    dispatchSyncEvent(SYNC_PROGRESS_EVENT, {
                        total: initialTotal,
                        synced,
                        dropped,
                        remaining,
                    });
                    console.error('Dropped queued mutation after non-retryable response:', response.status, item.url);
                    queue = await offlineQueue.peekAll();
                    continue;
                }

                if (isRetryableStatus(response.status)) {
                    dispatchSyncEvent(SYNC_COMPLETE_EVENT, {
                        success: false,
                        reason: 'server-error',
                        status: response.status,
                        synced,
                        dropped,
                        remaining: remainingBefore,
                    });
                    return;
                }
            } catch {
                dispatchSyncEvent(SYNC_COMPLETE_EVENT, {
                    success: false,
                    reason: 'network-error',
                    synced,
                    dropped,
                    remaining: remainingBefore,
                });
                return;
            }
        }

        dispatchSyncEvent(SYNC_COMPLETE_EVENT, {
            success: true,
            synced,
            dropped,
            remaining: 0,
        });
    } finally {
        isSyncing = false;
    }
};

export const initSyncManager = () => {
    if (isInitialized || typeof window === 'undefined') {
        return;
    }

    isInitialized = true;
    window.addEventListener('online', syncQueuedMutations);

    if (navigator.onLine) {
        syncQueuedMutations();
    }
};
