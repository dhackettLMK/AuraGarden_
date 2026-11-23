"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Rolls a number up like an odometer (brief 7.5, 400 ms). Interpolates the
 * value itself, so a single award of hundreds of thousands stays smooth.
 */
export function Odometer({
  value,
  format,
  duration = 0.4,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v;
        setShown(Math.round(v));
      },
      onComplete: () => {
        from.current = value;
      },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);
  return <>{format(shown)}</>;
}
