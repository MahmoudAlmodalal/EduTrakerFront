import { api } from '../utils/api';

const broadcastService = {
    getTodayBroadcasts: async () => {
        return api.get('/user-messages/broadcasts/today/');
    }
};

export default broadcastService;
