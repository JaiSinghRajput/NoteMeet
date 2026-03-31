import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const meetingApi = {
  create: (title: string) => api.post('/api/meetings', { title }),
  getAll: () => api.get('/api/meetings'),
  getById: (id: string) => api.get(`/api/meetings/${id}`),
  getByRoomId: (roomId: string) => api.get(`/api/meetings/room/${roomId}`),
  updateStatus: (id: string, status: string) => api.patch(`/api/meetings/${id}/status`, { status }),
};

export const aiApi = {
  uploadAudio: (formData: FormData) =>
    api.post('/api/ai/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTranscript: (meetingId: string) => api.get(`/api/ai/transcript/${meetingId}`),
  getSummary: (meetingId: string) => api.get(`/api/ai/summary/${meetingId}`),
};

export default api;
