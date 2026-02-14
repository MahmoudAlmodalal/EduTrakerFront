const DB_NAME = 'edutraker-offline';
const DB_VERSION = 1;

export const OFFLINE_STORES = {
    CACHE: 'cache',
    SYNC_QUEUE: 'sync-queue',
};

let dbPromise;

export const openDB = () => {
    if (typeof indexedDB === 'undefined') {
        return Promise.reject(new Error('IndexedDB is not supported in this browser.'));
    }

    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(OFFLINE_STORES.CACHE)) {
                db.createObjectStore(OFFLINE_STORES.CACHE, { keyPath: 'key' });
            }

            if (!db.objectStoreNames.contains(OFFLINE_STORES.SYNC_QUEUE)) {
                const queueStore = db.createObjectStore(OFFLINE_STORES.SYNC_QUEUE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => {
                db.close();
                dbPromise = null;
            };
            resolve(db);
        };

        request.onerror = () => reject(request.error);
    });

    return dbPromise;
};

const runTransaction = async (storeName, mode, operation) => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let request;
        let result;

        try {
            request = operation(store);
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => {
            result = request.result;
        };

        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
        transaction.oncomplete = () => resolve(result);
    });
};

export const getAll = (storeName) => runTransaction(storeName, 'readonly', (store) => store.getAll());

export const get = (storeName, key) => runTransaction(storeName, 'readonly', (store) => store.get(key));

export const put = (storeName, value, key) =>
    runTransaction(storeName, 'readwrite', (store) => (
        key === undefined ? store.put(value) : store.put(value, key)
    ));

export const del = (storeName, key) => runTransaction(storeName, 'readwrite', (store) => store.delete(key));

export const clear = (storeName) => runTransaction(storeName, 'readwrite', (store) => store.clear());

