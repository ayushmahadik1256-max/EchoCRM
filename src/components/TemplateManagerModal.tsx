import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  BookmarkCheck,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { CallTemplate, DealStage, EmailTone } from '../types';
import { CALL_TEMPLATES } from '../data/templates';
import { useProfile } from '../hooks/useProfile';
import {
  fetchTemplates,
  saveTemplate,
  deleteTemplate,
} from '../services/localStorage';
import { GlassCard } from './GlassCard';

const DEAL_STAGES: DealStage[] = [
  'Lead', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost',
];
const EMAIL_TONES: EmailTone[] = ['Warm', 'Professional', 'Direct'];
const MAX_PROMPTS = 6;

type Tab = 'my' | 'system';

interface TemplateFormState {
  name: string;
  description: string;
  dealStage: DealStage;
  preferredTone: EmailTone;
  placeholderHint: string;
  suggestedPrompts: string[];
}

const EMPTY_FORM: TemplateFormState = {
  name: '',
  description: '',
  dealStage: 'Discovery',
  preferredTone: 'Professional',
  placeholderHint: '',
  suggestedPrompts: [''],
};

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a save/delete so the parent can refresh the template list */
  onTemplatesChanged: (templates: CallTemplate[]) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onTemplatesChanged,
}) => {
  const { localUser } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [userTemplates, setUserTemplates] = useState<CallTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null); // null = new template
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const tpls = await fetchTemplates();
      setUserTemplates(tpls);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setActionError('Could not load templates saved in this browser.');
    } finally {
      setLoading(false);
    }
  }, [localUser]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setDeleteConfirmId(null);
    }
  }, [isOpen, loadTemplates]);

  if (!isOpen) return null;

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (tpl: CallTemplate) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      description: tpl.description,
      dealStage: tpl.dealStage,
      preferredTone: tpl.preferredTone,
      placeholderHint: tpl.placeholderHint,
      suggestedPrompts: tpl.suggestedPrompts.length > 0 ? tpl.suggestedPrompts : [''],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    setActionError(null);

    const now = new Date().toISOString();
    const id = editingId || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const template: CallTemplate = {
      id,
      userId: localUser.uid,
      name: form.name.trim(),
      description: form.description.trim(),
      dealStage: form.dealStage,
      preferredTone: form.preferredTone,
      placeholderHint: form.placeholderHint.trim(),
      suggestedPrompts: form.suggestedPrompts.map((p) => p.trim()).filter(Boolean),
      isCustom: true,
      createdAt: editingId ? (userTemplates.find((t) => t.id === editingId)?.createdAt ?? now) : now,
      updatedAt: now,
    };

    try {
      await saveTemplate(template);

      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);

      await loadTemplates();
      onTemplatesChanged(await fetchTemplates());

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('Failed to save template:', err);
      setActionError('Could not save this template in this browser.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tplId: string) => {
    try {
      setActionError(null);
      await deleteTemplate(tplId);
      await loadTemplates();
      onTemplatesChanged(await fetchTemplates());
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete template:', err);
      setActionError('Could not delete this template. Please try again.');
    }
  };

  const updatePrompt = (idx: number, value: string) => {
    const updated = [...form.suggestedPrompts];
    updated[idx] = value;
    setForm((f) => ({ ...f, suggestedPrompts: updated }));
  };

  const addPrompt = () => {
    if (form.suggestedPrompts.length < MAX_PROMPTS) {
      setForm((f) => ({ ...f, suggestedPrompts: [...f.suggestedPrompts, ''] }));
    }
  };

  const removePrompt = (idx: number) => {
    setForm((f) => ({
      ...f,
      suggestedPrompts: f.suggestedPrompts.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Manage Call Templates"
    >
      <GlassCard className="w-full max-w-xl bg-white/97 border border-white/95 rounded-3xl shadow-[0_24px_60px_rgba(26,115,217,0.18)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4F1FF]">
          <div className="flex items-center gap-2.5">
            <BookmarkCheck className="w-4.5 h-4.5 text-[#1A73D9]" />
            <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
              Call Templates
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5B6B7F] hover:text-[#0F172A] hover:bg-[#F3F9FF] rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['my', 'system'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#1A73D9] text-white border-[#1A73D9]'
                  : 'bg-white text-[#5B6B7F] border-[#CFE6FF] hover:bg-[#F3F9FF]'
              }`}
            >
              {tab === 'my' ? `My Templates${userTemplates.length ? ` (${userTemplates.length})` : ''}` : 'System Templates'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {actionError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-900"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}
          {/* My Templates Tab */}
          {activeTab === 'my' && (
            <>
              {!showForm && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#1A73D9] bg-[#F3F9FF] border border-dashed border-[#CFE6FF] hover:border-[#1A73D9] hover:bg-[#E4F1FF] rounded-2xl transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Custom Template</span>
                </button>
              )}

              {/* Inline Create / Edit Form */}
              {showForm && (
                <div className="p-4 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl space-y-3 animate-fadeIn">
                  <h3 className="text-xs font-extrabold text-[#0F172A]">
                    {editingId ? 'Edit Template' : 'New Template'}
                  </h3>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#0F172A] block mb-1">Template Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Renewal Check-In"
                        className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#0F172A] block mb-1">Description</label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Short summary of this call type"
                        className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-[#0F172A] block mb-1">Deal Stage</label>
                        <select
                          value={form.dealStage}
                          onChange={(e) => setForm((f) => ({ ...f, dealStage: e.target.value as DealStage }))}
                          className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                        >
                          {DEAL_STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#0F172A] block mb-1">Default Tone</label>
                        <select
                          value={form.preferredTone}
                          onChange={(e) => setForm((f) => ({ ...f, preferredTone: e.target.value as EmailTone }))}
                          className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                        >
                          {EMAIL_TONES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#0F172A] block mb-1">Placeholder Hint</label>
                      <input
                        type="text"
                        value={form.placeholderHint}
                        onChange={(e) => setForm((f) => ({ ...f, placeholderHint: e.target.value }))}
                        placeholder="e.g. Just spoke with Jamie about renewal…"
                        className="w-full px-3 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                      />
                    </div>

                    {/* Suggested Prompts */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#0F172A]">
                          Guiding Questions (up to {MAX_PROMPTS})
                        </label>
                        {form.suggestedPrompts.length < MAX_PROMPTS && (
                          <button
                            type="button"
                            onClick={addPrompt}
                            className="text-[11px] font-bold text-[#1A73D9] hover:text-[#155FB5] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {form.suggestedPrompts.map((prompt, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#1A73D9] w-4 shrink-0">{idx + 1}.</span>
                            <input
                              type="text"
                              value={prompt}
                              onChange={(e) => updatePrompt(idx, e.target.value)}
                              placeholder={`Question ${idx + 1}…`}
                              className="flex-1 px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
                            />
                            {form.suggestedPrompts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePrompt(idx)}
                                className="p-1 text-[#5B6B7F] hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !form.name.trim()}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        form.name.trim() && !isSaving
                          ? 'bg-[#1A73D9] hover:bg-[#155FB5] text-white shadow-2xs'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? (
                        <span>Saving…</span>
                      ) : savedId ? (
                        <><Check className="w-3.5 h-3.5" /><span>Saved!</span></>
                      ) : (
                        <><Check className="w-3.5 h-3.5" /><span>{editingId ? 'Save Changes' : 'Create Template'}</span></>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                      className="px-4 py-2 text-xs font-semibold text-[#5B6B7F] bg-white border border-[#CFE6FF] hover:bg-[#F3F9FF] rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Template list */}
              {loading ? (
                <p className="text-xs text-[#5B6B7F] text-center py-4">Loading templates…</p>
              ) : userTemplates.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Sparkles className="w-6 h-6 text-[#CFE6FF] mx-auto" />
                  <p className="text-xs text-[#5B6B7F]">No custom templates yet.</p>
                  <p className="text-[11px] text-[#5B6B7F]">
                    Create one above to reuse your preferred call structure, deal stage, and prompts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3.5 bg-white border border-[#CFE6FF] rounded-2xl flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0F172A] truncate">{tpl.name}</span>
                          {savedId === tpl.id && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              Saved
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5B6B7F] mt-0.5 truncate">{tpl.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#F3F9FF] text-[#1A73D9] text-[10px] font-semibold border border-[#CFE6FF]">
                            {tpl.dealStage}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F3F9FF] text-[#5B6B7F] text-[10px] font-semibold border border-[#CFE6FF]">
                            {tpl.preferredTone}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {deleteConfirmId === tpl.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-rose-700 font-semibold">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(tpl.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#5B6B7F] bg-white border border-[#CFE6FF] rounded-lg cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(tpl)}
                              className="p-1.5 text-[#5B6B7F] hover:text-[#1A73D9] hover:bg-[#F3F9FF] rounded-lg transition-colors cursor-pointer"
                              title="Edit template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(tpl.id)}
                              className="p-1.5 text-[#5B6B7F] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}

          {/* System Templates Tab */}
          {activeTab === 'system' && (
            <div className="space-y-2">
              {CALL_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 bg-[#F3F9FF] border border-[#CFE6FF] rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">{tpl.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#5B6B7F] text-[10px] font-semibold border border-[#CFE6FF]">
                      Built-in
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B6B7F]">{tpl.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#1A73D9] text-[10px] font-semibold border border-[#CFE6FF]">
                      {tpl.dealStage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#5B6B7F] text-[10px] font-semibold border border-[#CFE6FF]">
                      {tpl.preferredTone}
                    </span>
                  </div>
                  {tpl.suggestedPrompts.length > 0 && (
                    <ul className="space-y-1">
                      {tpl.suggestedPrompts.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[#5B6B7F]">
                          <ChevronRight className="w-3 h-3 text-[#1A73D9] shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E4F1FF]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-[#5B6B7F] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
