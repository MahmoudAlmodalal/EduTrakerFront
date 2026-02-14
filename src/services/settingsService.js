import { api } from '../utils/api';

const settingsService = {
    getProfileSettings: (config) => api.get('/profile/update/', config),
    updateProfileSettings: (payload, config) => api.patch('/profile/update/', payload, config),
};

export default settingsService;
