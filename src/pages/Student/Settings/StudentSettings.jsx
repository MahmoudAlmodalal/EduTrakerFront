import React from 'react';
import UnifiedSettingsPage from '../../../components/settings/UnifiedSettingsPage';
import { useTheme } from '../../../context/ThemeContext';

const StudentSettings = () => {
  const { t } = useTheme();
  return (
    <UnifiedSettingsPage
      title={t('student.settings.title') || 'Student Settings'}
      subtitle="Manage your profile, preferences, and account security settings."
    />
  );
};

export default StudentSettings;
