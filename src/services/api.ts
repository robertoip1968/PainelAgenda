import { Professional, Patient, Appointment, Specialty, HealthInsurance } from '@/types';

/**
 * Base URL da API backend.
 * Em produção: /api (proxy do Apache)
 * Em dev: pode apontar para localhost:3000/api
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': getTenantSlug(),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }

  return res.json();
}

function getTenantSlug(): string {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant') || '';
  }
  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] : '';
}

// ─── Profissionais ──────────────────────────────────
export const professionalsApi = {
  list: () => request<Professional[]>('/professionals'),
  getById: (id: number) => request<Professional>(`/professionals/${id}`),
  create: (data: Partial<Professional>) =>
    request<Professional>('/professionals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Professional>) =>
    request<Professional>(`/professionals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/professionals/${id}`, { method: 'DELETE' }),
};

// ─── Pacientes ──────────────────────────────────────
export const patientsApi = {
  list: () => request<Patient[]>('/patients'),
  getById: (id: number) => request<Patient>(`/patients/${id}`),
  create: (data: Partial<Patient>) =>
    request<Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Patient>) =>
    request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/patients/${id}`, { method: 'DELETE' }),
};

// ─── Agendamentos ───────────────────────────────────
export const appointmentsApi = {
  list: (params?: { date?: string; professional_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.professional_id) query.set('professional_id', String(params.professional_id));
    const qs = query.toString();
    return request<Appointment[]>(`/appointments${qs ? `?${qs}` : ''}`);
  },
  create: (data: Partial<Appointment>) =>
    request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Appointment>) =>
    request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) =>
    request<void>(`/appointments/${id}`, { method: 'DELETE' }),
};

// ─── Especialidades ─────────────────────────────────
export const specialtiesApi = {
  list: () => request<Specialty[]>('/specialties'),
  create: (data: Partial<Specialty>) =>
    request<Specialty>('/specialties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Specialty>) =>
    request<Specialty>(`/specialties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Convênios ──────────────────────────────────────
export const healthInsurancesApi = {
  list: () => request<HealthInsurance[]>('/health-insurances'),
  create: (data: Partial<HealthInsurance>) =>
    request<HealthInsurance>('/health-insurances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<HealthInsurance>) =>
    request<HealthInsurance>(`/health-insurances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Dashboard ──────────────────────────────────────
export const dashboardApi = {
  stats: () => request<{ appointments_today: number; patients_total: number; professionals_active: number; avg_wait_time: string }>('/dashboard/stats'),
};
