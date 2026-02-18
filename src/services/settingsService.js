import { api } from '../utils/api';

const withNoOfflineQueue = (config) => ({
    ...(config || {}),
    _skipOfflineQueue: true,
});

const settingsService = {
    getProfileSettings: (config) => api.get('/profile/update/', config),
    updateProfileSettings: (payload, config) => api.patch('/profile/update/', payload, config),
    updateSecuritySettings: (payload, config) => api.patch('/profile/update/', payload, withNoOfflineQueue(config)),
};

export default settingsService;
