import React from 'react';

export interface FloatingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  className = '',
  elevated = true,
  style,
  ...rest
}) => {
  return (
    <div
      className={`glass-panel transition-all duration-200 ${
        elevated ? 'shadow-[0_12px_36px_rgba(26,115,217,0.08)]' : 'shadow-2xs'
      } ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
};
