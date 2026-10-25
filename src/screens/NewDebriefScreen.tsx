import React, { useState, useEffect } from 'react';
import {
  Mic,
  FileText,
  Sparkles,
  AlertCircle,
  Calendar,
  Building,
  User,
  Tag,
  Volume2,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Info,
  X,
  Activity,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { DealStage, DebriefResult, CallTemplate } from '../types';
import { SAMPLE_DICTATED_NOTE, SAMPLE_METADATA } from '../data/sampleNotes';
import { CALL_TEMPLATES } from '../data/templates';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicButton } from '../components/MicButton';
import { GlassCard } from '../components/GlassCard';
import { FloatingPanel } from '../components/FloatingPanel';
import { generateDebriefFromApi } from '../services/geminiClient';
import { DebriefSkeletonLoader } from '../components/DebriefSkeletonLoader';
import { useAuth } from '../hooks/useAuth';
import { WaveformBars } from '../components/visuals/WaveformBars';
import { ArtifactTimeline } from '../components/visuals/ArtifactTimeline';
import { AudioUploadPanel } from '../components/AudioUploadPanel';
import { TemplateManagerModal } from '../components/TemplateManagerModal';
import { fetchUserTemplates } from '../services/firebase';

interface NewDebriefScreenProps {
  initialTranscript?: string;
  initialMetadata?: {
    clientName?: string;
    company?: string;
    dealStage?: DealStage;
    callDate?: string;
  };
  onGenerateSuccess: (
    result: DebriefResult,
    metadata: any,
    transcript: string,
    usedFallback?: boolean,
  ) => void;
  onRequestSignIn?: () => void;
}

