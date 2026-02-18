import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, message = 'No data available.' }) => {
    const IconComponent = typeof icon === 'function' ? icon : Inbox;

    return (
        <div className="sec-empty-state">
            {IconComponent ? React.createElement(IconComponent, { size: 40 }) : null}
            <p>{message}</p>
        </div>
    );
};

export default EmptyState;
