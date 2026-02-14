import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
    return (
        <header className="secretary-header">
            <div>
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {action ? <div className="secretary-header-action">{action}</div> : null}
        </header>
    );
};

export default PageHeader;
