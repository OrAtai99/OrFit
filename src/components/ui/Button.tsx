import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]",
  secondary: "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.98]",
  danger: "bg-danger text-white hover:bg-danger-dark active:scale-[0.98]",
  success: "bg-success text-white hover:bg-success-dark active:scale-[0.98]",
  ghost: "text-muted hover:bg-[var(--border)]/30 active:scale-[0.98]",
  outline: "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)]/30 active:scale-[0.98]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "min-h-[52px] px-5 text-base font-bold rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, disabled, children, className = "", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all",
        "disabled:opacity-50 disabled:active:scale-100",
        VARIANT[variant],
        SIZE[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
});
