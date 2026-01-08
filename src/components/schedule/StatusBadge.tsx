import { AppointmentStatus, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', `status-${status}`, className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
