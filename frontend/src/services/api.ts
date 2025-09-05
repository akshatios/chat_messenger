import axios from 'axios';
import { LoginCredentials, RegisterCredentials, MessageFormData, FileMessageData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  register: (credentials: RegisterCredentials) => api.post('/auth/register', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const userAPI = {
  searchUsers: (query: string) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  getUserById: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  addContact: (userId: string) => api.post(`/users/contacts/${userId}`),
  removeContact: (userId: string) => api.delete(`/users/contacts/${userId}`),
  getContacts: () => api.get('/users/contacts/list'),
};

export const messageAPI = {
  getMessages: (recipientId: string, page = 1, limit = 50) => 
    api.get(`/messages/${recipientId}?page=${page}&limit=${limit}`),
  sendMessage: (data: MessageFormData) => api.post('/messages/send', data),
  sendFile: (data: FileMessageData) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('recipientId', data.recipientId);
    return api.post('/messages/send-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  getConversations: () => api.get('/messages/conversations/list'),
};

export default api;
