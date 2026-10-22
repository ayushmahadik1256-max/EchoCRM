import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  onStart,
  onStop,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center p-3">
        {isRecording && (
          <>
            <div
              className="animate-mic-wave-1 absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#EF4444]/60 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="animate-mic-wave-2 absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[#EF4444]/40 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute w-36 h-36 rounded-full bg-rose-400/10 blur-2xl pointer-events-none animate-pulse"
              aria-hidden="true"
            />
          </>
        )}

        {/* Ambient soft glow ring behind button */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 pointer-events-none ${
            isRecording ? 'bg-rose-400/30' : 'bg-[#1A73D9]/20'
          }`}
          aria-hidden="true"
        />

        {/* Outer Floating Glass Ring */}
        <div
          className="absolute -inset-1.5 rounded-full border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_4px_16px_rgba(26,115,217,0.12)] bg-white/40 backdrop-blur-md pointer-events-none transition-transform duration-200"
          aria-hidden="true"
        />

        {/* Tactile 3D Button Core */}
        <button
          type="button"
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          aria-label={
            isRecording
              ? 'Stop microphone voice dictation'
              : 'Start microphone voice dictation'
          }
          className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1A73D9] focus-visible:ring-offset-2 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.04] ${
            isRecording
              ? 'bg-[#EF4444] text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-3px_6px_rgba(153,27,27,0.35),0_8px_24px_rgba(239,68,68,0.35)] active:shadow-[0_2px_8px_rgba(239,68,68,0.3)]'
              : 'bg-[#1A73D9] hover:bg-[#155FB5] text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-3px_6px_rgba(21,95,181,0.4),0_8px_24px_rgba(26,115,217,0.32)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-3px_6px_rgba(21,95,181,0.5),0_12px_32px_rgba(26,115,217,0.4)] active:shadow-[0_2px_8px_rgba(26,115,217,0.25)]'
          }`}
        >
          {/* Radial Top-Left Light Highlight for 3D Bevel */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.7) 0%, transparent 60%)',
            }}
            aria-hidden="true"
          />

          {isRecording ? (
            <>
              <Square className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-xs" />
              <span className="text-[11px] font-bold mt-1 tracking-wider uppercase">
                Stop
              </span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] drop-shadow-xs" />
              <span className="text-[11px] font-bold mt-1 tracking-wider uppercase">
                Dictate
              </span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-[#0F172A]">
          {isRecording ? (
            <span className="text-[#EF4444] font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              Listening to voice notes…
            </span>
          ) : (
            <span className="text-[#5B6B7F]">
              Tap mic to dictate or type below
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
