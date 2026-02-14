import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const AlertBanner = ({ type = 'error', message, onDismiss }) => {
    if (!message) {
        return null;
    }

    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircle : AlertCircle;

    return (
        <div className={`sec-alert ${isSuccess ? 'sec-alert--success' : 'sec-alert--error'}`} role="alert">
            <Icon size={18} />
            <span>{message}</span>
            {onDismiss ? (
                <button type="button" className="sec-alert-dismiss" onClick={onDismiss} aria-label="Dismiss alert">
                    <X size={16} />
                </button>
            ) : null}
        </div>
    );
};

export default AlertBanner;
