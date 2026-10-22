import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  DebriefResult,
  EmailTone,
  DealStage,
  TaskPriority,
  DebriefDocument,
} from '../types';
import { EditableChipList } from '../components/EditableChipList';
import { downloadTaskIcs } from '../services/ics';
import { regenerateEmailTone } from '../services/geminiClient';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/GlassCard';

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

  const { appendUserSignature, openProfileModal, emailSignature } = useAuth();

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

  // Save Debrief Document
  const handleSaveDebrief = async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const docId = existingId || `debrief-${Date.now()}`;

      const docToSave: DebriefDocument = {
        id: docId,
        userId: 'guest',
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
      console.error('Error saving debrief:', err);
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
          {/* Tone Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4F1FF]">
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

            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] hover:text-[#1A73D9] transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Copy email</span>
                </>
              )}
            </button>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Subject Line
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
            />
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
          <div className="flex items-center justify-between pb-4 border-b border-[#E4F1FF]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Team Handoff Bullets (5–8 Items)
              </h3>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                Internal-only context for solution architects, project managers, and leadership.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyNotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] hover:text-[#1A73D9] transition-all shadow-2xs cursor-pointer"
            >
              {copiedNotes ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Notes Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span>Copy notes</span>
                </>
              )}
            </button>
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
                Export standard RFC 5545 .ics file for Google Calendar, Apple Calendar, or Outlook.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadCalendar}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl shadow-[0_2px_10px_rgba(26,115,217,0.3)] transition-all cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Add to Calendar (.ics)</span>
            </button>
          </div>

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
    </div>
  );
};
