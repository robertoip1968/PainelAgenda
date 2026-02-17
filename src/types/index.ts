// Reflete o campo `status` da tabela appointments
export type AppointmentStatus = 
  | 'waiting' 
  | 'confirmed' 
  | 'queue' 
  | 'in-progress' 
  | 'completed' 
  | 'absent';

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  crm?: string;
  cro?: string;
  email: string;
  phone: string;
  avatar?: string;
}

// Reflete a tabela `clients`
export interface Patient {
  id: string;
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
}

// Reflete a tabela `appointments`
export interface Appointment {
  id: string;
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
  professional_id?: string;
  professionalName?: string; // nome para exibição
  service_id?: number;
  // campos auxiliares para compatibilidade de exibição
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
