interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "danger" | "success" | "primary";
  noPadding?: boolean;
}

export function Card({ variant = "default", noPadding, className = "", children, ...rest }: CardProps) {
  const variantCls =
    variant === "danger"
      ? "border-danger/50 bg-danger/10"
      : variant === "success"
      ? "border-success/50 bg-success/10"
      : variant === "primary"
      ? "border-primary/50 bg-primary/5"
      : "";
  return (
    <div
      className={[
        "bg-[var(--card)] border border-[var(--border)] rounded-2xl",
        noPadding ? "" : "p-4",
        variantCls,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
