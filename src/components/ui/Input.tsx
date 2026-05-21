import { forwardRef } from "react";

type Size = "sm" | "md" | "lg";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: Size;
  error?: boolean;
}

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-3 rounded-xl",
  lg: "h-12 px-4 rounded-xl text-lg",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", error, className = "", type = "text", dir, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      dir={dir ?? (type === "number" ? "ltr" : undefined)}
      className={[
        "w-full bg-[var(--background)] border focus:outline-none focus:border-primary transition-colors",
        SIZE[inputSize],
        error ? "border-danger" : "border-[var(--border)]",
        className,
      ].join(" ")}
      {...rest}
    />
  );
});

interface FieldProps {
  label: string;
  children: React.ReactNode;
  labelWidth?: number;
}

export function Field({ label, children, labelWidth = 24 }: FieldProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        className="text-sm text-muted shrink-0"
        style={{ width: `${labelWidth * 4}px` }}
      >
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
