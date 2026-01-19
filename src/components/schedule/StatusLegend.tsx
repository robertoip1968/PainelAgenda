import { AppointmentStatus, STATUS_LABELS } from '@/types';

const statuses: { status: AppointmentStatus; colorVar: string }[] = [
  { status: 'waiting', colorVar: 'var(--status-waiting)' },
  { status: 'confirmed', colorVar: 'var(--status-confirmed)' },
  { status: 'queue', colorVar: 'var(--status-queue)' },
  { status: 'in-progress', colorVar: 'var(--status-in-progress)' },
  { status: 'completed', colorVar: 'var(--status-completed)' },
  { status: 'absent', colorVar: 'var(--status-absent)' },
];

export function StatusLegend() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium text-sm mb-3 text-foreground">Legenda</h3>
      <div className="space-y-2">
        {statuses.map(({ status, colorVar }) => (
          <div key={status} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-sm border border-border/50 shrink-0" 
              style={{ backgroundColor: `hsl(${colorVar})` }}
            />
            <span className="text-sm text-foreground">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
