'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface StaggerContextType {
  isVisible: boolean;
  staggerDelay: number;
  duration: number;
}

const StaggerContext = createContext<StaggerContextType>({
  isVisible: false,
  staggerDelay: 70,
  duration: 400,
});

export interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

export function StaggerContainer({
  children,
  staggerDelay = 70,
  duration = 450,
  threshold = 0.1,
  className = '',
  as: Component = 'div',
}: StaggerContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  return (
    <StaggerContext.Provider value={{ isVisible, staggerDelay, duration }}>
      <Component ref={domRef} className={className}>
        {children}
      </Component>
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
  as?: React.ElementType;
}

export function StaggerItem({
  children,
  index,
  className = '',
  as: Component = 'div',
}: StaggerItemProps) {
  const { isVisible, staggerDelay, duration } = useContext(StaggerContext);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)',
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transitionDelay: `${index * staggerDelay}ms`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  };

  return (
    <Component className={className} style={style}>
      {children}
    </Component>
  );
}
