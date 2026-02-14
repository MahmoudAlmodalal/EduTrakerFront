import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="sec-spinner-wrap" role="status" aria-live="polite">
            <div className="sec-spinner" aria-hidden="true" />
            <p>{message}</p>
        </div>
    );
};

export default LoadingSpinner;
