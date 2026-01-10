import React from 'react';
import styles from './Card.module.css';

const Card = ({
    children,
    variant = 'elevated',
    className = '',
    ...props
}) => {
    const cardClasses = [
        styles.card,
        styles[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClasses} {...props}>
            {children}
        </div>
    );
};

const CardHeader = ({ children, title, subtitle, className = '', ...props }) => {
    return (
        <div className={`${styles.header} ${className}`} {...props}>
            <div className={styles.headerContent}>
                {title && <h3 className={styles.title}>{title}</h3>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                {children}
            </div>
        </div>
    );
};

const CardBody = ({ children, className = '', ...props }) => {
    return (
        <div className={`${styles.body} ${className}`} {...props}>
            {children}
        </div>
    );
};

const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div className={`${styles.footer} ${className}`} {...props}>
            {children}
        </div>
    );
};

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
