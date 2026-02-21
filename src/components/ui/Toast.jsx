import { useCallback, useMemo, useState, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Toast.css';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const showSuccess = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const showError = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const showWarning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const showInfo = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    const contextValue = useMemo(() => ({
        showSuccess,
        showError,
        showWarning,
        showInfo,
    }), [showError, showInfo, showSuccess, showWarning]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function Toast({ message, type, onClose }) {
    const { t } = useTheme();
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Match animation duration
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info
    };

    const Icon = icons[type] || icons.info;

    return (
        <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon">
                <Icon size={20} />
            </div>
            <div className="toast-message">{t(message)}</div>
            <button className="toast-close" onClick={handleClose}>
                <X size={16} />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
