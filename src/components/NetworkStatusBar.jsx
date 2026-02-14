import { CloudOff, LoaderCircle } from 'lucide-react';
import useNetworkStatus from '../hooks/useNetworkStatus';
import './NetworkStatusBar.css';

function NetworkStatusBar() {
    const { isOnline, wasOffline, pendingSyncCount } = useNetworkStatus();

    const isOffline = !isOnline;
    const isSyncing = isOnline && wasOffline && pendingSyncCount > 0;
    const isVisible = isOffline || isSyncing;

    return (
        <div
            className={[
                'network-status-bar',
                isVisible ? 'is-visible' : '',
                isOffline ? 'is-offline' : '',
                isSyncing ? 'is-syncing' : '',
            ].join(' ')}
            role="status"
            aria-live="polite"
            aria-hidden={!isVisible}
        >
            <div className="network-status-message">
                {isOffline ? (
                    <>
                        <CloudOff size={16} />
                        <span>You are offline - changes will sync automatically.</span>
                    </>
                ) : (
                    <>
                        <LoaderCircle size={16} className="network-status-spinner" />
                        <span>
                            Syncing {pendingSyncCount} change{pendingSyncCount === 1 ? '' : 's'}...
                        </span>
                    </>
                )}
            </div>
            {pendingSyncCount > 0 && <span className="network-status-count">{pendingSyncCount}</span>}
        </div>
    );
}

export default NetworkStatusBar;

