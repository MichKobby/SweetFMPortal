// API helper functions for future backend integration
// Currently using mock data, but structured for easy backend connection

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    return {
      data: response.ok ? data : undefined,
      error: !response.ok ? data.message || 'An error occurred' : undefined,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    };
  }
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string, role: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Client endpoints
export const clientApi = {
  getAll: () => apiRequest('/clients'),
  getById: (id: string) => apiRequest(`/clients/${id}`),
  create: (data: any) => apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/clients/${id}`, { method: 'DELETE' }),
};

// Employee endpoints
export const employeeApi = {
  getAll: () => apiRequest('/employees'),
  getById: (id: string) => apiRequest(`/employees/${id}`),
  create: (data: any) => apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/employees/${id}`, { method: 'DELETE' }),
};

// Expense endpoints
export const expenseApi = {
  getAll: () => apiRequest('/expenses'),
  create: (data: any) => apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/expenses/${id}`, { method: 'DELETE' }),
};

// Schedule endpoints
export const scheduleApi = {
  getAll: () => apiRequest('/schedule'),
  create: (data: any) => apiRequest('/schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/schedule/${id}`, { method: 'DELETE' }),
};

// Report endpoints
export const reportApi = {
  generate: (type: string, params: any) => apiRequest('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ type, params }),
  }),
  download: (id: string, format: 'pdf' | 'csv') =>
    apiRequest(`/reports/${id}/download?format=${format}`),
};
