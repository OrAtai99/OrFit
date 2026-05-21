"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, decimals = 0, duration = 600, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const start = useRef(value);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    start.current = display;
    startTime.current = null;

    const target = value;
    const initial = display;

    function step(t: number) {
      if (startTime.current === null) startTime.current = t;
      const elapsed = t - startTime.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = initial + (target - initial) * eased;
      setDisplay(next);
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</span>;
}
