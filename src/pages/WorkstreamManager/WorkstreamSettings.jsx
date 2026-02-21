import React from 'react';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../context/ThemeContext';

const WorkstreamSettings = () => {
  const { t } = useTheme();
  return (
    <UnifiedSettingsPage
      title={t('workstream.settings.title') || 'Workstream Settings'}
      subtitle={t('settings.subtitle') || 'Manage your profile, preferences, and security settings.'}
    />
  );
};

export default WorkstreamSettings;
