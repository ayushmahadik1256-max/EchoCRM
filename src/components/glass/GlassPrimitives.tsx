import React from 'react';

// GlassButton
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...rest
}) => {
  // UI/UX Pro Max: Minimum touch target size is 44px (iOS standard)
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-xl gap-2 min-h-[44px] min-w-[44px]',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2 min-h-[48px] min-w-[48px]',
    lg: 'px-6 py-3 text-base font-semibold rounded-xl gap-2 min-h-[56px] min-w-[56px]',
  }[size];

  // UI/UX Pro Max: Active scale for interaction feedback, stable interaction states
  const variantClasses = {
    primary:
      'bg-[#1A73D9] hover:bg-[#155FB5] text-white shadow-[0_2px_10px_rgba(26,115,217,0.3)] hover:shadow-[0_4px_16px_rgba(26,115,217,0.4)] active:scale-[0.98]',
    secondary:
      'glass-button-secondary font-medium active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[#F3F9FF] text-[#5B6B7F] hover:text-[#1A73D9] active:scale-[0.98]',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs active:scale-[0.98]',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A73D9] ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// GlassInput
export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  icon,
  hint,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#0F172A] flex items-center gap-1.5"
        >
          {icon && <span className="text-[#1A73D9]" aria-hidden="true">{icon}</span>}
          <span>{label}</span>
        </label>
      )}
      <input
        id={inputId}
        // UI/UX Pro Max: Minimum height of 44px for text inputs
        className={`w-full px-4 py-2.5 min-h-[44px] text-sm text-[#0F172A] glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A73D9]/20 transition-all placeholder:text-[#94A3B8] ${className}`}
        {...rest}
      />
      {hint && <p className="text-xs text-[#5B6B7F]">{hint}</p>}
    </div>
  );
};
