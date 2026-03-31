import http from './http';
import { API } from '../constants/api';

const sessionService = {
  save:    (data)               => http.post(API.SESSIONS.BASE, data),
  getAll:  ({ page = 1, limit = 20 } = {}) =>
    http.get(`${API.SESSIONS.BASE}?page=${page}&limit=${limit}`),
  getById: (id)                 => http.get(API.SESSIONS.BY_ID(id)),
  getStats:(days = 30)          => http.get(`${API.SESSIONS.STATS}?days=${days}`),
};

export default sessionService;
