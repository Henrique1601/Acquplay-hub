// components/ui/GlassCard.tsx
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  className?: string;
  as?: React.ElementType;
}

export function GlassCard({
  children,
  variant = 'default',
  className = '',
  as: Component = 'div',
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: 'glass-panel rounded-2xl',
    elevated: 'glass-panel-elevated rounded-2xl',
    subtle: 'bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-sm'
  };

  return (
    <Component
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
