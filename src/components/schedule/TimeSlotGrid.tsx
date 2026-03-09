import { Appointment, AppointmentStatus, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

interface TimeSlotGridProps {
  appointments: Appointment[];
  onSlotClick: (time: string, appointment?: Appointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: AppointmentStatus) => void;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

// Cores conforme sua regra:
// scheduled (azul), canceled (cinza), rescheduled (amarelo), done (verde), no_show (preto)
const statusRowClasses: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-50/70 border-l-blue-600',
  canceled: 'bg-gray-50/70 border-l-gray-500',
  rescheduled: 'bg-yellow-50/70 border-l-yellow-500',
  done: 'bg-green-50/70 border-l-green-600',
  no_show: 'bg-black/10 border-l-black',
};

const statusDotClasses: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500',
  canceled: 'bg-gray-500',
  rescheduled: 'bg-yellow-500',
  done: 'bg-green-500',
  no_show: 'bg-black',
};

const allStatuses: AppointmentStatus[] = [
  'scheduled',
  'canceled',
  'rescheduled',
  'done',
  'no_show',
];

export function TimeSlotGrid({
  appointments,
  onSlotClick,
  onStatusChange,
  startHour = 7,
  endHour = 19,
  intervalMinutes = 15,
}: TimeSlotGridProps) {
  const slots: string[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour && minute > 0) break;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  const getAppointmentForSlot = (time: string) => {
    return appointments.find((apt) => apt.time === time);
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    if (onStatusChange) {
      onStatusChange(appointmentId, newStatus);
    }
    toast.success(`Status alterado para: ${STATUS_LABELS[newStatus]}`);
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[80px_1fr_48px] font-medium text-sm bg-muted/50 border-b border-border">
        <div className="p-3 text-muted-foreground">Horário</div>
        <div className="p-3">Agendamentos</div>
        <div className="p-3 text-muted-foreground text-center">Ações</div>
      </div>

      <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
        {slots.map((time) => {
          const appointment = getAppointmentForSlot(time);

          return (
            <div
              key={time}
              className={cn(
                'grid grid-cols-[80px_1fr_48px] border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors',
                appointment && statusRowClasses[appointment.status],
                appointment && 'border-l-4'
              )}
            >
              <div
                onClick={() => onSlotClick(time, appointment)}
                className="p-3 text-sm font-medium text-muted-foreground border-r border-border cursor-pointer"
              >
                {time}
              </div>

              <div
                onClick={() => onSlotClick(time, appointment)}
                className="p-3 min-h-[48px] cursor-pointer"
              >
                {appointment && (
                  <div className="animate-fade-in">
                    <p className="font-medium text-sm">{appointment.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.professionalName} •{' '}
                      {appointment.tipo === 'consultation'
                        ? 'Consulta'
                        : appointment.tipo === 'exam'
                        ? 'Exame'
                        : appointment.tipo === 'return'
                        ? 'Retorno'
                        : 'Procedimento'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2 flex items-center justify-center border-l border-border">
                {appointment && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-52 bg-popover">
                      {allStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appointment.id, status);
                          }}
                          className={cn(
                            'flex items-center gap-2 cursor-pointer',
                            appointment.status === status && 'bg-muted'
                          )}
                        >
                          <div className={cn('w-3 h-3 rounded-sm shrink-0', statusDotClasses[status])} />
                          <span>{STATUS_LABELS[status]}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
