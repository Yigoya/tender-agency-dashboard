import axios from 'axios';
import { AgencyRegistration, Agency, Tender, TenderCreate, TenderUpdate, AgencyStatistics, ServiceCategory, LoginRequest, LoginResponse } from '../types/api';

const API_URL = 'https://hulumoya.zapto.org';
// const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor to handle token expiration
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('userId');
//       localStorage.removeItem('agencyProfile');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export const agencyApi = {
  register: (data: AgencyRegistration) => 
    api.post<Agency>('/tender-agencies/register', data),
  
  getProfile: (agencyId: number) =>
    api.get<Agency>(`/tender-agencies/${agencyId}/profile`),
  
  updateProfile: (agencyId: number, data: Partial<Agency>) =>
    api.put<Agency>(`/tender-agencies/${agencyId}/profile`, data),
  
  uploadLicense: (agencyId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<string>(`/tender-agencies/${agencyId}/license`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getStatistics: (agencyId: number) =>
    api.get<AgencyStatistics>(`/tender-agencies/${agencyId}/statistics`),
};

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  verifyEmail: (token: string) => api.get<LoginResponse>(`/auth/verify`, { params: { token } }),
  resendVerification: (email: string) => api.post<void>(`/auth/resend-verification`, undefined, { params: { email } }),
};

export const tenderApi = {
  create: (agencyId: number, data: TenderCreate) =>
    api.post<Tender>(`/tender-agencies/${agencyId}/tenders`, data),
  
  getAll: (agencyId: number, page = 0, size = 10, sort = 'datePosted,desc') =>
    api.get<Tender[]>(`/tender-agencies/${agencyId}/tenders`, {
      params: { page, size, sort },
    }),
  
  getOne: (agencyId: number, tenderId: number) =>
    api.get<Tender>(`/tender-agencies/${agencyId}/tenders/${tenderId}`),
  
  update: (agencyId: number, tenderId: number, data: TenderUpdate) =>
    api.put<Tender>(`/tender-agencies/${agencyId}/tenders/${tenderId}`, data),
  
  uploadDocument: (agencyId: number, tenderId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<string>(
      `/tender-agencies/${agencyId}/tenders/${tenderId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  
  updateStatus: (agencyId: number, tenderId: number, status: Tender['status']) =>
    api.patch<Tender>(
      `/tender-agencies/${agencyId}/tenders/${tenderId}/status`,
      { status }
    ),
  
  delete: (agencyId: number, tenderId: number) =>
    api.delete(`/tender-agencies/${agencyId}/tenders/${tenderId}`),
};

export const adminApi = {
  // Fetch all services/categories from admin endpoint
  getServices: () => api.get<ServiceCategory[]>(`/admin/services`),
};

export default api;