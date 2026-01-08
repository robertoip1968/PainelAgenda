import { Professional } from '@/types';
import { cn } from '@/lib/utils';

interface ProfessionalTabsProps {
  professionals: Professional[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function ProfessionalTabs({ professionals, selectedId, onSelect }: ProfessionalTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
          selectedId === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Todos
      </button>
      {professionals.map((prof) => (
        <button
          key={prof.id}
          onClick={() => onSelect(prof.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
            selectedId === prof.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {prof.name.split(' ')[0]} {prof.name.split(' ').slice(-1)[0]}
        </button>
      ))}
    </div>
  );
}
