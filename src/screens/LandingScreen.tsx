import React, { useState } from 'react';
import {
  Mic,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Calendar,
  FileCheck2,
  CalendarCheck,
  Check,
  Zap,
  AudioWaveform,
  ShieldCheck,
  Layers3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TiltCard } from '../components/TiltCard';
import { GlassCard } from '../components/GlassCard';
import { VoiceTransformationVisual } from '../components/VoiceTransformationVisual';
import { VoiceHeroScene } from '../components/three/VoiceHeroScene';
import { ArtifactConstellation } from '../components/three/ArtifactConstellation';
import { AuroraBackdrop } from '../components/visuals/AuroraBackdrop';
import { ArtifactTimeline } from '../components/visuals/ArtifactTimeline';
import { ConfidenceRing } from '../components/visuals/ConfidenceRing';
import { SpotlightCard } from '../components/visuals/SpotlightCard';

interface LandingScreenProps {
  onStartNew: () => void;
  onTrySample: () => void;
  onViewHistory?: () => void;
  onOpenTour?: () => void;
  onInstantJudgeDemo?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartNew,
  onTrySample,
  onViewHistory,
  onOpenTour,
  onInstantJudgeDemo,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'email' | 'crm' | 'notes' | 'nextStep'>('email');

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            className="lg:col-span-7 text-left space-y-6"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#1A73D9] bg-[#F3F9FF] border border-[#CFE6FF] rounded-full shadow-[0_8px_24px_rgba(26,115,217,0.12)] backdrop-blur-md">
              <Mic className="w-3.5 h-3.5 text-[#1A73D9]" />
              <span>Voice-first assistant for consultants & salespeople</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
              Turn a 2-minute call debrief into a{' '}
              <span className="text-gradient-blue underline decoration-[#AFD3FA] decoration-wavy decoration-2 underline-offset-4">
                perfect follow-up.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#5B6B7F] max-w-xl leading-relaxed">
              Speak your messy notes right after your client call. Gemini converts them
              into a client-ready email, structured CRM fields, and calendar next steps.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onStartNew}
                className="btn-3d inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl cursor-pointer"
              >
                <Mic className="w-4 h-4 stroke-[2.2]" />
                <span>Start a call debrief</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {onInstantJudgeDemo ? (
                <button
                  type="button"
                  onClick={onInstantJudgeDemo}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 border border-amber-300 rounded-xl shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                  title="Zero-friction hackathon evaluation: directly populates artifacts without recording"
                >
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>⚡ Instant Demo (Judge Quick-Test)</span>
                </button>
              ) : (
                <button
                  onClick={onTrySample}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#0F172A] bg-white/80 hover:bg-white border border-[#CFE6FF] hover:border-[#1A73D9]/30 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(26,115,217,0.06)] hover:text-[#1A73D9] hover:-translate-y-0.5 transition-all active:translate-y-[1px] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#1A73D9]" />
                  <span>Try sample call note</span>
                </button>
              )}
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-[#E4F1FF] flex flex-wrap items-center gap-6 sm:gap-8 text-xs text-[#5B6B7F]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1A73D9]" />
                <span>Save ~20 mins per client call</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1A73D9]" />
                <span>Zero hallucination guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1A73D9]" />
                <span>Instant .ics calendar sync</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 flex items-center justify-center relative min-h-[420px] sm:min-h-[480px]"
            initial={{ opacity: 0, scale: 0.92, rotateY: -12 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1400 }}
          >
            <VoiceHeroScene className="scale-110 pointer-events-auto" />
            <div className="relative z-10 w-full animate-float-y">
              <VoiceTransformationVisual />
            </div>
          </motion.div>
        </div>

        {/* Hero Interactive Workspace Preview with TiltCard & GlassCard */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A73D9] bg-[#F3F9FF] px-3 py-1 rounded-full border border-[#CFE6FF]">
              Live Output Artifacts Preview
            </span>
          </div>

          <TiltCard maxTilt={4} scale={1.008}>
            <GlassCard className="p-4 sm:p-6 bg-white/80 border border-white/90 shadow-[0_16px_48px_rgba(26,115,217,0.12)]">
              {/* Window Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4F1FF] gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80 shadow-2xs" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-2xs" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-2xs" />
                  <span className="text-xs font-mono text-[#5B6B7F] ml-2">
                    echocrm · meridian_biotech_debrief.gemini
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-[#F3F9FF] p-1 rounded-xl border border-[#CFE6FF]/80 text-xs font-semibold text-[#5B6B7F]">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('email')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePreviewTab === 'email'
                        ? 'bg-white text-[#1A73D9] shadow-2xs font-bold'
                        : 'hover:text-[#0F172A]'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('crm')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePreviewTab === 'crm'
                        ? 'bg-white text-[#1A73D9] shadow-2xs font-bold'
                        : 'hover:text-[#0F172A]'
                    }`}
                  >
                    CRM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('notes')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePreviewTab === 'notes'
                        ? 'bg-white text-[#1A73D9] shadow-2xs font-bold'
                        : 'hover:text-[#0F172A]'
                    }`}
                  >
                    Handoff
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('nextStep')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePreviewTab === 'nextStep'
                        ? 'bg-white text-[#1A73D9] shadow-2xs font-bold'
                        : 'hover:text-[#0F172A]'
                    }`}
                  >
                    Next Step
                  </button>
                </div>
              </div>

              {/* Dynamic Preview Content */}
              {activePreviewTab === 'email' && (
                <div className="space-y-3 pt-4 text-left animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5B6B7F] pb-2 border-b border-[#F3F9FF] gap-2">
                    <span className="font-bold text-[#0F172A]">
                      Subject: Follow-up & Next Steps — Meridian BioTech Pilot Integration
                    </span>
                    <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-[#E4F1FF] text-[#1A73D9] font-semibold text-[11px]">
                      Professional Tone
                    </span>
                  </div>
                  <p className="text-xs text-[#0F172A] leading-relaxed">
                    Hi Sarah,<br /><br />
                    Thank you for the productive discussion this morning regarding Meridian BioTech's clinical trial intake pipeline. As discussed, we are excited to help streamline your compliance auditing before the Q3 patient enrollment surge...
                  </p>
                  <div className="pt-2 text-[11px] text-[#5B6B7F] font-mono border-t border-[#F3F9FF] flex items-center justify-between">
                    <span>Includes automatically appended email signature</span>
                    <span className="text-[#1A73D9] font-sans font-semibold">1-Click Copy Ready</span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'crm' && (
                <div className="space-y-3 pt-4 text-left animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-[#F3F9FF] border border-[#CFE6FF]/60 rounded-xl">
                      <span className="text-[10px] text-[#5B6B7F] uppercase block font-semibold">Client</span>
                      <span className="font-bold text-[#0F172A]">Sarah Jenkins</span>
                    </div>
                    <div className="p-2.5 bg-[#F3F9FF] border border-[#CFE6FF]/60 rounded-xl">
                      <span className="text-[10px] text-[#5B6B7F] uppercase block font-semibold">Company</span>
                      <span className="font-bold text-[#0F172A]">Meridian BioTech</span>
                    </div>
                    <div className="p-2.5 bg-[#F3F9FF] border border-[#CFE6FF]/60 rounded-xl">
                      <span className="text-[10px] text-[#5B6B7F] uppercase block font-semibold">Deal Stage</span>
                      <span className="font-bold text-[#1A73D9]">Proposal Review</span>
                    </div>
                    <div className="p-2.5 bg-[#F3F9FF] border border-[#CFE6FF]/60 rounded-xl">
                      <span className="text-[10px] text-[#5B6B7F] uppercase block font-semibold">Budget Signal</span>
                      <span className="font-bold text-emerald-700">$45k - $60k</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#F3F9FF] border border-[#CFE6FF]/60 rounded-xl text-xs space-y-1.5">
                    <span className="text-[10px] text-[#5B6B7F] uppercase block font-semibold">Extracted Objections</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 bg-white border border-[#CFE6FF] rounded-lg text-[#0F172A] text-[11px] font-medium shadow-2xs">
                        SOC2 Type II documentation needed before legal approval
                      </span>
                      <span className="px-2.5 py-1 bg-white border border-[#CFE6FF] rounded-lg text-[#0F172A] text-[11px] font-medium shadow-2xs">
                        Payment term preference: 50% on kickoff, 50% on staging delivery
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'notes' && (
                <div className="space-y-2 pt-4 text-left animate-fadeIn text-xs text-[#0F172A]">
                  <div className="font-bold text-[#0F172A] mb-1">Internal Team Handoff Summary:</div>
                  <ul className="space-y-2 list-disc pl-4 text-[#5B6B7F]">
                    <li>Sarah is the primary champion; VP of Ops (Marcus) will attend next Tuesday's tech review.</li>
                    <li>Security questionnaire must be completed using our updated HIPAA appendix.</li>
                    <li>Timeline urgency is driven by a July FDA patient trial milestone.</li>
                    <li>Delivery team should prepare staging sandbox by Thursday 2 PM.</li>
                  </ul>
                </div>
              )}

              {activePreviewTab === 'nextStep' && (
                <div className="p-4 bg-[#F3F9FF] border border-[#CFE6FF]/80 rounded-2xl text-left animate-fadeIn space-y-2.5 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                    <span className="font-bold text-[#0F172A] text-sm">
                      Deliver revised commercial scope & compliance addendum
                    </span>
                    <span className="self-start sm:self-auto px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-full text-[11px] border border-rose-200">
                      High Priority
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6B7F]">
                    Due in 2 business days (Friday, 4:00 PM). Calendar alert generated automatically.
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#CFE6FF] text-[11px] text-[#5B6B7F]">
                    <span>Exportable RFC 5545 .ics file</span>
                    <span className="text-[#1A73D9] font-bold">Download to Apple / Google / Outlook</span>
                  </div>
                </div>
              )}
            </GlassCard>
          </TiltCard>
        </div>
      </section>

      {/* Artifact Constellation Band — One note in, four artifacts out */}
      <section className="relative overflow-hidden border-t border-[#E4F1FF] bg-white">
        <AuroraBackdrop intensity={0.75} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            className="max-w-2xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1A73D9] bg-[#F3F9FF] px-3 py-1 rounded-full border border-[#CFE6FF]">
              <AudioWaveform className="w-3.5 h-3.5" />
              One note in · Four artifacts out
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Watch raw speech become{' '}
              <span className="text-gradient-blue">structured work</span>
            </h2>
            <p className="mt-2 text-sm text-[#5B6B7F]">
              Gemini streams your dictation through a schema-constrained pipeline. Every
              artifact stays grounded in what the client actually said.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 3D Constellation */}
            <motion.div
              className="lg:col-span-7 relative"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative rounded-[28px] h-[380px] sm:h-[440px] overflow-hidden border border-white/90 bg-gradient-to-b from-white/85 to-[#F3F9FF]/70 backdrop-blur-md shadow-[0_20px_60px_rgba(26,115,217,0.12)]">
                <ArtifactConstellation />

                {/* Corner readout */}
                <div className="absolute top-4 left-4 px-3 py-2 rounded-xl bg-white/85 backdrop-blur-md border border-[#CFE6FF] shadow-2xs">
                  <div className="text-[10px] font-mono text-[#5B6B7F]">gemini-2.5-flash</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-[#0F172A]">structured output</span>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-white/85 backdrop-blur-md border border-[#CFE6FF] shadow-2xs text-right">
                  <div className="text-[10px] font-mono text-[#5B6B7F]">schema valid</div>
                  <div className="text-sm font-extrabold font-mono text-[#1A73D9] tabular-nums">
                    100%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Artifact detail list */}
            <motion.div
              className="lg:col-span-5 space-y-4"
              initial={{ opacity: 0, x: 26 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <SpotlightCard className="rounded-3xl">
                <GlassCard className="p-5 sm:p-6 bg-white/88 border border-white/95 shadow-[0_12px_36px_rgba(26,115,217,0.1)] space-y-4">
                  <div className="flex items-center gap-3">
                    <ConfidenceRing value={1} size={64} strokeWidth={6} caption="grounded" />
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        Zero hallucination by construction
                      </h3>
                      <p className="text-xs text-[#5B6B7F] mt-0.5 leading-relaxed">
                        Strict <span className="font-mono text-[#1A73D9]">responseSchema</span>{' '}
                        enforcement means every field is either extracted from your call or
                        flagged “Needs confirmation”.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E4F1FF]">
                    <ArtifactTimeline />
                  </div>

                  <div className="pt-3 border-t border-[#E4F1FF] grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1A73D9] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-[#5B6B7F] leading-snug">
                        Facts, metrics and dates preserved verbatim
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Layers3 className="w-4 h-4 text-[#1A73D9] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-[#5B6B7F] leading-snug">
                        100% parseable JSON, never broken brackets
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3-Step Explainer Section Connected by Light-Blue Line */}
      <section className="relative py-16 md:py-24 border-t border-[#E4F1FF] bg-gradient-to-b from-[#F3F9FF]/60 to-white">
        <AuroraBackdrop intensity={0.5} showGrid={false} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <motion.h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              How EchoCRM works in 3 rapid steps
            </motion.h2>
            <motion.p
              className="mt-2 text-sm text-[#5B6B7F]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              No manual typing or tedious CRM data entry while fresh call context fades.
            </motion.p>
          </div>

          <div className="relative">
            {/* Connecting light-blue rail with a flowing pulse (desktop) */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 -translate-y-6 z-0"
            >
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1">
                <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#CFE6FF" strokeWidth="1" />
                <line
                  className="dash-flow"
                  x1="0"
                  y1="0.5"
                  x2="100"
                  y2="0.5"
                  stroke="#1A73D9"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
              <TiltCard maxTilt={5}>
                <GlassCard className="p-6 bg-white/85 border border-white/95 h-full flex flex-col justify-between shadow-[0_8px_24px_rgba(26,115,217,0.06)] hover:shadow-[0_16px_40px_rgba(26,115,217,0.12)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4F1FF] to-white border border-[#CFE6FF] flex items-center justify-center text-[#1A73D9] font-bold text-sm mb-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_4px_12px_rgba(26,115,217,0.1)]">
                      <Mic className="w-5 h-5 text-[#1A73D9] stroke-[2.2]" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#1A73D9] mb-1">01 · DICTATE</div>
                    <h3 className="text-base font-bold text-[#0F172A] mb-2">
                      Dictate messy voice notes
                    </h3>
                    <p className="text-xs text-[#5B6B7F] leading-relaxed">
                      Hit the mic button right after hanging up. Ramble freely, correct yourself,
                      and mention budget, objections, dates, or stakeholders.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#E4F1FF] text-[11px] text-[#1A73D9] font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Web Speech live streaming</span>
                  </div>
                </GlassCard>
              </TiltCard>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
              <TiltCard maxTilt={5}>
                <GlassCard className="p-6 bg-white/85 border border-white/95 h-full flex flex-col justify-between shadow-[0_8px_24px_rgba(26,115,217,0.06)] hover:shadow-[0_16px_40px_rgba(26,115,217,0.12)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4F1FF] to-white border border-[#CFE6FF] flex items-center justify-center text-[#1A73D9] font-bold text-sm mb-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_4px_12px_rgba(26,115,217,0.1)]">
                      <FileCheck2 className="w-5 h-5 text-[#1A73D9] stroke-[2.2]" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#1A73D9] mb-1">02 · STRUCTURE</div>
                    <h3 className="text-base font-bold text-[#0F172A] mb-2">
                      Review 4 AI artifacts
                    </h3>
                    <p className="text-xs text-[#5B6B7F] leading-relaxed">
                      Gemini structures your notes into a client email, CRM cards with pain
                      points, a 5–8 bullet internal handoff note, and an actionable next step.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#E4F1FF] text-[11px] text-[#1A73D9] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Gemini 2.5 Flash schema</span>
                  </div>
                </GlassCard>
              </TiltCard>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
              <TiltCard maxTilt={5}>
                <GlassCard className="p-6 bg-white/85 border border-white/95 h-full flex flex-col justify-between shadow-[0_8px_24px_rgba(26,115,217,0.06)] hover:shadow-[0_16px_40px_rgba(26,115,217,0.12)]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4F1FF] to-white border border-[#CFE6FF] flex items-center justify-center text-[#1A73D9] font-bold text-sm mb-4 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_4px_12px_rgba(26,115,217,0.1)]">
                      <CalendarCheck className="w-5 h-5 text-[#1A73D9] stroke-[2.2]" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#1A73D9] mb-1">03 · FOLLOW UP</div>
                    <h3 className="text-base font-bold text-[#0F172A] mb-2">
                      Send, export & save
                    </h3>
                    <p className="text-xs text-[#5B6B7F] leading-relaxed">
                      Tweak tone (Warm, Professional, Direct), copy the email in 1-click,
                      download an .ics calendar reminder, and sync to your debrief ledger.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-[#E4F1FF] text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Firestore + local sync</span>
                  </div>
                </GlassCard>
              </TiltCard>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences & Use Cases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TiltCard maxTilt={6}>
          <GlassCard className="p-6 bg-white/80 border border-white/90 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-3 h-full">
            <h4 className="text-sm font-bold text-[#0F172A]">
              For Independent Consultants
            </h4>
            <p className="text-xs text-[#5B6B7F] leading-relaxed">
              Never let client agreements slip through the cracks. Dictate while walking between
              meetings and send a polished follow-up before your competitors even open their laptop.
            </p>
          </GlassCard>
          </TiltCard>

          <TiltCard maxTilt={6}>
          <GlassCard className="p-6 bg-white/80 border border-white/90 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-3 h-full">
            <h4 className="text-sm font-bold text-[#0F172A]">
              For Agency Account Leads
            </h4>
            <p className="text-xs text-[#5B6B7F] leading-relaxed">
              Hand off crisp 5–8 bullet summaries to your design and engineering delivery teams
              without writing lengthy documentation from scratch.
            </p>
          </GlassCard>
          </TiltCard>

          <TiltCard maxTilt={6}>
          <GlassCard className="p-6 bg-white/80 border border-white/90 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-3 h-full">
            <h4 className="text-sm font-bold text-[#0F172A]">
              For B2B Sales Reps
            </h4>
            <p className="text-xs text-[#5B6B7F] leading-relaxed">
              Capture budget signals, stakeholder blockers, and deal stage transitions cleanly.
              Export structured JSON directly into your CRM workflow.
            </p>
          </GlassCard>
          </TiltCard>
        </div>

        <TiltCard maxTilt={3} scale={1.01}>
        <div className="mt-12 text-center p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#F3F9FF] via-white to-[#EAF4FF] border border-[#CFE6FF] shadow-[0_20px_48px_rgba(26,115,217,0.12)] relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[#CFE6FF]/50 blur-3xl pointer-events-none" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            Ready to test your first post-call note?
          </h3>
          <p className="text-xs sm:text-sm text-[#5B6B7F] mt-1.5 mb-6 max-w-md mx-auto">
            Test immediately with our realistic sample debrief or dictate your own client call.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartNew}
              className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start New Debrief</span>
            </button>
            <button
              onClick={onViewHistory}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <span>View Past Debriefs</span>
            </button>
          </div>
        </div>
        </TiltCard>
      </section>
    </div>
  );
};
