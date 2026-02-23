// Reflete o campo `status` da tabela appointments
export type AppointmentStatus = 
  | 'waiting' 
  | 'confirmed' 
  | 'queue' 
  | 'in-progress' 
  | 'completed' 
  | 'absent';

// Reflete a tabela `specialties`
export interface Specialty {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
}

// Reflete a tabela `professionals`
export type ProfessionalArea = 'medico' | 'dentista' | 'exame';

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

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  'waiting': 'Aguardando Confirmação',
  'confirmed': 'Confirmado',
  'queue': 'Aguardando Atendimento',
  'in-progress': 'Em Atendimento',
  'completed': 'Atendido',
  'absent': 'Falta',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  'consultation': 'Consulta',
  'exam': 'Exame',
  'return': 'Retorno',
  'procedure': 'Procedimento',
};

export const AREA_LABELS: Record<ProfessionalArea, string> = {
  'medico': 'Médico',
  'dentista': 'Dentista',
  'exame': 'Exame',
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
