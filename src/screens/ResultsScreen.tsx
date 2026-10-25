import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Layers,
  FileText,
  CalendarCheck,
  Copy,
  Check,
  Download,
  Save,
  RotateCw,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  User,
  Building,
  Flag,
  FileSignature,
  Clock,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  Square,
  ExternalLink,
  MessageSquare,
  Share2,
  Send,
  Eye,
  EyeOff,
  Loader2,
  CalendarPlus,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import {
  DebriefResult,
  EmailTone,
  DealStage,
  TaskPriority,
  DebriefDocument,
} from '../types';
import { EditableChipList } from '../components/EditableChipList';
import { downloadTaskIcs, buildGoogleCalendarUrl, buildOutlookCalendarUrl } from '../services/ics';
import { createGoogleCalendarEvent } from '../services/calendarSync';
import { buildGmailWebUrl, buildOutlookWebMailUrl, buildMailtoUrl } from '../services/emailDispatch';
import { voicePlayer, generateVoiceDebriefScript } from '../services/voiceDebrief';
import { formatSlackHandoff, formatMarkdownHandoff } from '../services/handoffExport';
import { regenerateEmailTone } from '../services/geminiClient';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/GlassCard';
import { ConfidenceRing } from '../components/visuals/ConfidenceRing';
import { ArtifactTimeline } from '../components/visuals/ArtifactTimeline';
import { AuroraBackdrop } from '../components/visuals/AuroraBackdrop';
import { SpotlightCard } from '../components/visuals/SpotlightCard';

interface ResultsScreenProps {
  initialResult: DebriefResult;
  metadata: {
    clientName?: string;
    company?: string;
    dealStage?: DealStage;
    callDate?: string;
  };
  rawTranscript: string;
  existingId?: string;
  usedFallback?: boolean;
  onSave: (doc: DebriefDocument) => Promise<void>;
  onBackToEdit: () => void;
  onNewDebrief: () => void;
}

type TabKey = 'email' | 'crm' | 'internal' | 'nextSteps';

