import React from 'react';

const PlaceholderPage = ({ title }) => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>{title}</h1>
            <p>This module is currently under development.</p>
        </div>
    );
};

export default PlaceholderPage;
