import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { GeneratingOrb } from './three/GeneratingOrb';

const STATUS_LINES = [
  'Listening for decisions and commitments…',
  'Structuring CRM fields and pain points…',
  'Drafting client-ready follow-up email…',
  'Synthesizing internal notes and next step…',
];

export const DebriefSkeletonLoader: React.FC = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_LINES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 animate-fadeIn"
    >
      <GlassCard className="p-8 sm:p-10 bg-white/90 border border-white/95 shadow-[0_16px_48px_rgba(26,115,217,0.1)] rounded-3xl">
        {/* Animated Status Header */}
        <div className="flex flex-col items-center justify-center text-center pb-8 border-b border-[#E4F1FF]">
          <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
            <GeneratingOrb className="w-28 h-28" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] transition-all duration-300">
            {STATUS_LINES[statusIndex]}
          </h3>
          <p className="text-xs text-[#5B6B7F] mt-1 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
            <span>Analyzing raw dictated notes with Gemini 2.5 Flash</span>
          </p>
        </div>

        {/* Shimmer Placeholder Content Shaped Like Real Follow-Up */}
        <div className="pt-8 space-y-6">
          {/* Email Subject Skeleton */}
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded-md animate-shimmer" />
            <div className="h-10 w-4/5 rounded-xl animate-shimmer" />
          </div>

          {/* Email Body Skeleton */}
          <div className="space-y-3 pt-2">
            <div className="h-3.5 w-32 rounded-md animate-shimmer" />
            <div className="h-4 w-full rounded-md animate-shimmer" />
            <div className="h-4 w-11/12 rounded-md animate-shimmer" />
            <div className="h-4 w-4/5 rounded-md animate-shimmer" />
            <div className="h-4 w-3/4 rounded-md animate-shimmer" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl border border-[#E4F1FF] bg-[#F3F9FF]/40 space-y-2.5">
              <div className="h-3.5 w-32 rounded-md animate-shimmer" />
              <div className="h-6 w-2/3 rounded-xl animate-shimmer" />
            </div>
            <div className="p-4 rounded-2xl border border-[#E4F1FF] bg-[#F3F9FF]/40 space-y-2.5">
              <div className="h-3.5 w-28 rounded-md animate-shimmer" />
              <div className="h-6 w-1/2 rounded-xl animate-shimmer" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
