import React, { useEffect } from 'react';
import { X, LogIn, ShieldCheck } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  signingIn: boolean;
  error?: string | null;
  reason?: string;
}

const GoogleMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  signingIn,
  error,
  reason,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !signingIn) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, signingIn, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
    >
      <div
        className="absolute inset-0 bg-[#0F172A]/35 backdrop-blur-sm"
        onClick={() => {
          if (!signingIn) onClose();
        }}
        aria-hidden="true"
      />

      <GlassCard className="relative w-full max-w-sm bg-white/97 border border-white/95 rounded-3xl shadow-[0_24px_60px_rgba(26,115,217,0.22)] p-7 text-center animate-fadeIn">
        <button
          type="button"
          onClick={onClose}
          disabled={signingIn}
          className="absolute top-4 right-4 p-1.5 text-[#5B6B7F] hover:text-[#0F172A] hover:bg-[#F3F9FF] rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Close sign-in"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#E4F1FF] to-white border border-[#CFE6FF] flex items-center justify-center text-[#1A73D9] shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_6px_16px_rgba(26,115,217,0.12)]">
          <LogIn className="w-5 h-5" />
        </div>

        <h2 id="signin-title" className="mt-4 text-xl font-extrabold tracking-tight text-[#0F172A]">
          Sign in to EchoCRM
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#5B6B7F]">
          {reason ||
            'Sign in with Google to save debriefs to your account and access them on any device.'}
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSignIn}
          disabled={signingIn}
          autoFocus
          className="mt-6 w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1A73D9] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#155FB5] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
        >
          {signingIn ? (
            <span>Signing in…</span>
          ) : (
            <>
              <GoogleMark className="w-4 h-4" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#5B6B7F]">
          <ShieldCheck className="w-3 h-3 text-[#1A73D9]" />
          <span>Your debriefs and templates stay private to your account.</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={signingIn}
          className="mt-4 text-[11px] font-semibold text-[#5B6B7F] hover:text-[#0F172A] underline underline-offset-2 cursor-pointer disabled:opacity-40"
        >
          Keep browsing
        </button>
      </GlassCard>
    </div>
  );
};
