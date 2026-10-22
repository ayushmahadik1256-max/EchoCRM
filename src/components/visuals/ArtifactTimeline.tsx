import React from 'react';
import { Mail, Database, ClipboardList, CalendarCheck } from 'lucide-react';

export interface ArtifactStep {
  key: string;
  label: string;
  caption: string;
  icon: React.ReactNode;
}

interface ArtifactTimelineProps {
  steps?: ArtifactStep[];
  /** Index of the step currently highlighted (-1 for none). */
  activeIndex?: number;
  className?: string;
}

const DEFAULT_STEPS: ArtifactStep[] = [
  {
    key: 'email',
    label: 'Follow-up email',
    caption: 'Ready to send',
    icon: <Mail className="w-4 h-4 stroke-[2.1]" />,
  },
  {
    key: 'crm',
    label: 'CRM record',
    caption: '10 structured fields',
    icon: <Database className="w-4 h-4 stroke-[2.1]" />,
  },
  {
    key: 'notes',
    label: 'Handoff note',
    caption: '5–8 bullets',
    icon: <ClipboardList className="w-4 h-4 stroke-[2.1]" />,
  },
  {
    key: 'nextStep',
    label: 'Next step',
    caption: 'Calendar ready',
    icon: <CalendarCheck className="w-4 h-4 stroke-[2.1]" />,
  },
];

/**
 * Horizontal artifact stepper with an animated flowing connector.
 */
export const ArtifactTimeline: React.FC<ArtifactTimelineProps> = ({
  steps = DEFAULT_STEPS,
  activeIndex = -1,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Flowing connector rail */}
      <div className="absolute left-0 right-0 top-[19px] h-[2px] hidden sm:block">
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 2"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="1"
            x2="100"
            y2="1"
            stroke="#CFE6FF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            className="dash-flow"
            x1="0"
            y1="1"
            x2="100"
            y2="1"
            stroke="#1A73D9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
        {steps.map((step, i) => {
          const isActive = i === activeIndex;
          const isPast = activeIndex >= 0 && i < activeIndex;

          return (
            <li
              key={step.key}
              className="flex flex-col items-center text-center gap-1.5 animate-fadeIn"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="relative">
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#AFD3FA]/50 blur-md animate-glow-ring"
                  />
                )}
                <span
                  className={`relative inline-flex items-center justify-center w-10 h-10 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#1A73D9] text-white border-[#1A73D9] shadow-[0_8px_22px_rgba(26,115,217,0.4)] scale-110'
                      : isPast
                      ? 'bg-[#E4F1FF] text-[#1A73D9] border-[#CFE6FF]'
                      : 'bg-white text-[#5B6B7F] border-[#E4F1FF]'
                  }`}
                >
                  {step.icon}
                </span>
              </div>

              <span
                className={`text-[11px] font-bold leading-tight ${
                  isActive ? 'text-[#1A73D9]' : 'text-[#0F172A]'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-[#5B6B7F] font-mono leading-tight">
                {step.caption}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
