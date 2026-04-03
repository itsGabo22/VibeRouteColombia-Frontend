import axios from 'axios';
import { useAuthStore } from '../../app/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// For simplicity, skip intercepting 401s to auto-logout in this adelanto
export default api;
