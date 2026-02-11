import React from 'react';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../context/ThemeContext';

const GuardianSettings = () => {
  const { t } = useTheme();
  return (
    <UnifiedSettingsPage
      title={t('guardian.settings.title') || 'Guardian Settings'}
      subtitle="Manage your profile, preferences, and account security settings."
    />
  );
};

export default GuardianSettings;
