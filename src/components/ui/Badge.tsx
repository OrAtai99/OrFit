type Variant = "primary" | "success" | "danger" | "warning" | "muted";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  muted: "bg-[var(--border)]/40 text-muted",
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "muted", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold",
        VARIANT[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
