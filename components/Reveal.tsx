"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

type Props = {
  children: React.ReactNode;
  /** stagger in ms */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  /** already on screen at load: shown in the static HTML, no wait for scripts */
  instant?: boolean;
};

export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  style,
  id,
  instant = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(instant);

  useEffect(() => {
    const el = ref.current;
    if (!el || instant) return;

    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [instant]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${shown ? "in" : ""} ${className}`}
      style={{ ...style, "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
