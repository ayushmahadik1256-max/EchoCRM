import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpDown,
  Plus,
  Trash2,
  ChevronRight,
  Inbox,
  AlertCircle,
  Tag,
  Building,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DebriefDocument, DealStage, DebriefStatus } from '../types';
import { GlassCard } from '../components/GlassCard';
import { TiltCard } from '../components/TiltCard';
import { LedgerAnalytics } from '../components/visuals/LedgerAnalytics';
import { AnimatedNumber } from '../components/visuals/AnimatedNumber';
import { PipelineFunnel } from '../components/visuals/PipelineFunnel';
import { AuroraBackdrop } from '../components/visuals/AuroraBackdrop';
import { SpotlightCard } from '../components/visuals/SpotlightCard';

interface HistoryDashboardScreenProps {
  debriefs: DebriefDocument[];
  onSelectDebrief: (debrief: DebriefDocument) => void;
  onToggleStatus: (id: string, currentStatus: DebriefStatus) => void;
  onDeleteDebrief: (id: string) => void;
  onNewDebrief: () => void;
  isGuest: boolean;
}

type DueFilter = 'All' | 'Overdue' | 'Today' | 'This week' | 'Later' | 'Done';
type SortOption = 'newest' | 'oldest' | 'dueSoon';

export const HistoryDashboardScreen: React.FC<HistoryDashboardScreenProps> = ({
  debriefs,
  onSelectDebrief,
  onToggleStatus,
  onDeleteDebrief,
  onNewDebrief,
  isGuest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [dueFilter, setDueFilter] = useState<DueFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = debriefs.length;
    let openCount = 0;
    let overdueCount = 0;
    let todayCount = 0;
    let doneCount = 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    debriefs.forEach((d) => {
      if (d.status === 'Done') {
        doneCount++;
        return;
      }
      openCount++;

      const dueDateStr = d.nextStep?.dueDate;
      if (dueDateStr) {
        const due = new Date(dueDateStr);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - todayDate.getTime()) / 86400000);
        if (diffDays < 0) {
          overdueCount++;
        } else if (diffDays === 0) {
          todayCount++;
        }
      }
    });

    return { total, openCount, overdueCount, todayCount, doneCount };
  }, [debriefs]);

  // Deal-stage distribution for the pipeline funnel
  const stageDistribution = useMemo(() => {
    const order: DealStage[] = [
      'Lead',
      'Discovery',
      'Proposal',
      'Negotiation',
      'Closed Won',
      'Closed Lost',
    ];

    return order
      .map((stage) => ({
        label: stage,
        value: debriefs.filter((d) => d.dealStage === stage).length,
      }))
      .filter((s) => s.value > 0);
  }, [debriefs]);

  // Filter and sort items
  const filteredDebriefs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return debriefs
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const client = (item.clientName || '').toLowerCase();
          const comp = (item.company || '').toLowerCase();
          const task = (item.nextStep?.title || '').toLowerCase();
          if (!client.includes(q) && !comp.includes(q) && !task.includes(q)) {
            return false;
          }
        }

        // Deal stage filter
        if (stageFilter !== 'All' && item.dealStage !== stageFilter) {
          return false;
        }

        // Due date filter
        if (dueFilter !== 'All') {
          if (dueFilter === 'Done') {
            return item.status === 'Done';
          }
          if (item.status === 'Done') {
            return false;
          }

          const dueDateStr = item.nextStep?.dueDate;
          if (!dueDateStr) return false;
          const due = new Date(dueDateStr);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

          if (dueFilter === 'Overdue' && diffDays >= 0) return false;
          if (dueFilter === 'Today' && diffDays !== 0) return false;
          if (dueFilter === 'This week' && (diffDays < 0 || diffDays > 7)) return false;
          if (dueFilter === 'Later' && diffDays <= 7) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'dueSoon') {
          const dueA = a.nextStep?.dueDate ? new Date(a.nextStep.dueDate).getTime() : Infinity;
          const dueB = b.nextStep?.dueDate ? new Date(b.nextStep.dueDate).getTime() : Infinity;
          return dueA - dueB;
        }
        return 0;
      });
  }, [debriefs, searchQuery, stageFilter, dueFilter, sortBy]);

  // Helper to get due status badge styling
  const getDueBadge = (dueDateStr?: string, status?: DebriefStatus) => {
    if (status === 'Done') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-[#5B6B7F] border border-slate-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Done</span>
        </span>
      );
    }
    if (!dueDateStr) {
      return <span className="text-[11px] text-[#5B6B7F]">No due date</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);

    if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3 text-rose-600" />
          <span>Overdue ({Math.abs(diff)}d)</span>
        </span>
      );
    }
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>Due today</span>
        </span>
      );
    }
    if (diff === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F9FF] text-[#1A73D9] border border-[#CFE6FF]">
          <span>Tomorrow</span>
        </span>
      );
    }
    if (diff <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F9FF] text-[#1A73D9] border border-[#CFE6FF]">
          <span>In {diff} days</span>
        </span>
      );
    }
    return <span className="text-xs font-mono text-[#5B6B7F]">{dueDateStr}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4F1FF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Debrief Ledger & Action Items
          </h1>
          <p className="text-xs text-[#5B6B7F] mt-1">
            Track call conclusions, agreed deadlines, and toggle completed follow-ups.
          </p>
        </div>

        <button
          onClick={onNewDebrief}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl transition-all shadow-[0_2px_10px_rgba(26,115,217,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Call Debrief</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 my-6">
        {[
          { label: 'Total Debriefs', value: metrics.total, color: 'text-[#0F172A]' },
          { label: 'Open Follow-ups', value: metrics.openCount, color: 'text-[#1A73D9]' },
          {
            label: 'Overdue',
            value: metrics.overdueCount,
            color: metrics.overdueCount > 0 ? 'text-rose-600' : 'text-[#5B6B7F]',
          },
          {
            label: 'Due Today',
            value: metrics.todayCount,
            color: metrics.todayCount > 0 ? 'text-amber-600' : 'text-[#5B6B7F]',
          },
          { label: 'Completed', value: metrics.doneCount, color: 'text-emerald-600' },
        ].map((kpi, idx) => (
          <TiltCard key={kpi.label} maxTilt={7} scale={1.03}>
            <SpotlightCard className="rounded-[20px] h-full">
              <GlassCard className="p-4 bg-white/80 border border-white/90 shadow-[0_8px_24px_rgba(26,115,217,0.08)] h-full relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute -top-10 -right-8 w-24 h-24 rounded-full bg-[#CFE6FF]/40 blur-2xl pointer-events-none"
                />
                <div className="relative">
                  <div className="text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider">
                    {kpi.label}
                  </div>
                  <div
                    className={`text-xl font-extrabold font-mono tabular-nums mt-1 ${kpi.color}`}
                  >
                    <AnimatedNumber value={kpi.value} durationMs={700 + idx * 90} />
                  </div>
                  {/* Micro progress rail */}
                  <div className="mt-2 h-1 w-full rounded-full bg-[#E4F1FF] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#AFD3FA] to-[#1A73D9] transition-[width] duration-700 ease-out"
                      style={{
                        width: `${
                          metrics.total > 0
                            ? Math.max(
                                6,
                                (kpi.value / metrics.total) * 100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </GlassCard>
            </SpotlightCard>
          </TiltCard>
        ))}
      </div>

      {/* Analytics + Pipeline Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <LedgerAnalytics debriefs={debriefs} />
        </div>

        <SpotlightCard className="rounded-2xl h-full">
          <GlassCard className="p-4 sm:p-5 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] h-full relative overflow-hidden">
            <AuroraBackdrop intensity={0.5} showGrid={false} />

            <div className="relative flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1A73D9]" />
                Pipeline Snapshot
              </span>
              <span className="text-[11px] font-mono text-[#5B6B7F] tabular-nums">
                {stageDistribution.length} stage{stageDistribution.length === 1 ? '' : 's'}
              </span>
            </div>

            {stageDistribution.length > 0 ? (
              <div className="relative">
                <PipelineFunnel stages={stageDistribution} />
              </div>
            ) : (
              <div className="relative h-[220px] flex items-center justify-center text-xs text-[#5B6B7F] text-center px-4">
                No debriefs have reached a tracked deal stage yet.
              </div>
            )}
          </GlassCard>
        </SpotlightCard>
      </div>

      {/* Sticky Filter & Search Toolbar */}
      <div className="sticky top-16 z-20 py-3 mb-6 bg-white/90 backdrop-blur-md border-y border-[#E4F1FF] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, company, or task…"
            className="w-full pl-9 pr-3.5 py-2 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9] focus:ring-2 focus:ring-[#1A73D9]/20 shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Due Filter */}
          <div className="flex items-center gap-1 bg-[#F3F9FF] p-1 rounded-xl border border-[#CFE6FF] text-xs">
            {(['All', 'Overdue', 'Today', 'This week', 'Done'] as DueFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDueFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dueFilter === f
                    ? 'bg-[#1A73D9] text-white shadow-2xs'
                    : 'text-[#5B6B7F] hover:text-[#0F172A]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Deal Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
          >
            <option value="All">All Stages</option>
            <option value="Lead">Lead</option>
            <option value="Discovery">Discovery</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-xs text-[#0F172A] bg-white border border-[#CFE6FF] rounded-xl focus:outline-none focus:border-[#1A73D9]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueSoon">Due Soonest</option>
          </select>
        </div>
      </div>

      {/* Main Table / Ledger */}
      <GlassCard className="bg-white/90 border border-white/95 rounded-2xl shadow-[0_8px_32px_rgba(26,115,217,0.06)] overflow-hidden">
        {filteredDebriefs.length === 0 ? (
          /* Empty State with 3D Glass Illustration */
          <div className="p-12 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#E4F1FF] blur-xl opacity-70" />
              <div className="relative w-16 h-16 rounded-2xl bg-white/90 border border-[#CFE6FF] shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_8px_20px_rgba(26,115,217,0.12)] flex items-center justify-center text-[#1A73D9]">
                <Inbox className="w-8 h-8 stroke-[1.8]" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                No matching call debriefs
              </h3>
              <p className="text-xs text-[#5B6B7F] max-w-sm mx-auto mt-1">
                {searchQuery || stageFilter !== 'All' || dueFilter !== 'All'
                  ? 'Try clearing active filters or search keywords to view past debriefs.'
                  : 'Start by dictating your first post-call debrief or loading a sample note.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNewDebrief}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Debrief</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F3F9FF]/80 border-b border-[#E4F1FF] text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Deal Stage</th>
                  <th className="py-3 px-4">Agreed Next Step</th>
                  <th className="py-3 px-4">Call Date</th>
                  <th className="py-3 px-4">Task Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4F1FF]">
                {filteredDebriefs.map((debrief) => {
                  const isDone = debrief.status === 'Done';

                  return (
                    <tr
                      key={debrief.id}
                      onClick={() => onSelectDebrief(debrief)}
                      className="hover:bg-[#F3F9FF]/70 transition-all cursor-pointer group hover:shadow-2xs"
                    >
                      {/* Inline Status Toggle */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(debrief.id, debrief.status);
                        }}
                      >
                        <button
                          type="button"
                          className="focus:outline-none focus:ring-2 focus:ring-[#1A73D9] rounded p-1 cursor-pointer transition-transform active:scale-90"
                          title={isDone ? 'Mark as Open' : 'Mark as Done'}
                          aria-label={isDone ? 'Mark as Open' : 'Mark as Done'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#CFE6FF] group-hover:text-[#1A73D9]" />
                          )}
                        </button>
                      </td>

                      {/* Client / Company */}
                      <td className="py-3 px-4 font-medium text-[#0F172A]">
                        <div className="font-bold text-[#0F172A] group-hover:text-[#1A73D9] transition-colors">
                          {debrief.clientName || 'Untitled Client'}
                        </div>
                        <div className="text-[11px] text-[#5B6B7F] flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-[#1A73D9]" />
                          <span>{debrief.company || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Deal Stage */}
                      <td className="py-3 px-4 text-[#0F172A]">
                        <span className="font-semibold px-2.5 py-1 rounded-full bg-[#F3F9FF] border border-[#CFE6FF] text-[#1A73D9] text-[11px]">
                          {debrief.dealStage}
                        </span>
                      </td>

                      {/* Next Step Task */}
                      <td className="py-3 px-4 text-[#0F172A] max-w-xs truncate">
                        <div className="font-semibold truncate" title={debrief.nextStep?.title}>
                          {debrief.nextStep?.title || 'No next step defined'}
                        </div>
                        <div className="text-[11px] text-[#5B6B7F] truncate">
                          Owner: {debrief.nextStep?.owner || 'Unassigned'}
                        </div>
                      </td>

                      {/* Call Date */}
                      <td className="py-3 px-4 text-[#5B6B7F] font-mono tabular-nums whitespace-nowrap">
                        {debrief.callDate || debrief.createdAt.split('T')[0]}
                      </td>

                      {/* Next Step Due Date Badge */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                        {getDueBadge(debrief.nextStep?.dueDate, debrief.status)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectDebrief(debrief)}
                            className="p-1.5 text-[#5B6B7F] hover:text-[#1A73D9] hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Open & Edit Debrief"
                            aria-label="Open & Edit Debrief"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {deletingId === debrief.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl animate-fadeIn">
                              <span className="text-[11px] text-rose-700 font-bold">Delete?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteDebrief(debrief.id);
                                  setDeletingId(null);
                                }}
                                className="text-[11px] font-bold text-rose-700 hover:text-rose-950 underline cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="text-[11px] text-[#5B6B7F] hover:text-[#0F172A] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(debrief.id)}
                              className="p-1.5 text-[#5B6B7F] hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Delete Debrief"
                              aria-label="Delete Debrief"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
