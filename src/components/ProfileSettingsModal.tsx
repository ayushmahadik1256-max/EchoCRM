import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  FileSignature,
  Sparkles,
  User,
  Building,
  Briefcase,
  Phone,
  Globe,
  Linkedin,
  Sliders,
  Download,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { clearLocalData } from '../services/localStorage';
import {
  DealStage,
  EmailTone,
  TaskPriority,
  DebriefDocument,
} from '../types';
import { GlassCard } from './GlassCard';

interface ProfileSettingsModalProps {
  allDebriefs?: DebriefDocument[];
  onReplayTour?: () => void;
  onDataCleared?: () => void;
}

type SettingsTab = 'profile' | 'preferences' | 'data';

const DEAL_STAGES: DealStage[] = [
  'Lead',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

const EMAIL_TONES: EmailTone[] = ['Warm', 'Professional', 'Direct'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const DUE_DATE_OFFSETS = [1, 2, 3, 5];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  allDebriefs = [],
  onReplayTour,
  onDataCleared,
}) => {
  const {
    isProfileModalOpen,
    closeProfileModal,
    userProfile,
    updateUserProfile,
    localUser,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [senderName, setSenderName] = useState(userProfile.senderName || '');
  const [senderTitle, setSenderTitle] = useState(userProfile.senderTitle || '');
  const [company, setCompany] = useState(userProfile.company || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [website, setWebsite] = useState(userProfile.website || '');
  const [linkedInUrl, setLinkedInUrl] = useState(userProfile.linkedInUrl || '');
  const [signature, setSignature] = useState(userProfile.emailSignature || 'Best regards,');
  const [appendSignature, setAppendSignature] = useState(userProfile.appendSignature !== false);

  // Preference states
  const [defaultTone, setDefaultTone] = useState<EmailTone>(userProfile.defaultTone || 'Professional');
  const [defaultDealStage, setDefaultDealStage] = useState<DealStage>(userProfile.defaultDealStage || 'Discovery');
  const [defaultDueDateOffset, setDefaultDueDateOffset] = useState<number>(userProfile.defaultDueDateOffset || 2);
  const [defaultTaskPriority, setDefaultTaskPriority] = useState<TaskPriority>(userProfile.defaultTaskPriority || 'Medium');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileModalOpen) {
      setSenderName(userProfile.senderName || '');
      setSenderTitle(userProfile.senderTitle || '');
      setCompany(userProfile.company || '');
      setPhone(userProfile.phone || '');
      setWebsite(userProfile.website || '');
      setLinkedInUrl(userProfile.linkedInUrl || '');
      setSignature(userProfile.emailSignature || 'Best regards,');
      setAppendSignature(userProfile.appendSignature !== false);
      setDefaultTone(userProfile.defaultTone || 'Professional');
      setDefaultDealStage(userProfile.defaultDealStage || 'Discovery');
      setDefaultDueDateOffset(userProfile.defaultDueDateOffset || 2);
      setDefaultTaskPriority(userProfile.defaultTaskPriority || 'Medium');
      setShowSavedNotification(false);
      setConfirmClearData(false);
      setDataError(null);
    }
  }, [isProfileModalOpen, userProfile]);

  if (!isProfileModalOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        senderName: senderName.trim(),
        senderTitle: senderTitle.trim(),
        company: company.trim(),
        phone: phone.trim(),
        website: website.trim(),
        linkedInUrl: linkedInUrl.trim(),
        emailSignature: signature.trim(),
        appendSignature,
        defaultTone,
        defaultDealStage,
        defaultDueDateOffset,
        defaultTaskPriority,
      });
      setShowSavedNotification(true);
      setTimeout(() => {
        setShowSavedNotification(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyStandardTemplate = () => {
    const name = senderName.trim() || localUser.displayName || 'Alex Chen';
    const title = senderTitle.trim() || 'Senior Client Consultant';
    const comp = company.trim() || 'Echo Advisory Group';
    const ph = phone.trim() || '+1 (555) 234-8901';
    const web = website.trim() || 'echoadvisory.example.com';
    const email = localUser.email || 'alex@echoadvisory.com';

    setSignature(`Best regards,\n${name}\n${title} | ${comp}\nDirect: ${ph} · ${email}\nWeb: ${web}`);
  };

  const handleApplyMinimalTemplate = () => {
    const name = senderName.trim() || localUser.displayName || 'Alex Chen';
    const comp = company.trim() || 'Echo Advisory';
    setSignature(`Best,\n${name} · ${comp}`);
  };

  // Export handlers
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allDebriefs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `echocrm-debriefs-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Client Name',
      'Company',
      'Deal Stage',
      'Call Date',
      'Status',
      'Next Step Title',
      'Due Date',
      'Priority',
      'Email Subject',
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = allDebriefs.map((d) => [
      d.id,
      d.clientName || '',
      d.company || '',
      d.dealStage || '',
      d.callDate || '',
      d.status || '',
      d.nextStep?.title || '',
      d.nextStep?.dueDate || '',
      d.nextStep?.priority || '',
      d.emailSubject || '',
    ]);

    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `echocrm-debriefs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    setDataError(null);
    try {
      await clearLocalData();
      setConfirmClearData(false);
      onDataCleared?.();
    } catch (err) {
      console.error('Failed to clear browser data:', err);
      setDataError('Could not clear data saved in this browser.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-settings-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-white/95 border border-white/95 rounded-3xl shadow-[0_24px_64px_rgba(26,115,217,0.18)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4F1FF] bg-[#F3F9FF]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A73D9] to-[#7FB8F2] flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-settings-title" className="text-sm font-bold text-[#0F172A]">
                EchoCRM Settings & Preferences
              </h2>
              <p className="text-[11px] text-[#5B6B7F]">
                Profile identity, automated signatures, default workflow, and data controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeProfileModal}
            className="p-1.5 text-[#5B6B7F] hover:text-[#0F172A] rounded-xl hover:bg-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E4F1FF] bg-white px-6 gap-2 text-xs font-semibold text-[#5B6B7F]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#1A73D9] text-[#1A73D9] font-bold'
                : 'border-transparent hover:text-[#0F172A]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Signature</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-[#1A73D9] text-[#1A73D9] font-bold'
                : 'border-transparent hover:text-[#0F172A]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Default Workflow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-[#1A73D9] text-[#1A73D9] font-bold'
                : 'border-transparent hover:text-[#0F172A]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Data Controls</span>
          </button>

        </div>

        {/* Tab Content Panels */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {/* TAB 1: PROFILE & SIGNATURE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Profile Card Header with Avatar */}
              <div className="flex items-center gap-4 p-4 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-[#1A73D9] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {senderName
                    ? senderName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'EC'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#0F172A] truncate">
                    {senderName || 'Your Name'}
                  </h4>
                  <p className="text-xs text-[#5B6B7F] truncate">
                    {senderTitle ? `${senderTitle} · ` : ''}
                    {company || 'Your Company'}
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#CFE6FF] text-[#1A73D9] font-bold font-mono">
                  Cloud Synced
                </span>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <User className="w-3 h-3 text-[#1A73D9]" />
                    <span>Display Name</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#1A73D9]" />
                    <span>Role / Title</span>
                  </label>
                  <input
                    type="text"
                    value={senderTitle}
                    onChange={(e) => setSenderTitle(e.target.value)}
                    placeholder="e.g. Principal Consultant"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#1A73D9]" />
                    <span>Company</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Echo Advisory"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#1A73D9]" />
                    <span>Phone</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-8901"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#1A73D9]" />
                    <span>Website</span>
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://echoadvisory.example.com"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Linkedin className="w-3 h-3 text-[#1A73D9]" />
                    <span>LinkedIn URL</span>
                  </label>
                  <input
                    type="text"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/alexchen"
                    className="w-full px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                  />
                </div>
              </div>

              {/* Email Signature Section */}
              <div className="pt-4 border-t border-[#E4F1FF] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Email Signature</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyStandardTemplate}
                      className="text-[11px] text-[#1A73D9] hover:text-[#155FB5] font-semibold underline cursor-pointer"
                    >
                      Fill Standard
                    </button>
                    <span className="text-[#CFE6FF]">·</span>
                    <button
                      type="button"
                      onClick={handleApplyMinimalTemplate}
                      className="text-[11px] text-[#1A73D9] hover:text-[#155FB5] font-semibold underline cursor-pointer"
                    >
                      Fill Minimal
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter email signature to be appended to all generated client emails..."
                  className="w-full px-3.5 py-2.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] font-mono leading-relaxed shadow-inner"
                />

                {/* Append Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">
                      Append signature to generated emails
                    </span>
                    <span className="text-[11px] text-[#5B6B7F]">
                      When enabled, this signature is automatically attached to client follow-up drafts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={appendSignature}
                    onChange={(e) => setAppendSignature(e.target.checked)}
                    className="w-4 h-4 text-[#1A73D9] rounded border-[#CFE6FF] focus:ring-[#1A73D9] cursor-pointer"
                  />
                </div>

                {/* Live Signature Preview */}
                <div className="p-3.5 bg-white border border-[#CFE6FF] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#5B6B7F] uppercase tracking-wider">
                    Live Signature Preview
                  </span>
                  <div className="text-xs text-[#0F172A] whitespace-pre-wrap font-sans bg-[#F3F9FF]/60 p-3 rounded-xl border border-[#E4F1FF]">
                    {appendSignature ? (
                      signature.trim() ? signature : <span className="text-[#5B6B7F] italic">No signature text entered.</span>
                    ) : (
                      <span className="text-amber-700 text-xs italic font-medium">
                        Signature appending is currently toggled OFF.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEFAULT WORKFLOW PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Default Generation & Workflow Preferences
                </h4>
                <p className="text-xs text-[#5B6B7F]">
                  Pre-select standard settings for new call debriefs to streamline your routine.
                </p>
              </div>

              {/* Default Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Default Email Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EMAIL_TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setDefaultTone(tone)}
                      className={`py-2 px-3 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                        defaultTone === tone
                          ? 'bg-[#F3F9FF] border-[#1A73D9] text-[#1A73D9] shadow-2xs'
                          : 'bg-white border-[#CFE6FF] text-[#5B6B7F] hover:bg-[#F3F9FF]'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Deal Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Default Deal Stage
                </label>
                <select
                  value={defaultDealStage}
                  onChange={(e) => setDefaultDealStage(e.target.value as DealStage)}
                  className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                >
                  {DEAL_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Due Date Offset */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Default Task Due-Date Offset
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DUE_DATE_OFFSETS.map((offset) => (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => setDefaultDueDateOffset(offset)}
                      className={`py-2 px-3 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                        defaultDueDateOffset === offset
                          ? 'bg-[#F3F9FF] border-[#1A73D9] text-[#1A73D9] shadow-2xs'
                          : 'bg-white border-[#CFE6FF] text-[#5B6B7F] hover:bg-[#F3F9FF]'
                      }`}
                    >
                      +{offset} business {offset === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Default Task Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDefaultTaskPriority(p)}
                      className={`py-2 px-3 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                        defaultTaskPriority === p
                          ? 'bg-[#F3F9FF] border-[#1A73D9] text-[#1A73D9] shadow-2xs'
                          : 'bg-white border-[#CFE6FF] text-[#5B6B7F] hover:bg-[#F3F9FF]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATA CONTROLS & EXPORT */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Data Portability & Management
                </h4>
                <p className="text-xs text-[#5B6B7F]">
                  Export your saved debriefs, clear browser data, or replay the app walkthrough.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="p-4 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">
                      Export All Debriefs
                    </span>
                    <span className="text-[11px] text-[#5B6B7F]">
                      {allDebriefs.length} recorded debriefs available
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    disabled={allDebriefs.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#E4F1FF] hover:text-[#1A73D9] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-[#1A73D9]" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={allDebriefs.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#E4F1FF] hover:text-[#1A73D9] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Replay Onboarding */}
              <div className="p-4 bg-white border border-[#CFE6FF] rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Guided Onboarding Tour
                  </span>
                  <span className="text-[11px] text-[#5B6B7F]">
                    Review the 3-step voice debrief walkthrough at any time.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeProfileModal();
                    if (onReplayTour) onReplayTour();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1A73D9] bg-[#F3F9FF] border border-[#CFE6FF] rounded-xl hover:bg-[#E4F1FF] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Tour</span>
                </button>
              </div>

              {/* Clear browser data */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Clear Saved Data</span>
                    </span>
                    <span className="text-[11px] text-rose-700">
                      Permanently deletes saved debriefs, templates, and preferences from this browser.
                    </span>
                  </div>

                  {!confirmClearData ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearData(true)}
                      disabled={allDebriefs.length === 0}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Delete Data
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearData}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                      >
                        Yes, Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearData(false)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#5B6B7F] hover:text-[#0F172A] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {dataError && <p role="alert" className="text-xs text-rose-700">{dataError}</p>}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F3F9FF]/60 border-t border-[#E4F1FF] flex items-center justify-between">
          <div className="text-xs text-[#5B6B7F]">
            {showSavedNotification && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>Changes saved successfully</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeProfileModal}
              className="px-4 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl hover:bg-[#F3F9FF] transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1A73D9] rounded-xl hover:bg-[#155FB5] shadow-[0_2px_10px_rgba(26,115,217,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving…</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
