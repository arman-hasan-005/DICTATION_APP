import axios from 'axios';

const PUBLIC_PATHS = new Set([
  '/login', '/register',
  '/verify-email', '/forgot-password', '/reset-password',
  '/auth/google/success',
  '/google/verify-otp', '/google/complete-profile',
]);

const isPublicPage = () => PUBLIC_PATHS.has(window.location.pathname);

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRedirecting = false;

http.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data)
      res.data = res.data.data;
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!isPublicPage() && !isRedirecting) {
        isRedirecting = true;
        window.location.href = '/login';
        setTimeout(() => { isRedirecting = false; }, 2000);
      }
    }
    return Promise.reject(err);
  },
);

export default http;
