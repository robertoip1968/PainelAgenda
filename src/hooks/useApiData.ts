import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  professionalsApi,
  patientsApi,
  appointmentsApi,
  specialtiesApi,
  healthInsurancesApi,
  dashboardApi,
  messagesApi,
} from '@/services/api';
import { Professional, Patient, Appointment, Specialty, HealthInsurance } from '@/types';

// ─── Profissionais ──────────────────────────────────
export function useProfessionals() {
  return useQuery({ queryKey: ['professionals'], queryFn: professionalsApi.list });
}

export function useProfessional(id: number) {
  return useQuery({ queryKey: ['professionals', id], queryFn: () => professionalsApi.getById(id), enabled: !!id });
}

export function useSaveProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: number } & Partial<Professional>) =>
      data.id ? professionalsApi.update(data.id, data) : professionalsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

// ─── Pacientes ──────────────────────────────────────
export function usePatients() {
  return useQuery({ queryKey: ['patients'], queryFn: patientsApi.list });
}

export function usePatient(id: number) {
  return useQuery({ queryKey: ['patients', id], queryFn: () => patientsApi.getById(id), enabled: !!id });
}

export function useSavePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: number } & Partial<Patient>) =>
      data.id ? patientsApi.update(data.id, data) : patientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

// ─── Agendamentos ───────────────────────────────────
export function useAppointments(params?: { date?: string; professional_id?: number }) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.list(params),
  });
}

export function useSaveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string } & Partial<Appointment>) =>
      data.id ? appointmentsApi.update(data.id, data) : appointmentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// ─── Especialidades ─────────────────────────────────
export function useSpecialties() {
  return useQuery({ queryKey: ['specialties'], queryFn: specialtiesApi.list });
}

export function useSaveSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: number } & Partial<Specialty>) =>
      data.id ? specialtiesApi.update(data.id, data) : specialtiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  });
}

// ─── Convênios ──────────────────────────────────────
export function useHealthInsurances() {
  return useQuery({ queryKey: ['healthInsurances'], queryFn: healthInsurancesApi.list });
}

export function useSaveHealthInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string } & Partial<HealthInsurance>) =>
      data.id ? healthInsurancesApi.update(data.id, data) : healthInsurancesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['healthInsurances'] }),
  });
}

// ─── Dashboard ──────────────────────────────────────
export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.stats });
}

// ─── Mensagens (WhatsApp) ─────────────────────────
export function useMessages(params?: {
  phone?: string;
  client?: string;
  direction?: 'all' | 'received' | 'sent';
  intent?: string;
  date?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['messages', params],
    queryFn: () => messagesApi.list(params),
  });
}
