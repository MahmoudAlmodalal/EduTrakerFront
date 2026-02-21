import React from 'react';
import UnifiedSettingsPage from '../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../context/ThemeContext';

const SchoolManagerSettings = () => {
  const { t } = useTheme();

  return (
    <UnifiedSettingsPage
      title={t('school.settings.title') || "School Manager Settings"}
      subtitle={t('school.settings.subtitle') || "Manage your account preferences and security settings."}
    />
  );
};

export default SchoolManagerSettings;
