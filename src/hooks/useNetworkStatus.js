import { useEffect, useState } from 'react';
import offlineQueue from '../utils/offlineQueue';

const getInitialOnlineState = () => {
    if (typeof navigator === 'undefined') {
        return true;
    }
    return navigator.onLine;
};

export default function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(getInitialOnlineState);
    const [wasOffline, setWasOffline] = useState(() => !getInitialOnlineState());
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const refreshPendingCount = async (event) => {
            if (!isMounted) {
                return;
            }

            if (event?.detail?.pendingCount !== undefined) {
                setPendingSyncCount(event.detail.pendingCount);
                return;
            }

            try {
                const count = await offlineQueue.getCount();
                if (isMounted) {
                    setPendingSyncCount(count);
                }
            } catch {
                if (isMounted) {
                    setPendingSyncCount(0);
                }
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            refreshPendingCount();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        const handleSyncComplete = (event) => {
            refreshPendingCount(event);
            if (event?.detail?.remaining === 0) {
                setWasOffline(false);
            }
        };

        refreshPendingCount();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('edutraker:queue-updated', refreshPendingCount);
        window.addEventListener('edutraker:sync-progress', refreshPendingCount);
        window.addEventListener('edutraker:sync-complete', handleSyncComplete);

        return () => {
            isMounted = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('edutraker:queue-updated', refreshPendingCount);
            window.removeEventListener('edutraker:sync-progress', refreshPendingCount);
            window.removeEventListener('edutraker:sync-complete', handleSyncComplete);
        };
    }, []);

    return { isOnline, wasOffline, pendingSyncCount };
}
