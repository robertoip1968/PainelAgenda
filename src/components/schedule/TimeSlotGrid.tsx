import { Appointment, AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TimeSlotGridProps {
  appointments: Appointment[];
  onSlotClick: (time: string, appointment?: Appointment) => void;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

const statusColors: Record<AppointmentStatus, string> = {
  'waiting': 'bg-status-waiting/20 border-l-status-waiting',
  'confirmed': 'bg-status-confirmed/20 border-l-status-confirmed',
  'queue': 'bg-status-queue/20 border-l-status-queue',
  'in-progress': 'bg-status-in-progress/20 border-l-status-in-progress',
  'completed': 'bg-status-completed/20 border-l-status-completed',
  'absent': 'bg-status-absent/20 border-l-status-absent',
};

export function TimeSlotGrid({
  appointments,
  onSlotClick,
  startHour = 7,
  endHour = 19,
  intervalMinutes = 15,
}: TimeSlotGridProps) {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour && minute > 0) break;
      slots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }

  const getAppointmentForSlot = (time: string) => {
    return appointments.find((apt) => apt.time === time);
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[80px_1fr] font-medium text-sm bg-muted/50 border-b border-border">
        <div className="p-3 text-muted-foreground">Horário</div>
        <div className="p-3">Agendamentos</div>
      </div>

      <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
        {slots.map((time) => {
          const appointment = getAppointmentForSlot(time);
          
          return (
            <div
              key={time}
              onClick={() => onSlotClick(time, appointment)}
              className={cn(
                "grid grid-cols-[80px_1fr] border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer",
                appointment && statusColors[appointment.status],
                appointment && "border-l-4"
              )}
            >
              <div className="p-3 text-sm font-medium text-muted-foreground border-r border-border">
                {time}
              </div>
              <div className="p-3 min-h-[48px]">
                {appointment && (
                  <div className="animate-fade-in">
                    <p className="font-medium text-sm">{appointment.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.professionalName} • {appointment.type === 'consultation' ? 'Consulta' : appointment.type === 'exam' ? 'Exame' : appointment.type === 'return' ? 'Retorno' : 'Procedimento'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
