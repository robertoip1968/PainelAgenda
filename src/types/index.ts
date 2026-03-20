// Reflete o campo `status` da tabela appointments
export type AppointmentStatus =
  | 'scheduled'
  | 'canceled'
  | 'rescheduled'
  | 'done'
  | 'no_show';

// Reflete a tabela `specialties`
export interface Specialty {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
}

// Reflete a tabela `professionals`
export type ProfessionalArea = 'medica' | 'odontologica' | 'laboratorial';

export const AREA_LABELS: Record<ProfessionalArea, string> = {
  medica: 'Médica',
  odontologica: 'Odontológica',
  laboratorial: 'Laboratorial',
};


export interface Professional {
  id: number;
  full_name: string;
  area: ProfessionalArea;
  specialty_id: number;
  numero_conselho: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // campo auxiliar para exibição
  specialtyName?: string;
}

// Reflete a tabela `clients`
export interface Patient {
  id: number;
  full_name: string;
  cpf: string;
  birth_date: string;
  sex: string;
  phone: string;
  email: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state_uf?: string;
  insurance_plan_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Reflete a tabela `appointments`
export interface Appointment {
  id: string; // uuid
  cliente_nome: string;
  cliente_telefone?: string;
  tipo: string;
  inicio: string; // timestamptz
  fim?: string;   // timestamptz
  status: AppointmentStatus;
  observacao?: string;
  protocolo?: string;
  confirmado?: boolean;
  confirmado_em?: string;
  professional_id?: number;
  service_id?: number;
  reminder_24h_sent_at?: string;
  reminder_2h_sent_at?: string;
  created_at?: string;
  updated_at?: string;
  // campos auxiliares para compatibilidade de exibição
  professionalName?: string;
  date: string;
  time: string;
  healthInsurance?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

// Labels em PT alinhados ao CHECK do DB
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  canceled: 'Cancelado',
  rescheduled: 'Reagendado',
  done: 'Atendido',
  no_show: 'Falta',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  exam: 'Exame',
  return: 'Retorno',
  procedure: 'Procedimento',
};

export interface WhatsAppMessage {
  id: string;
  phone: string;
  client: string;
  direction: 'sent' | 'received';
  text: string;
  intent: string;
  dateTime: Date;
}

export interface HealthInsurance {
  id: string;
  name: string;
  active: boolean;
}

// ─── Dashboard ──────────────────────────────────────
export type DashboardCategory =
  | 'contatos'
  | 'agendamentos'
  | 'confirmacoes'
  | 'cancelamentos'
  | 'reagendamentos'
  | 'no_show';

export interface DashboardChartItem {
  key: DashboardCategory;
  name: string;
  value: number;
  color: string;
}

export interface PendingConfirmationItem {
  id: string;
  cliente_nome: string;
  professional_name: string;
  inicio: string;
  tipo: string;
}

export interface DashboardOverview {
  chart: DashboardChartItem[];
  pendingConfirmations: PendingConfirmationItem[];
}

export interface DashboardDetailItem {
  id: string;
  name: string;
  info: string;
  date: string;
  time: string;
  type: string;
  status_text: string;
  appointment_status?: AppointmentStatus | null;
}

export type ClinicSettings = {
  clinic_name: string
  cnpj: string
  phone: string
  address: string
}

export type AgendaSettings = {
  weekday_start_time: string
  weekday_end_time: string
  saturday_start_time: string
  saturday_end_time: string
  interval_minutes: number
  default_duration_minutes: number
  open_sun: boolean
  open_mon: boolean
  open_tue: boolean
  open_wed: boolean
  open_thu: boolean
  open_fri: boolean
  open_sat: boolean
}
