"use client";

import { useEffect, useRef, useState } from "react";

const VISIBILITY_THRESHOLD = 0.12;

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

export function Reveal({ className = "", children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: VISIBILITY_THRESHOLD },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} {...rest} className={`${className} reveal${isVisible ? " in" : ""}`.trim()}>
      {children}
    </section>
  );
}
