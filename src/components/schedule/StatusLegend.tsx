import { AppointmentStatus, STATUS_LABELS } from '@/types';

const statuses: AppointmentStatus[] = [
  'waiting',
  'confirmed',
  'queue',
  'in-progress',
  'completed',
  'absent',
];

export function StatusLegend() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium text-sm mb-3">Legenda</h3>
      <div className="space-y-2">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded status-${status}`} />
            <span className="text-sm text-muted-foreground">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
