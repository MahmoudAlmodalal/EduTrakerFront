import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, message = 'No data available.' }) => {
    const IconComponent = icon || Inbox;

    return (
        <div className="sec-empty-state">
            {React.createElement(IconComponent, { size: 40 })}
            <p>{message}</p>
        </div>
    );
};

export default EmptyState;
