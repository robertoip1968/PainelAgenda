import { AppointmentStatus, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const items: { status: AppointmentStatus; dotClass: string }[] = [
  { status: 'scheduled', dotClass: 'bg-blue-500' },
  { status: 'canceled', dotClass: 'bg-gray-500' },
  { status: 'rescheduled', dotClass: 'bg-yellow-500' },
  { status: 'done', dotClass: 'bg-green-500' },
  { status: 'no_show', dotClass: 'bg-black' },
];

export function StatusLegend() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium text-sm mb-3 text-foreground">Legenda</h3>
      <div className="space-y-2">
        {items.map(({ status, dotClass }) => (
          <div key={status} className="flex items-center gap-3">
            <div className={cn('w-4 h-4 rounded-sm border border-border/50 shrink-0', dotClass)} />
            <span className="text-sm text-foreground">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
