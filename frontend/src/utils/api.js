import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send cookies automatically
});

// Response interceptor for token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes('/auth/me') &&
//       !originalRequest.url.includes('/auth/refresh')
//     ) {
//       originalRequest._retry = true;

//       try {
//         await api.post('/auth/refresh');
//         return api(originalRequest);
//       } catch {
//         // HARD STOP — no retries
//         window.location.href = '/login';
//         return Promise.reject(error);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default api;