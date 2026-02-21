import React from 'react';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../context/ThemeContext';

const SystemSettings = () => {
    const { t } = useTheme();

    return (
        <UnifiedSettingsPage
            title={t('settings.title') || 'System Settings'}
            subtitle={t('settings.subtitle')}
        />
    );
};

export default SystemSettings;