const DEAL_STAGES: DealStage[] = [
  'Lead',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

export const NewDebriefScreen: React.FC<NewDebriefScreenProps> = ({
  initialTranscript = '',
  initialMetadata = {},
  onGenerateSuccess,
  onRequestSignIn,
}) => {
  const { userProfile, emailSignature, user } = useAuth();

  const [transcript, setTranscript] = useState(initialTranscript);
  const [clientName, setClientName] = useState(initialMetadata.clientName || '');
  const [company, setCompany] = useState(initialMetadata.company || '');
  const [dealStage, setDealStage] = useState<DealStage>(
    initialMetadata.dealStage || userProfile.defaultDealStage || 'Discovery',
  );
  const [callDate, setCallDate] = useState(
    initialMetadata.callDate || new Date().toISOString().split('T')[0],
  );

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [showTemplatePrompts, setShowTemplatePrompts] = useState(true);

  // User-created custom templates (merged with system templates)
  const [userTemplates, setUserTemplates] = useState<CallTemplate[]>([]);
  const allTemplates: CallTemplate[] = [...CALL_TEMPLATES, ...userTemplates];

  // Template Manager Modal
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Audio upload panel
  const [showAudioUpload, setShowAudioUpload] = useState(false);

  // Dismissible first-run sample tip card
  const [showTipCard, setShowTipCard] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Hook for Web Speech API
  const handleTranscriptChunk = (finalChunk: string) => {
    setTranscript((prev) => {
      const separator = prev.trim() ? ' ' : '';
      return prev + separator + finalChunk.trim();
    });
  };

  const {
    isRecording,
    interimTranscript,
    speechError,
    isSupported,
    announcement,
    startListening,
    stopListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    onTranscriptUpdate: handleTranscriptChunk,
  });

  // Load user-created custom templates on mount / auth change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!user) return;
        const tpls = await fetchUserTemplates(user.uid);
        if (!cancelled) setUserTemplates(tpls);
      } catch (error) {
        console.error('Failed to load custom templates:', error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Calculate stats
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;
  const canGenerate = charCount >= 20;

  // Clear states: idle / listening / done
  const debriefStatus: 'idle' | 'listening' | 'done' = isRecording
    ? 'listening'
    : canGenerate
    ? 'done'
    : 'idle';

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') return;

    const tpl = allTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setDealStage(tpl.dealStage);
    }
  };

  // Insert template guiding prompts into transcript box
  const handleInsertPromptOutline = (tpl: CallTemplate) => {
    const outline = tpl.suggestedPrompts
      .map((prompt, i) => `[${i + 1}. ${prompt}]\n- `)
      .join('\n\n');

    setTranscript((prev) => {
      if (!prev.trim()) return outline;
      return `${prev.trim()}\n\n---\n${outline}`;
    });
  };

  // Load sample notes handler
  const handleLoadSample = () => {
    if (isRecording) stopListening();
    setTranscript(SAMPLE_DICTATED_NOTE);
    setClientName(SAMPLE_METADATA.clientName);
    setCompany(SAMPLE_METADATA.company);
    setDealStage(SAMPLE_METADATA.dealStage);
    setCallDate(SAMPLE_METADATA.callDate);
    setSelectedTemplateId('discovery');
    setApiError(null);
  };

  const handleClearTranscript = () => {
    if (isRecording) stopListening();
    setTranscript('');
    setApiError(null);
  };

  const handleGenerate = async () => {
    if (isRecording) stopListening();
    if (!canGenerate) return;

    setApiError(null);
    setIsGenerating(true);

    const activeTemplate = allTemplates.find((t) => t.id === selectedTemplateId);
    const preferredTone =
      activeTemplate?.preferredTone || userProfile.defaultTone || 'Professional';

    try {
      const response = await generateDebriefFromApi({
        transcript,
        metadata: {
          clientName: clientName.trim() || undefined,
          company: company.trim() || undefined,
          dealStage,
          callDate,
        },
        tone: preferredTone,
        todayDate: new Date().toISOString().split('T')[0],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        signature: emailSignature,
      });

      onGenerateSuccess(
        response.data,
        { clientName, company, dealStage, callDate },
        transcript,
        response.usedFallback,
      );
    } catch (err: any) {
      console.error('Debrief generation error:', err);
      setApiError(
        err?.message ||
          'Failed to process call notes. Your transcript has been preserved. Please retry or adjust your notes.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <DebriefSkeletonLoader />;
  }

  const activeTemplate = allTemplates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      {/* Live Region for Screen Reader Announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Screen Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E4F1FF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Post-Call Voice Debrief
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                debriefStatus === 'listening'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : debriefStatus === 'done'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-[#F3F9FF] text-[#1A73D9] border-[#CFE6FF]'
              }`}
            >
              {debriefStatus === 'listening'
                ? 'Listening live'
                : debriefStatus === 'done'
                ? 'Ready to generate'
                : 'Idle — ready'}
            </span>
          </div>
          <p className="text-xs text-[#5B6B7F]">
            Dictate raw impressions right after hanging up. Gemini extracts email, CRM fields, and calendar tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1A73D9] bg-[#F3F9FF] border border-[#CFE6FF] hover:bg-[#E4F1FF] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
            <span>Load sample call note</span>
          </button>
        </div>
      </div>

      {/* First-Run Sample Tip Card (Dismissible) */}
      {showTipCard && (
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-[#F3F9FF] to-white border border-[#CFE6FF] shadow-2xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E4F1FF] flex items-center justify-center text-[#1A73D9] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#0F172A]">Quick test tip: </span>
              <span className="text-[#5B6B7F]">
                Click <strong>“Load sample call note”</strong> to populate a realistic, messy call debrief for Meridian BioTech without recording.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTipCard(false)}
            className="p-1 text-[#5B6B7F] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Speech API Inline Warning / Notice */}
      {speechError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 animate-fadeIn shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Microphone Notice</strong>
            <span>{speechError}</span>
          </div>
          <button
            onClick={clearSpeechError}
            className="text-amber-800 hover:text-amber-950 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isSupported && (
        <div className="mb-6 p-3.5 rounded-2xl bg-[#F3F9FF] border border-[#CFE6FF] text-[#0F172A] text-xs flex items-center gap-2.5 shadow-2xs">
          <Volume2 className="w-4 h-4 text-[#1A73D9] shrink-0" />
          <span>
            Speech recognition works best in Chrome or Edge. You can also type or paste
            your notes directly into the transcript box below.
          </span>
        </div>
      )}

      {/* Two-Column Workspace Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Microphone, Soundwave Visualizer & Transcript (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <FloatingPanel className="p-6 sm:p-7 bg-white/85 border border-white/95 rounded-3xl shadow-[0_12px_36px_rgba(26,115,217,0.08)]">
            {/* Tactile 3D Mic Center */}
            <div className="flex flex-col items-center justify-center pt-2 pb-4">
              <MicButton
                isRecording={isRecording}
                onStart={startListening}
                onStop={stopListening}
              />

              {/* Live Soundwave Visualizer when Recording */}
              <div
                aria-hidden="true"
                className={`flex items-center gap-3 mt-4 px-4 py-2.5 border rounded-2xl transition-colors ${
                  isRecording
                    ? 'bg-rose-50 border-rose-200/80 shadow-[0_6px_20px_rgba(244,63,94,0.12)]'
                    : 'bg-[#F3F9FF] border-[#CFE6FF]'
                }`}
              >
                <Activity
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isRecording ? 'text-rose-600 animate-pulse' : 'text-[#1A73D9]'
                  }`}
                />
                <div className="h-6 flex-1 min-w-0">
                  <WaveformBars active={isRecording} tone={isRecording ? 'rose' : 'blue'} />
                </div>
                <span
                  className={`text-[11px] font-bold shrink-0 ${
                    isRecording ? 'text-rose-700' : 'text-[#5B6B7F]'
                  }`}
                >
                  {isRecording ? 'Live Audio Stream' : 'Waveform Idle'}
                </span>
              </div>
            </div>

            {/* Live Interim Speech Feedback */}
            {interimTranscript && (
              <div className="mb-4 px-3.5 py-2.5 bg-[#F3F9FF] border border-[#CFE6FF] rounded-xl text-xs text-[#1A73D9] italic animate-fadeIn">
                <span className="font-bold not-italic text-[#1A73D9] mr-1.5">
                  Listening:
                </span>
                "{interimTranscript}"
              </div>
            )}

            {/* Editable Transcript Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="call-transcript"
                  className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Call Transcript & Dictation</span>
                </label>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      canGenerate ? 'text-[#5B6B7F]' : 'text-amber-700 font-bold'
                    }`}
                  >
                    {wordCount} words · {charCount} chars {charCount < 20 && '(min 20)'}
                  </span>
                  {charCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearTranscript}
                      className="text-xs font-semibold text-[#5B6B7F] hover:text-[#0F172A] transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="call-transcript"
                rows={9}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  activeTemplate
                    ? activeTemplate.placeholderHint
                    : 'Dictate using the microphone or type messy call notes here... Mention client reactions, budget signals, blockers, dates, and promises.'
                }
                className="w-full px-4 py-3 text-sm text-[#0F172A] bg-white border border-[#CFE6FF] rounded-2xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20 transition-all leading-relaxed shadow-inner"
              />
              <p className="text-[11px] text-[#5B6B7F]">
                Tip: Leave in self-corrections (e.g., "Wait, actually next Tuesday") — Gemini will resolve them cleanly.
              </p>
            </div>
          </FloatingPanel>

          {/* Audio Upload — collapsible alternative to mic dictation */}
          <AudioUploadPanel
            isOpen={showAudioUpload}
            onToggle={() => setShowAudioUpload((v) => !v)}
            onTranscriptReady={(text) => {
              if (isRecording) stopListening();
              setTranscript((prev) => {
                const separator = prev.trim() ? '\n\n[Transcribed from audio]\n' : '';
                return prev + separator + text;
              });
              setShowAudioUpload(false);
            }}
          />
        </div>

        {/* RIGHT COLUMN: Call Templates & Client Context Metadata (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Call Templates Card */}
          <GlassCard className="p-5 sm:p-6 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Call Template</span>
              </span>
              <div className="flex items-center gap-2">
                {activeTemplate && (
                  <button
                    type="button"
                    onClick={() => setShowTemplatePrompts(!showTemplatePrompts)}
                    className="text-[11px] font-semibold text-[#1A73D9] hover:text-[#155FB5] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showTemplatePrompts ? 'Hide hints' : 'Show hints'}</span>
                    {showTemplatePrompts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      onRequestSignIn?.();
                      return;
                    }
                    setShowTemplateManager(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6B7F] hover:text-[#1A73D9] transition-colors cursor-pointer"
                  title={user ? 'Manage custom templates' : 'Sign in to manage custom templates'}
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Manage</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTemplate('custom')}
                className={`py-2 px-3 text-xs rounded-xl font-semibold transition-all cursor-pointer border ${
                  selectedTemplateId === 'custom'
                    ? 'bg-[#1A73D9] text-white border-[#1A73D9] shadow-2xs'
                    : 'bg-white text-[#0F172A] border-[#CFE6FF] hover:bg-[#F3F9FF]'
                }`}
              >
                Custom / Blank
              </button>

              {allTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`py-2 px-3 text-xs rounded-xl font-semibold transition-all cursor-pointer border text-left ${
                    selectedTemplateId === tpl.id
                      ? 'bg-[#1A73D9] text-white border-[#1A73D9] shadow-2xs'
                      : 'bg-white text-[#0F172A] border-[#CFE6FF] hover:bg-[#F3F9FF]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    {tpl.isCustom && (
                      <span
                        className={`shrink-0 ${selectedTemplateId === tpl.id ? 'text-blue-200' : 'text-[#1A73D9]'}`}
                        title="Custom template"
                      >
                        ✦
                      </span>
                    )}
                    <span className="truncate">{tpl.name}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Template Prompt Hints Card */}
            {activeTemplate && showTemplatePrompts && (
              <div className="p-3.5 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Guiding questions:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInsertPromptOutline(activeTemplate)}
                    className="text-[11px] text-[#1A73D9] hover:text-[#155FB5] font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <ListPlus className="w-3 h-3" />
                    <span>Insert outline</span>
                  </button>
                </div>

                <ul className="space-y-1.5 text-xs text-[#5B6B7F]">
                  {activeTemplate.suggestedPrompts.map((prompt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#1A73D9] shrink-0">{idx + 1}.</span>
                      <span className="leading-snug">{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>

          {/* Client Details & Context */}
          <GlassCard className="p-5 sm:p-6 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-4">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#1A73D9]" />
              <span>Optional Client Context</span>
            </h3>

            <div className="space-y-3.5">
              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1A73D9]" />
                  <span>Client Contact Name</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
                />
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                  <Building className="w-3 h-3 text-[#1A73D9]" />
                  <span>Client Company</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Meridian BioTech"
                  className="w-full px-3.5 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Deal Stage */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Deal Stage
                  </label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
                  >
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Call Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#1A73D9]" />
                    <span>Call Date</span>
                  </label>
                  <input
                    type="date"
                    value={callDate}
                    onChange={(e) => setCallDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] font-mono"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Output Preview — what Gemini will build from these notes */}
          <GlassCard className="p-5 sm:p-6 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] space-y-4 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-10 w-40 h-40 rounded-full bg-[#CFE6FF]/40 blur-3xl pointer-events-none"
            />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Output Preview</span>
              </span>
              <span className="text-[10px] font-mono text-[#5B6B7F]">
                {canGenerate ? '4 artifacts' : 'awaiting notes'}
              </span>
            </div>

            <div className="relative">
              <ArtifactTimeline activeIndex={canGenerate ? 0 : -1} />
            </div>

            <p className="relative text-[11px] text-[#5B6B7F] leading-relaxed pt-1 border-t border-[#E4F1FF]">
              Each artifact is generated from the same grounded transcript, so your email, CRM
              fields and calendar task never disagree with each other.
            </p>
          </GlassCard>

          {/* Desktop Primary Action Card */}
          <div className="hidden md:block p-4 rounded-2xl bg-gradient-to-r from-[#F3F9FF] to-white border border-[#CFE6FF] shadow-2xs space-y-3">
            <div className="text-xs text-[#5B6B7F]">
              {!canGenerate ? (
                <span>Dictate or type at least 20 characters to enable Gemini generation.</span>
              ) : (
                <span className="text-[#0F172A] font-semibold">
                  Ready. Gemini will extract email, CRM record, and next steps in ~2 seconds.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                canGenerate && !isGenerating
                  ? 'btn-3d bg-[#1A73D9] hover:bg-[#155FB5] text-white focus-visible:ring-[#1A73D9] cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Follow-Up</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Generation Failure Banner with Retry */}
      {apiError && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Generation Interrupted</strong>
            <span>{apiError}</span>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={handleGenerate}
                className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
              >
                Retry Generation
              </button>
              <button
                onClick={handleLoadSample}
                className="text-rose-700 hover:text-rose-900 underline cursor-pointer"
              >
                Switch to Sample Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Generate Bar (< 768px) */}
      <div className="md:hidden fixed bottom-18 inset-x-3 z-30 pointer-events-none">
        <div className="pointer-events-auto p-2 bg-white/95 backdrop-blur-md border border-white/95 shadow-[0_8px_30px_rgba(26,115,217,0.2)] rounded-2xl flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-[#5B6B7F] pl-2 tabular-nums">
            {charCount} chars {charCount < 20 && '(min 20)'}
          </span>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all ${
              canGenerate && !isGenerating
                ? 'bg-[#1A73D9] text-white shadow-[0_2px_10px_rgba(26,115,217,0.35)] cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Template Manager Modal */}
      {user && (
        <TemplateManagerModal
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          onTemplatesChanged={(tpls) => setUserTemplates(tpls)}
        />
      )}
    </div>
  );
};
