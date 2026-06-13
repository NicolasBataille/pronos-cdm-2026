"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  /** Durée de l'animation en ms */
  duration?: number;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Chiffre qui s'anime depuis sa valeur précédente — effet tableau d'affichage. */
export function AnimatedNumber({ value, className, duration = 650 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = from + (value - from) * easeOut(progress);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={`num ${className ?? ""}`}>{Math.round(display)}</span>;
}
