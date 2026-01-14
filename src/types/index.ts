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

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  sex: 'M' | 'F';
  cpf: string;
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  healthInsurance?: string;
  hasFinancialResponsible: boolean;
  financialResponsible?: {
    name: string;
    cpf: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'consultation' | 'exam' | 'return' | 'procedure';
  status: AppointmentStatus;
  healthInsurance?: string;
  notes?: string;
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

export const APPOINTMENT_TYPE_LABELS: Record<Appointment['type'], string> = {
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
