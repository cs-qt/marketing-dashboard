import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap { success, data } envelope
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth failure (unless already on login page)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

/** Extract `data` field from API response envelope */
export function unwrap<T>(response: { data: { success: boolean; data: T; message?: string; meta?: any } }): T {
  return response.data.data;
}

export default api;
