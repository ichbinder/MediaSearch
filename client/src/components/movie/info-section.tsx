import type { LucideIcon } from "lucide-react";

interface InfoSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function InfoSection({ title, icon: Icon, children }: InfoSectionProps) {
  if (!children) return null;

  return (
    <div className="flex items-start gap-2 mb-4">
      <Icon className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
