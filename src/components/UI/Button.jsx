import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', size = 'medium', onClick, type = 'button', disabled = false, icon: Icon }) => {
    return (
        <button
            type={type}
            className={`${styles.button} ${styles[variant]} ${styles[size]}`}
            onClick={onClick}
            disabled={disabled}
        >
            {Icon && <Icon size={size === 'small' ? 16 : 20} className={styles.icon} />}
            {children}
        </button>
    );
};

export default Button;
