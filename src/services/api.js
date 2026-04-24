// src/services/api.js – Axios instance with JWT interceptors
import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'https://conference-reviewer.onrender.com') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('crToken');
      localStorage.removeItem('crUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
