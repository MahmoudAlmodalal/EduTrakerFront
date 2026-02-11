import React from 'react';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../context/ThemeContext';

const SecretarySettings = () => {
  const { t } = useTheme();
  return (
    <UnifiedSettingsPage
      title={t('secretary.settings.title') || 'Secretary Settings'}
      subtitle={t('secretary.settings.subtitle') || 'Manage your profile, preferences, and account security.'}
    />
  );
};

export default SecretarySettings;
