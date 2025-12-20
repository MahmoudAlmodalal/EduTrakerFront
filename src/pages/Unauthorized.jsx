import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { t } = useTheme();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f3f4f6',
            color: '#1f2937'
        }}>
            <ShieldAlert size={64} color="#dc2626" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('auth.accessDenied')}</h1>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>{t('auth.noPermission')}</p>
            <button
                onClick={() => navigate('/login')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} />
                {t('auth.returnToLogin')}
            </button>
        </div>
    );
};

export default Unauthorized;
