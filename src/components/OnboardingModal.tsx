import React, { useState, useEffect } from 'react';
import {
  Mic,
  FileCheck2,
  CalendarCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Check,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrySample: () => void;
}

interface StepInfo {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  icon: React.ReactNode;
  badge: string;
}

const STEPS: StepInfo[] = [
  {
    stepNumber: '01',
    badge: 'Step 1 of 3 · Dictate',
    title: 'Dictate the debrief',
    subtitle: 'Speak your messy notes right after hanging up',
    description:
      'Hit the tactile microphone button or type raw thoughts. Ramble freely, correct yourself, and mention budget hints, stakeholder objections, or commitments.',
    bulletPoints: [
      'Web Speech API streams interim transcripts live',
      'Leave self-corrections in place — Gemini cleans them up',
      'Optional call templates guide recurring discovery or proposal calls',
    ],
    icon: <Mic className="w-6 h-6 text-[#1A73D9]" />,
  },
  {
    stepNumber: '02',
    badge: 'Step 2 of 3 · AI Structuring',
    title: 'Review AI outputs',
    subtitle: 'Gemini transforms unstructured audio into 4 artifacts',
    description:
      'In under 2 seconds, Gemini 2.5 Flash produces a client-ready follow-up email, structured CRM record, internal delivery notes, and an actionable calendar next step.',
    bulletPoints: [
      'Follow-up email with 1-click tone rewriting (Warm, Professional, Direct)',
      'CRM fields with pain points, budget signals, and deal stage',
      'Concise 5–8 bullet internal handoff note for delivery teams',
    ],
    icon: <FileCheck2 className="w-6 h-6 text-[#1A73D9]" />,
  },
  {
    stepNumber: '03',
    badge: 'Step 3 of 3 · Follow-Up & Sync',
    title: 'Save and follow up',
    subtitle: '1-click copy, calendar sync, and persistent ledger',
    description:
      'Copy the email to send immediately, download an .ics calendar file with automated due-date reminders, and sync to your debrief dashboard.',
    bulletPoints: [
      'Automatic email signature appended to every client draft',
      'Download standard RFC 5545 .ics calendar task file',
      'Persists in browser storage or syncs to Cloud Firestore on Google Sign-In',
    ],
    icon: <CalendarCheck className="w-6 h-6 text-[#1A73D9]" />,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onTrySample,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Enter') {
        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white/95 border border-white/90 rounded-3xl shadow-[0_32px_80px_rgba(26,115,217,0.22)] overflow-hidden animate-fadeIn">
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-[#E4F1FF] flex">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStepIndex ? 'bg-[#1A73D9]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#F3F9FF] text-[#1A73D9] border border-[#CFE6FF]">
            {currentStep.badge}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5B6B7F] hover:text-[#0F172A] rounded-xl hover:bg-[#F3F9FF] transition-colors cursor-pointer"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4F1FF] to-white border border-[#CFE6FF] flex items-center justify-center shrink-0 shadow-xs">
              {currentStep.icon}
            </div>
            <div>
              <h2
                id="onboarding-modal-title"
                className="text-lg font-extrabold text-[#0F172A] tracking-tight"
              >
                {currentStep.title}
              </h2>
              <p className="text-xs text-[#5B6B7F] font-semibold mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#5B6B7F] leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Value Points */}
          <div className="bg-[#F3F9FF]/80 border border-[#CFE6FF] rounded-2xl p-4 space-y-2.5">
            {currentStep.bulletPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#0F172A]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Indicators & Actions Footer */}
        <div className="px-6 py-4 bg-[#F3F9FF]/60 border-t border-[#E4F1FF] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5 order-2 sm:order-1">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#1A73D9]'
                    : 'bg-[#CFE6FF] hover:bg-[#AFD3FA]'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={onTrySample}
              className="px-3 py-2 text-xs font-semibold text-[#5B6B7F] hover:text-[#0F172A] transition-colors mr-auto sm:mr-0 cursor-pointer"
            >
              Skip & try sample
            </button>

            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl shadow-[0_2px_10px_rgba(26,115,217,0.3)] transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
