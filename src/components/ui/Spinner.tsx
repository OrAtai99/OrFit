interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block border-[3px] border-[var(--border)] border-t-primary rounded-full animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
