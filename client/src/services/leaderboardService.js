import http from './http';
import { API } from '../constants/api';
const leaderboardService = {
  get: (type = 'xp') => http.get(API.LEADERBOARD.BY_TYPE(type)),
};
export default leaderboardService;
