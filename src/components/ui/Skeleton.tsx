interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUND: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", width, height, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`bg-[var(--border)]/60 animate-pulse ${ROUND[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <Skeleton height={16} width="40%" />
      <Skeleton height={28} width="60%" />
    </div>
  );
}
