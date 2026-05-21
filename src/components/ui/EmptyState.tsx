import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon size={32} className="text-primary" />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
