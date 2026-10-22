import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverLift = false,
  style,
  ...rest
}) => {
  return (
    <div
      className={`glass-card ${hoverLift ? 'glass-card-hover' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
};
