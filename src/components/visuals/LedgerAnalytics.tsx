import React, { useMemo } from 'react';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { DebriefDocument } from '../../types';
import { GlassCard } from '../GlassCard';
import { ActivityAreaChart } from './ActivityAreaChart';
import { StatusDonut } from './StatusDonut';

interface LedgerAnalyticsProps {
  debriefs: DebriefDocument[];
}

export const LedgerAnalytics: React.FC<LedgerAnalyticsProps> = ({ debriefs }) => {
  const timelineData = useMemo(() => {
    const buckets: { key: string; label: string; value: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 13; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 86400000);
      const key = day.toISOString().split('T')[0];
      buckets.push({
        key,
        label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: 0,
      });
    }

    const index = new Map(buckets.map((b) => [b.key, b]));
    debriefs.forEach((d) => {
      const raw = d.callDate || d.createdAt?.split('T')[0];
      if (!raw) return;
      const bucket = index.get(raw);
      if (bucket) bucket.value += 1;
    });

    return buckets;
  }, [debriefs]);

  const statusData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let open = 0;
    let done = 0;
    let overdue = 0;

    debriefs.forEach((d) => {
      if (d.status === 'Done') {
        done += 1;
        return;
      }
      open += 1;
      const dueStr = d.nextStep?.dueDate;
      if (dueStr) {
        const due = new Date(dueStr);
        due.setHours(0, 0, 0, 0);
        if (Math.round((due.getTime() - today.getTime()) / 86400000) < 0) {
          overdue += 1;
        }
      }
    });

    return [
      { name: 'Open', value: Math.max(0, open - overdue), color: '#1A73D9' },
      { name: 'Overdue', value: overdue, color: '#EF4444' },
      { name: 'Completed', value: done, color: '#10B981' },
    ].filter((d) => d.value > 0);
  }, [debriefs]);

  const hasData = debriefs.length > 0;

  if (!hasData) {
    return (
      <GlassCard className="p-8 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] text-center h-full flex flex-col items-center justify-center">
        <TrendingUp className="w-6 h-6 text-[#AFD3FA] mb-2" />
        <p className="text-xs text-[#5B6B7F]">
          Log your first debrief to unlock activity trends and pipeline analytics.
        </p>
      </GlassCard>
    );
  }

  const logged = timelineData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Activity trend */}
      <GlassCard className="lg:col-span-2 p-4 sm:p-5 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#1A73D9]" />
            Debrief Activity · Last 14 Days
          </span>
          <span className="text-[11px] font-mono text-[#5B6B7F] tabular-nums">
            {logged} logged
          </span>
        </div>

        <ActivityAreaChart data={timelineData} />
      </GlassCard>

      {/* Status donut */}
      <GlassCard className="p-4 sm:p-5 bg-white/85 border border-white/95 shadow-[0_8px_24px_rgba(26,115,217,0.06)] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-[#1A73D9]" />
            Follow-up Status
          </span>
        </div>

        {statusData.length > 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <StatusDonut data={statusData} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#5B6B7F]">
            No follow-ups yet
          </div>
        )}
      </GlassCard>
    </div>
  );
};
