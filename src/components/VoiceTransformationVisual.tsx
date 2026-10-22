import React from 'react';
import { Mic, Sparkles, CheckCircle2, Calendar, FileText, ArrowUpRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { TiltCard } from './TiltCard';

export const VoiceTransformationVisual: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[460px] mx-auto select-none depth-stage ${className}`}>
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#CFE6FF]/40 via-[#E4F1FF]/60 to-[#FFFFFF]/80 rounded-3xl blur-2xl pointer-events-none -z-10" />

      <TiltCard maxTilt={8} scale={1.02} className="relative z-10">
      <GlassCard className="p-6 bg-white/80 border border-white/95 shadow-[0_24px_60px_rgba(26,115,217,0.16)] relative z-10 space-y-4">
        {/* Top Status Bar: Voice Recording Active */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4F1FF]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A73D9] animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A73D9] relative" />
            </div>
            <span className="text-xs font-semibold text-[#0F172A] tracking-tight">
              Post-Call Voice Debrief
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F1FF] text-[#1A73D9] border border-[#CFE6FF]">
              01:42
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-[#5B6B7F]">
            <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
            <span>Gemini 2.5</span>
          </div>
        </div>

        {/* Audio Waveform Bars Visualization (Clean CSS, No 3D Canvas) */}
        <div className="bg-[#F3F9FF] p-3 rounded-xl border border-[#CFE6FF]/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#CFE6FF] flex items-center justify-center text-[#1A73D9] shadow-2xs shrink-0">
            <Mic className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div className="flex items-end gap-1 h-7 flex-1 px-1">
            {[40, 65, 30, 85, 100, 50, 75, 90, 45, 60, 95, 70, 35, 80, 55, 30, 65, 45].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-gradient-to-t from-[#155FB5] to-[#7FB8F2] wave-bar"
                style={{
                  height: `${height}%`,
                  opacity: i % 2 === 0 ? 0.95 : 0.7,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Real-time Dictated Transcript Preview */}
        <div className="text-left space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B7F]">
            Dictated Call Transcript
          </span>
          <p className="text-xs text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] font-sans">
            &ldquo;Just wrapped with <span className="font-semibold text-[#1A73D9]">Sarah Jenkins</span> at Meridian BioTech. They approved the <span className="font-semibold text-emerald-700">$50,000</span> pilot scope. Primary condition: deliver the SOC2 Type II compliance addendum by Thursday afternoon before board review.&rdquo;
          </p>
        </div>

        {/* Structured Output Pills */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-[#F3F9FF] border border-[#CFE6FF]/80 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight overflow-hidden">
              <div className="text-[10px] text-[#5B6B7F] font-medium">Follow-Up Email</div>
              <div className="text-xs font-bold text-[#0F172A] truncate">Ready to Send</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F3F9FF] border border-[#CFE6FF]/80 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#1A73D9] shadow-2xs shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight overflow-hidden">
              <div className="text-[10px] text-[#5B6B7F] font-medium">Task &amp; .ics Sync</div>
              <div className="text-xs font-bold text-[#0F172A] truncate">Due Thursday 3 PM</div>
            </div>
          </div>
        </div>
      </GlassCard>
      </TiltCard>

      <div className="hidden sm:block absolute -bottom-5 -right-5 z-20 w-56 animate-bounce-gentle">
        <GlassCard className="p-3 bg-white/95 border border-[#CFE6FF] shadow-[0_12px_32px_rgba(26,115,217,0.15)] text-left">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F172A] mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Stage: Proposal Review
            </span>
            <ArrowUpRight className="w-3 h-3 text-[#1A73D9]" />
          </div>
          <p className="text-[10px] text-[#5B6B7F]">
            Confidence: 94% · Confirmed by Gemini
          </p>
        </GlassCard>
      </div>

      {/* Floating Accent Glass Badge: Top Left */}
      <div className="hidden sm:block absolute -top-3 -left-4 z-20">
        <div className="px-3 py-1.5 rounded-full bg-white/95 border border-[#CFE6FF] shadow-[0_8px_20px_rgba(26,115,217,0.12)] backdrop-blur-md flex items-center gap-1.5 text-[11px] font-semibold text-[#1A73D9]">
          <FileText className="w-3.5 h-3.5 text-[#1A73D9]" />
          <span>4 AI Artifacts Created</span>
        </div>
      </div>
    </div>
  );
};
