import React, { memo } from 'react';
import { getSecretaryIconColorKey } from '../../../utils/secretaryHelpers';

const AvatarInitial = memo(function AvatarInitial({ name, size = 'md', color = 'indigo' }) {
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    const sizeClass = size === 'sm' ? 'sec-avatar--sm' : 'sec-avatar--md';
    const toneClass = `sec-icon-tone--${getSecretaryIconColorKey(color)}`;

    return (
        <div className={`sec-avatar ${sizeClass} ${toneClass}`} aria-hidden="true">
            {initial}
        </div>
    );
});

export default AvatarInitial;
