"use client";

import { useEffect, useRef, useState } from "react";

// Fades and slides its children up into place the first time they scroll
// into view, then leaves them there. Shown straight away for anyone who
// has asked their device for reduced motion.
export default function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      // Waits until a fifth of it is on screen, so the fade is seen.
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
