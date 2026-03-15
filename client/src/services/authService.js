import http from './http';
import { API } from '../constants/api';
const authService = {
  register:      (data) => http.post(API.AUTH.REGISTER, data),
  login:         (data) => http.post(API.AUTH.LOGIN, data),
  getMe:         ()     => http.get(API.AUTH.ME),
  getProfile:    ()     => http.get(API.AUTH.PROFILE),
  updateProfile: (data) => http.put(API.AUTH.PROFILE, data),
};
export default authService;