const TONES: EmailTone[] = ['Warm', 'Professional', 'Direct'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const DEAL_STAGES: DealStage[] = [
  'Lead',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  initialResult,
  metadata,
  rawTranscript,
  existingId,
  usedFallback = false,
  onSave,
  onBackToEdit,
  onNewDebrief,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('email');

  // Follow-up email state
  const [emailSubject, setEmailSubject] = useState(initialResult.emailSubject);
  const [emailBody, setEmailBody] = useState(initialResult.emailBody);
  const [selectedTone, setSelectedTone] = useState<EmailTone>(
    initialResult.emailTone || 'Professional',
  );
  const [isRegeneratingTone, setIsRegeneratingTone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Client recipient email (auto-detected or editable for 1-click dispatch)
  const [clientEmail, setClientEmail] = useState(() => {
    const emailMatch = rawTranscript.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    return emailMatch ? emailMatch[1] : '';
  });

  // Audio-Out Voice Debrief state
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  // Team Handoff export toasts
  const [copiedSlack, setCopiedSlack] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Interactive Transcript Grounding state
  const [showGroundingDrawer, setShowGroundingDrawer] = useState(false);
  const [highlightKeyword, setHighlightKeyword] = useState<string | null>(null);

  // Stop voice player on unmount
  useEffect(() => {
    return () => {
      voicePlayer.stop();
    };
  }, []);

  // CRM state
  const [clientName, setClientName] = useState(
    initialResult.crm.clientName || metadata.clientName || 'Needs confirmation',
  );
  const [company, setCompany] = useState(
    initialResult.crm.company || metadata.company || 'Needs confirmation',
  );
  const [dealStage, setDealStage] = useState<string>(
    initialResult.crm.dealStage || metadata.dealStage || 'Discovery',
  );
  const [keyNeeds, setKeyNeeds] = useState<string[]>(initialResult.crm.keyNeeds || []);
  const [objections, setObjections] = useState<string[]>(
    initialResult.crm.objections || [],
  );
  const [budgetSignals, setBudgetSignals] = useState<string[]>(
    initialResult.crm.budgetSignals || [],
  );
  const [timelineSignals, setTimelineSignals] = useState<string[]>(
    initialResult.crm.timelineSignals || [],
  );
  const [decisionMakers, setDecisionMakers] = useState<string[]>(
    initialResult.crm.decisionMakers || [],
  );
  const [risks, setRisks] = useState<string[]>(initialResult.crm.risks || []);
  const [agreedNextStep, setAgreedNextStep] = useState(
    initialResult.crm.agreedNextStep || 'Needs confirmation',
  );
  const [copiedJson, setCopiedJson] = useState(false);

  // Internal notes state
  const [internalNotes, setInternalNotes] = useState<string[]>(
    initialResult.internalNote && initialResult.internalNote.length > 0
      ? initialResult.internalNote
      : ['No notes generated.'],
  );
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Next steps task state
  const [taskTitle, setTaskTitle] = useState(initialResult.nextStep.title);
  const [taskOwner, setTaskOwner] = useState(initialResult.nextStep.owner);
  const [taskDueDate, setTaskDueDate] = useState(
    initialResult.nextStep.dueDate ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(
    (initialResult.nextStep.priority as TaskPriority) || 'Medium',
  );
  const [taskRationale, setTaskRationale] = useState(
    initialResult.nextStep.rationale,
  );

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Google Calendar direct sync state
  const [calendarSyncState, setCalendarSyncState] = useState<
    'idle' | 'syncing' | 'synced' | 'error'
  >('idle');
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [calendarEventLink, setCalendarEventLink] = useState<string | null>(null);

  const { appendUserSignature, openProfileModal, emailSignature, user } = useAuth();

  // Handle tone change
  const handleToneChange = async (tone: EmailTone) => {
    if (tone === selectedTone || isRegeneratingTone) return;
    setSelectedTone(tone);
    setIsRegeneratingTone(true);

    try {
      const res = await regenerateEmailTone({
        tone,
        transcript: rawTranscript,
        metadata: { clientName, company, dealStage },
        previousEmail: { subject: emailSubject, body: emailBody },
        signature: emailSignature,
      });
      setEmailSubject(res.emailSubject);
      const withSignature = appendUserSignature(res.emailBody);
      setEmailBody(withSignature);
    } catch (err) {
      console.error('Failed to regenerate email tone:', err);
    } finally {
      setIsRegeneratingTone(false);
    }
  };

  // Copy email
  const handleCopyEmail = () => {
    const fullEmailText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  // Copy CRM JSON
  const handleCopyCRMJson = () => {
    const crmObj = {
      clientName,
      company,
      dealStage,
      keyNeeds,
      objections,
      budgetSignals,
      timelineSignals,
      decisionMakers,
      risks,
      agreedNextStep,
    };
    navigator.clipboard.writeText(JSON.stringify(crmObj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2200);
  };

  // Copy Internal notes
  const handleCopyNotes = () => {
    const notesText = internalNotes.map((b) => `• ${b}`).join('\n');
    navigator.clipboard.writeText(notesText);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2200);
  };

  // Copy Slack Handoff
  const handleCopySlack = () => {
    const slackText = formatSlackHandoff({
      clientName,
      company,
      dealStage,
      callDate: metadata.callDate || new Date().toISOString().split('T')[0],
      emailSubject,
      nextStepTitle: taskTitle,
      nextStepOwner: taskOwner,
      nextStepDueDate: taskDueDate,
      nextStepPriority: taskPriority,
      nextStepRationale: taskRationale,
      keyNeeds,
      objections,
      budgetSignals,
      timelineSignals,
      decisionMakers,
      risks,
      internalNotes,
    });
    navigator.clipboard.writeText(slackText);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2400);
  };

  // Copy Markdown Handoff (Notion / Jira / Linear / GitHub)
  const handleCopyMarkdown = () => {
    const mdText = formatMarkdownHandoff({
      clientName,
      company,
      dealStage,
      callDate: metadata.callDate || new Date().toISOString().split('T')[0],
      emailSubject,
      nextStepTitle: taskTitle,
      nextStepOwner: taskOwner,
      nextStepDueDate: taskDueDate,
      nextStepPriority: taskPriority,
      nextStepRationale: taskRationale,
      keyNeeds,
      objections,
      budgetSignals,
      timelineSignals,
      decisionMakers,
      risks,
      internalNotes,
    });
    navigator.clipboard.writeText(mdText);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2400);
  };

  // Toggle Voice Debrief Playback
  const handleToggleVoiceDebrief = () => {
    if (isVoicePlaying) {
      voicePlayer.stop();
      setIsVoicePlaying(false);
      return;
    }

    const script = generateVoiceDebriefScript({
      clientName,
      company,
      dealStage,
      agreedNextStep,
      nextStepTitle: taskTitle,
      nextStepDueDate: taskDueDate,
      keyNeeds,
      budgetSignals,
      risks,
    });

    voicePlayer.speak(
      script,
      () => setIsVoicePlaying(true),
      () => setIsVoicePlaying(false),
      (err) => {
        console.error('Speech synthesis error:', err);
        setIsVoicePlaying(false);
      },
    );
  };

  // Download .ics
  const handleDownloadCalendar = () => {
    downloadTaskIcs(
      {
        title: taskTitle,
        owner: taskOwner,
        dueDate: taskDueDate,
        priority: taskPriority,
        rationale: taskRationale,
      },
      clientName,
      company,
    );
  };

  // Push the task straight into Google Calendar via the Calendar API
  const handleSyncToGoogleCalendar = async () => {
    if (calendarSyncState === 'syncing') return;

    setCalendarSyncError(null);
    setCalendarSyncState('syncing');

    try {
      const event = await createGoogleCalendarEvent(
        {
          title: taskTitle,
          owner: taskOwner,
          dueDate: taskDueDate,
          priority: taskPriority,
          rationale: taskRationale,
        },
        clientName,
        company,
      );
      setCalendarEventLink(event.htmlLink);
      setCalendarSyncState('synced');
    } catch (err: any) {
      console.error('Google Calendar sync failed:', err);
      setCalendarSyncError(
        err?.message || 'Could not add this task to Google Calendar. Please try again.',
      );
      setCalendarSyncState('error');
    }
  };

  // Save Debrief Document
  const handleSaveDebrief = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const docId = existingId || `debrief-${Date.now()}`;

      const docToSave: DebriefDocument = {
        id: docId,
        userId: user?.uid || 'guest',
        createdAt: now,
        updatedAt: now,
        status: 'Open',
        clientName,
        company,
        callDate: metadata.callDate || now.split('T')[0],
        dealStage: (dealStage as DealStage) || 'Discovery',
        rawTranscript,
        isFallbackDemo: usedFallback,
        emailSubject,
        emailBody,
        emailTone: selectedTone,
        crm: {
          clientName,
          company,
          dealStage,
          keyNeeds,
          objections,
          budgetSignals,
          timelineSignals,
          decisionMakers,
          risks,
          agreedNextStep,
        },
        internalNote: internalNotes,
        nextStep: {
          title: taskTitle,
          owner: taskOwner,
          dueDate: taskDueDate,
          priority: taskPriority,
          rationale: taskRationale,
        },
      };

      await onSave(docToSave);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      if (err instanceof Error && err.message === 'SIGN_IN_CANCELLED') {
        setSaveError('Sign-in cancelled — this debrief was not stored. You can save it anytime.');
      } else {
        console.error('Error saving debrief:', err);
        setSaveError(
          'Could not save this debrief to Firebase. Check your connection and Firestore rules, then try again.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation across tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabs: TabKey[] = ['email', 'crm', 'internal', 'nextSteps'];
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex]);
    }
  };

  // Extraction provenance — how much of the transcript was actually captured
  const provenance = useMemo(() => {
    const isBlank = (v: string) =>
      !v || v.trim().length === 0 || v.toLowerCase() === 'needs confirmation';

    const stringFields = [clientName, company, dealStage, agreedNextStep];
    const listFields = [
      keyNeeds,
      objections,
      budgetSignals,
      timelineSignals,
      decisionMakers,
      risks,
    ];

    const filled =
      stringFields.filter((v) => !isBlank(v)).length +
      listFields.filter((list) => list.some((item) => item && item.trim())).length;

    const totalFields = stringFields.length + listFields.length;
    const completeness = totalFields > 0 ? filled / totalFields : 0;

    const signalsFound =
      budgetSignals.length +
      timelineSignals.length +
      decisionMakers.length +
      objections.length +
      risks.length;

    return {
      completeness,
      filled,
      totalFields,
      signalsFound,
      bulletCount: internalNotes.length,
      hasNextStep: !isBlank(taskTitle) && !isBlank(taskDueDate),
    };
  }, [
    clientName,
    company,
    dealStage,
    agreedNextStep,
    keyNeeds,
    objections,
    budgetSignals,
    timelineSignals,
    decisionMakers,
    risks,
    internalNotes,
    taskTitle,
    taskDueDate,
  ]);

  const isClientNeedsConfirm = clientName.toLowerCase().includes('needs confirmation');
  const isCompanyNeedsConfirm = company.toLowerCase().includes('needs confirmation');
  const isNextStepNeedsConfirm = agreedNextStep.toLowerCase().includes('needs confirmation');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Top Header with Back & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E4F1FF]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToEdit}
            className="p-2 text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white rounded-xl border border-[#CFE6FF] transition-all shadow-2xs cursor-pointer"
            title="Back to voice notes"
            aria-label="Back to voice notes"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A73D9]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">
                Follow-Up Artifacts
              </h1>
              <span className="text-xs text-[#CFE6FF]">·</span>
              <span className="text-xs text-[#1A73D9] font-bold">
                {clientName !== 'Needs confirmation' ? clientName : 'Call Debrief'}
              </span>
            </div>
            <p className="text-xs text-[#5B6B7F] mt-0.5">
              Review, edit parameters, and export to calendar or client email.
            </p>
          </div>
        </div>

        {/* Desktop Quick Header Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDebrief}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'btn-3d bg-[#1A73D9] hover:bg-[#155FB5] text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Debrief Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving…</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Debrief</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNewDebrief}
            className="px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] transition-all shadow-2xs cursor-pointer"
          >
            New Call
          </button>
        </div>
      </div>

      {/* Fallback Notice if active */}
      {usedFallback && (
        <div className="mb-6 p-3.5 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl text-xs text-[#1A73D9] flex items-center gap-2.5 shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#1A73D9] shrink-0" />
          <span>
            <strong>Verified Sample Loaded:</strong> Displaying pre-analyzed follow-up
            data for Meridian BioTech. All interactive controls are fully editable.
          </span>
        </div>
      )}

      {/* Quiet AI-Generated Glass Notice */}
      <div className="mb-6 p-3.5 bg-white/80 border border-amber-200/80 rounded-2xl text-xs text-[#0F172A] flex items-center gap-2.5 shadow-2xs backdrop-blur-md">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">
          AI-generated — review all dates, names, and commitments before sending to client.
        </span>
      </div>

      {/* Extraction Provenance Panel */}
      <SpotlightCard className="mb-6 rounded-3xl">
        <GlassCard className="p-5 sm:p-6 bg-white/88 border border-white/95 shadow-[0_12px_36px_rgba(26,115,217,0.08)] relative overflow-hidden">
          <AuroraBackdrop intensity={0.45} showGrid={false} />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Completeness ring */}
            <div className="lg:col-span-3 flex items-center gap-4">
              <ConfidenceRing
                value={provenance.completeness}
                size={92}
                strokeWidth={8}
                caption="captured"
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] block">
                  Signal coverage
                </span>
                <span className="text-sm font-bold text-[#0F172A] block mt-0.5 leading-snug">
                  {provenance.filled} of {provenance.totalFields} CRM fields grounded
                </span>
                <span className="text-[11px] text-[#5B6B7F] block mt-1 leading-snug">
                  Unfilled fields are marked “Needs confirmation” — never invented.
                </span>
              </div>
            </div>

            {/* Artifact timeline */}
            <div className="lg:col-span-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] block mb-3">
                Artifact pipeline
              </span>
              <ArtifactTimeline activeIndex={3} />
            </div>

            {/* Mini stats */}
            <div className="lg:col-span-4 grid grid-cols-3 gap-2.5">
              {[
                { label: 'Signals', value: provenance.signalsFound, tone: 'text-[#1A73D9]' },
                { label: 'Handoff bullets', value: provenance.bulletCount, tone: 'text-[#0F172A]' },
                {
                  label: 'Task dated',
                  value: provenance.hasNextStep ? 'Yes' : 'No',
                  tone: provenance.hasNextStep ? 'text-emerald-600' : 'text-amber-600',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-2xl bg-[#F3F9FF]/70 border border-[#CFE6FF]/70 text-center"
                >
                  <div className={`text-lg font-extrabold font-mono tabular-nums ${stat.tone}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[#5B6B7F] mt-0.5 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </SpotlightCard>

      {/* Audio-Out AI Voice Debrief & Grounding Inspector Bar */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left: 30s Audio Debrief Player */}
        <div className="md:col-span-8 p-4 rounded-2xl bg-gradient-to-r from-[#F3F9FF] to-white border border-[#CFE6FF] shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleVoiceDebrief}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isVoicePlaying
                  ? 'bg-rose-600 text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)] animate-pulse'
                  : 'bg-[#1A73D9] hover:bg-[#155FB5] text-white shadow-[0_2px_10px_rgba(26,115,217,0.3)]'
              }`}
              title={isVoicePlaying ? 'Stop Voice Debrief' : 'Play 30s AI Voice Debrief'}
              aria-label={isVoicePlaying ? 'Stop Voice Debrief' : 'Play 30s AI Voice Debrief'}
            >
              {isVoicePlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                  {isVoicePlaying ? 'Speaking Executive Audio Debrief…' : 'Play 30s AI Voice Debrief'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F1FF] text-[#1A73D9] border border-[#CFE6FF]">
                  Audio-Out
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7F] truncate mt-0.5">
                {isVoicePlaying
                  ? 'Browser speech synthesis is reading the executive call recap'
                  : 'Listen to a natural audio recap of client needs, agreed dates, and next steps'}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {isVoicePlaying && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-600">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Playing</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Grounding & Provenance Toggle */}
        <div className="md:col-span-4 p-4 rounded-2xl bg-white/85 border border-[#CFE6FF] shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#0F172A] block">Zero-Hallucination Audit</span>
            <span className="text-[11px] text-[#5B6B7F] block truncate">Inspect raw dictated transcript</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGroundingDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0 ${
              showGroundingDrawer
                ? 'bg-[#1A73D9] text-white border-[#1A73D9] shadow-2xs'
                : 'bg-white text-[#1A73D9] border-[#CFE6FF] hover:bg-[#F3F9FF]'
            }`}
          >
            {showGroundingDrawer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showGroundingDrawer ? 'Hide Source' : 'View Source'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Grounding & Transcript Drawer */}
      {showGroundingDrawer && (
        <div className="mb-6 p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1A73D9]" />
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Raw Grounding Source (Dictated Transcript)
              </span>
            </div>
            <span className="text-[11px] text-[#5B6B7F]">
              Gemini guarantees 100% adherence to this source text
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs text-[#0F172A] leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto select-text shadow-2xs">
            {rawTranscript}
          </div>
          <p className="text-[11px] text-[#5B6B7F] italic">
            Notice: No commitments or prices appear in the follow-up artifacts that are not present in this raw dictation.
          </p>
        </div>
      )}

      {/* Segmented Glass ARIA Tabs with Sliding Active Pill */}
      <div
        role="tablist"
        aria-label="Debrief artifact categories"
        className="flex items-center gap-1.5 p-1.5 bg-white/70 border border-[#CFE6FF] shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_10px_rgba(26,115,217,0.06)] backdrop-blur-lg rounded-2xl mb-8 max-w-full overflow-x-auto"
      >
        <button
          role="tab"
          id="tab-email"
          aria-selected={activeTab === 'email'}
          aria-controls="panel-email"
          tabIndex={activeTab === 'email' ? 0 : -1}
          onClick={() => setActiveTab('email')}
          onKeyDown={(e) => handleTabKeyDown(e, 0)}
          className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'email'
              ? 'bg-[#1A73D9] text-white shadow-[0_2px_10px_rgba(26,115,217,0.35)] font-bold'
              : 'text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white/60'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Follow-up email</span>
        </button>

        <button
          role="tab"
          id="tab-crm"
          aria-selected={activeTab === 'crm'}
          aria-controls="panel-crm"
          tabIndex={activeTab === 'crm' ? 0 : -1}
          onClick={() => setActiveTab('crm')}
          onKeyDown={(e) => handleTabKeyDown(e, 1)}
          className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'crm'
              ? 'bg-[#1A73D9] text-white shadow-[0_2px_10px_rgba(26,115,217,0.35)] font-bold'
              : 'text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>CRM record</span>
        </button>

        <button
          role="tab"
          id="tab-internal"
          aria-selected={activeTab === 'internal'}
          aria-controls="panel-internal"
          tabIndex={activeTab === 'internal' ? 0 : -1}
          onClick={() => setActiveTab('internal')}
          onKeyDown={(e) => handleTabKeyDown(e, 2)}
          className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'internal'
              ? 'bg-[#1A73D9] text-white shadow-[0_2px_10px_rgba(26,115,217,0.35)] font-bold'
              : 'text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Internal note</span>
        </button>

        <button
          role="tab"
          id="tab-nextSteps"
          aria-selected={activeTab === 'nextSteps'}
          aria-controls="panel-nextSteps"
          tabIndex={activeTab === 'nextSteps' ? 0 : -1}
          onClick={() => setActiveTab('nextSteps')}
          onKeyDown={(e) => handleTabKeyDown(e, 3)}
          className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'nextSteps'
              ? 'bg-[#1A73D9] text-white shadow-[0_2px_10px_rgba(26,115,217,0.35)] font-bold'
              : 'text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white/60'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Next step (.ics)</span>
        </button>
      </div>

      {/* TAB PANEL 1: Follow-up Email */}
      {activeTab === 'email' && (
        <GlassCard className="p-6 sm:p-8 bg-white/85 border border-white/95 shadow-[0_12px_36px_rgba(26,115,217,0.08)] space-y-6 animate-fadeIn">
          {/* Tone Selector & 1-Click Dispatch Hub */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4F1FF]">
            {/* Tone selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Email Tone:
              </span>
              <div className="flex items-center gap-1.5 bg-[#F3F9FF] p-1 rounded-xl border border-[#CFE6FF]">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => handleToneChange(tone)}
                    disabled={isRegeneratingTone}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedTone === tone
                        ? 'bg-[#1A73D9] text-white shadow-2xs'
                        : 'text-[#5B6B7F] hover:text-[#0F172A] hover:bg-white/70'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
              {isRegeneratingTone && (
                <span className="inline-flex items-center gap-1 text-xs text-[#1A73D9] ml-2 animate-fadeIn font-semibold">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rewriting with Gemini…</span>
                </span>
              )}
            </div>

            {/* 1-Click Send / Dispatch Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={buildGmailWebUrl({
                  to: clientEmail,
                  subject: emailSubject,
                  body: emailBody,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#D93025] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Opens prefilled draft in Gmail Web in a new tab"
              >
                <Send className="w-3 h-3" />
                <span>Open in Gmail</span>
              </a>

              <a
                href={buildOutlookWebMailUrl({
                  to: clientEmail,
                  subject: emailSubject,
                  body: emailBody,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#006cbd] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Opens prefilled draft in Outlook Web in a new tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Outlook Web</span>
              </a>

              <a
                href={buildMailtoUrl({
                  to: clientEmail,
                  subject: emailSubject,
                  body: emailBody,
                })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] transition-all shadow-2xs cursor-pointer"
                title="Opens your computer or phone's default mail app"
              >
                <Mail className="w-3 h-3 text-[#1A73D9]" />
                <span>Mail app</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] hover:text-[#1A73D9] transition-all shadow-2xs cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#1A73D9]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Client Recipient & Subject Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-[#1A73D9]" />
                <span>Recipient Email</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-3 py-2 text-xs font-mono text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
              />
            </div>

            <div className="sm:col-span-8 space-y-1">
              <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">
                Subject Line
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
              />
            </div>
          </div>

          {/* Email Body Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Email Body
            </label>
            <textarea
              rows={12}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full px-4 py-3 text-sm text-[#0F172A] bg-white border border-[#CFE6FF] rounded-2xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20 leading-relaxed font-sans shadow-inner"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#5B6B7F] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Your profile email signature is automatically appended.</span>
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="text-[#1A73D9] hover:text-[#155FB5] underline font-bold ml-1 cursor-pointer"
                >
                  Edit signature
                </button>
              </div>
              <span className="font-mono tabular-nums text-[#5B6B7F]">{emailBody.length} characters</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB PANEL 2: CRM Record */}
      {activeTab === 'crm' && (
        <div
          role="tabpanel"
          id="panel-crm"
          aria-labelledby="tab-crm"
          className="space-y-6 animate-fadeIn"
        >
          {/* Top toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E4F1FF]">
            <p className="text-xs text-[#5B6B7F]">
              Structured parameters extracted from conversation. Click chips or inputs to edit.
            </p>
            <button
              type="button"
              onClick={handleCopyCRMJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] hover:text-[#1A73D9] transition-all shadow-2xs cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">JSON Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Copy as JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Core Entity Row with Needs Confirmation Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard
              className={`p-4 bg-white/90 border rounded-2xl shadow-2xs space-y-1.5 ${
                isClientNeedsConfirm ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/30' : 'border-[#CFE6FF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Client Name</span>
                </label>
                {isClientNeedsConfirm && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Confirm
                  </span>
                )}
              </div>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              />
            </GlassCard>

            <GlassCard
              className={`p-4 bg-white/90 border rounded-2xl shadow-2xs space-y-1.5 ${
                isCompanyNeedsConfirm ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/30' : 'border-[#CFE6FF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Company</span>
                </label>
                {isCompanyNeedsConfirm && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Confirm
                  </span>
                )}
              </div>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              />
            </GlassCard>

            <GlassCard className="p-4 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Deal Stage</span>
              </label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </GlassCard>
          </div>

          {/* Chip Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Key Needs & Pain Points"
                items={keyNeeds}
                onChange={setKeyNeeds}
                placeholder="Add client need…"
              />
            </GlassCard>

            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Objections & Hesitations"
                items={objections}
                onChange={setObjections}
                placeholder="Add objection…"
              />
            </GlassCard>

            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Budget Signals"
                items={budgetSignals}
                onChange={setBudgetSignals}
                placeholder="Add budget clue…"
              />
            </GlassCard>

            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Timeline Signals"
                items={timelineSignals}
                onChange={setTimelineSignals}
                placeholder="Add timeline milestone…"
              />
            </GlassCard>

            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Decision Makers & Influencers"
                items={decisionMakers}
                onChange={setDecisionMakers}
                placeholder="Add stakeholder…"
              />
            </GlassCard>

            <GlassCard className="p-5 bg-white/90 border border-[#CFE6FF] rounded-2xl shadow-2xs">
              <EditableChipList
                label="Deal Risks & Blockers"
                items={risks}
                onChange={setRisks}
                placeholder="Add risk factor…"
              />
            </GlassCard>
          </div>

          {/* Agreed Next Step Card */}
          <GlassCard
            className={`p-5 bg-white/90 border rounded-2xl shadow-2xs space-y-2 ${
              isNextStepNeedsConfirm ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20' : 'border-[#CFE6FF]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Agreed Deliverable / Next Step
              </label>
              {isNextStepNeedsConfirm && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Needs review
                </span>
              )}
            </div>
            <input
              type="text"
              value={agreedNextStep}
              onChange={(e) => setAgreedNextStep(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
            />
          </GlassCard>
        </div>
      )}

      {/* TAB PANEL 3: Internal Handoff Note */}
      {activeTab === 'internal' && (
        <GlassCard className="p-6 sm:p-8 bg-white/85 border border-white/95 rounded-3xl shadow-[0_12px_36px_rgba(26,115,217,0.08)] space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4F1FF]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Team Handoff Bullets (5–8 Items)
              </h3>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                Internal-only context for solution architects, project managers, and leadership.
              </p>
            </div>

            {/* Team Export Toolbar: Slack, Markdown & Bullets */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCopySlack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#4A154B] hover:bg-[#3c113d] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Copies formatted Slack message with emojis, next steps, and client signals"
              >
                {copiedSlack ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Slack Copied!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Copy for Slack</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Copies Notion/Jira/Linear markdown with checklists and CRM table"
              >
                {copiedMarkdown ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Markdown Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Notion / Markdown</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5B6B7F] hover:text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Copy bullet points only"
              >
                {copiedNotes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Bullets</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {internalNotes.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="text-[#1A73D9] font-bold text-sm mt-1.5">•</span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const updated = [...internalNotes];
                    updated[idx] = e.target.value;
                    setInternalNotes(updated);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = internalNotes.filter((_, i) => i !== idx);
                    setInternalNotes(updated);
                  }}
                  className="p-1.5 text-[#5B6B7F] hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove note bullet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setInternalNotes([...internalNotes, ''])}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73D9] hover:text-[#155FB5] pt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add bullet point</span>
            </button>
          </div>
        </GlassCard>
      )}

      {/* TAB PANEL 4: Next Step Task & Calendar (.ics) */}
      {activeTab === 'nextSteps' && (
        <GlassCard className="p-6 sm:p-8 bg-white/85 border border-white/95 rounded-3xl shadow-[0_12px_36px_rgba(26,115,217,0.08)] space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4F1FF]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Calendar Task & Follow-up Commitment
              </h3>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                Sync straight into your Google Calendar, open a pre-filled event, or download a universal .ics file.
              </p>
            </div>

            {/* Calendar export group: direct sync + deep links + file export */}
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleSyncToGoogleCalendar}
                disabled={calendarSyncState === 'syncing'}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(26,115,217,0.3)] transition-all ${
                  calendarSyncState === 'syncing'
                    ? 'bg-[#1A73D9]/70 text-white cursor-wait'
                    : calendarSyncState === 'synced'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-[#1A73D9] hover:bg-[#155FB5] text-white cursor-pointer'
                }`}
                title="Creates the event directly in your primary Google Calendar (asks for calendar permission once)"
              >
                {calendarSyncState === 'syncing' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : calendarSyncState === 'synced' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <CalendarPlus className="w-3.5 h-3.5" />
                )}
                <span>
                  {calendarSyncState === 'syncing'
                    ? 'Syncing…'
                    : calendarSyncState === 'synced'
                    ? 'Synced'
                    : 'Sync to Google'}
                </span>
              </button>
              <a
                href={buildGoogleCalendarUrl(
                  { title: taskTitle, owner: taskOwner, dueDate: taskDueDate, priority: taskPriority, rationale: taskRationale },
                  clientName,
                  company,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Opens a pre-filled Google Calendar event in a new tab — no sign-in required"
              >
                <Calendar className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Google Cal</span>
              </a>
              <a
                href={buildOutlookCalendarUrl(
                  { title: taskTitle, owner: taskOwner, dueDate: taskDueDate, priority: taskPriority, rationale: taskRationale },
                  clientName,
                  company,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Opens Outlook Web in a new tab"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Outlook</span>
              </a>
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Download .ics file — works with Apple Calendar, Outlook Desktop, and any standard calendar app"
              >
                <Download className="w-3.5 h-3.5 text-[#1A73D9]" />
                <span>Download .ics</span>
              </button>
            </div>
          </div>

          {/* Google Calendar sync feedback */}
          {calendarSyncState === 'synced' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Added to your primary Google Calendar</p>
                <p className="text-emerald-800 mt-0.5">
                  “{taskTitle}” is scheduled for {new Date(`${taskDueDate}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  with a reminder an hour before.
                </p>
                {calendarEventLink && (
                  <a
                    href={calendarEventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Open the event in Google Calendar</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={handleSyncToGoogleCalendar}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
              >
                Sync again
              </button>
            </div>
          )}

          {calendarSyncState === 'error' && calendarSyncError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Google Calendar sync failed</p>
                <p className="text-rose-800 mt-0.5">{calendarSyncError}</p>
                <p className="text-[11px] text-rose-700 mt-1">
                  You can still use the “Google Cal” prefilled event or the .ics download below.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncToGoogleCalendar}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Owner
              </label>
              <input
                type="text"
                value={taskOwner}
                onChange={(e) => setTaskOwner(e.target.value)}
                className="w-full px-3.5 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPriority(p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      taskPriority === p
                        ? p === 'High'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                          : 'bg-[#F3F9FF] border-[#1A73D9] text-[#1A73D9] shadow-2xs'
                        : 'bg-white border-[#CFE6FF] text-[#5B6B7F] hover:bg-[#F3F9FF]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                AI Rationale & Context
              </label>
              <textarea
                rows={3}
                value={taskRationale}
                onChange={(e) => setTaskRationale(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Floating Sticky Glass Action Bar for Results */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-8 z-30 pointer-events-none">
        <div className="pointer-events-auto p-2 bg-white/95 backdrop-blur-xl border border-white/95 shadow-[0_12px_40px_rgba(26,115,217,0.2)] rounded-2xl flex items-center gap-2">
          <a
            href={buildGmailWebUrl({
              to: clientEmail,
              subject: emailSubject,
              body: emailBody,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#EA4335] hover:bg-[#D93025] rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Draft in Gmail Web"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gmail Draft</span>
          </a>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#1A73D9]" />}
            <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCalendar}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#1A73D9]" />
            <span>.ics</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDebrief}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-[0_2px_10px_rgba(26,115,217,0.3)] transition-all cursor-pointer ${
              savedSuccess ? 'bg-emerald-600' : 'bg-[#1A73D9] hover:bg-[#155FB5]'
            }`}
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saved!' : isSaving ? 'Saving…' : 'Save Debrief'}</span>
          </button>
        </div>
      </div>

      {/* Save failure toast */}
      {saveError && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 shadow-xl flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Debrief not saved</p>
            <p className="mt-0.5">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-[11px] font-semibold underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
