import http from './http';
import { API } from '../constants/api';
const sessionService = {
  save:    (data) => http.post(API.SESSIONS.BASE, data),
  getAll:  ()     => http.get(API.SESSIONS.BASE),
  getById: (id)   => http.get(API.SESSIONS.BY_ID(id)),
};
export default sessionService;
