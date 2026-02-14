import { OFFLINE_STORES, clear as clearStore, del, getAll, put } from './offlineDb';

const QUEUE_STORE = OFFLINE_STORES.SYNC_QUEUE;

const emitQueueUpdated = async () => {
    if (typeof window === 'undefined') {
        return;
    }

    const pendingCount = await offlineQueue.getCount();
    window.dispatchEvent(
        new CustomEvent('edutraker:queue-updated', {
            detail: { pendingCount },
        }),
    );
};

const sortByOldest = (items) =>
    [...items].sort((a, b) => {
        if (a.timestamp === b.timestamp) {
            return (a.id ?? 0) - (b.id ?? 0);
        }
        return (a.timestamp ?? 0) - (b.timestamp ?? 0);
    });

const offlineQueue = {
    async enqueue({ url, method, body, headers, timestamp = Date.now() }) {
        const id = await put(QUEUE_STORE, {
            url,
            method: (method || 'POST').toUpperCase(),
            body,
            headers: headers || {},
            timestamp,
        });
        await emitQueueUpdated();
        return id;
    },

    async dequeue() {
        const items = await this.peekAll();
        const oldest = items[0];
        if (!oldest) {
            return null;
        }

        await del(QUEUE_STORE, oldest.id);
        await emitQueueUpdated();
        return oldest;
    },

    async peekAll() {
        const items = await getAll(QUEUE_STORE);
        return sortByOldest(items);
    },

    async getCount() {
        const items = await getAll(QUEUE_STORE);
        return items.length;
    },

    async clear() {
        await clearStore(QUEUE_STORE);
        await emitQueueUpdated();
    },
};

export default offlineQueue;
