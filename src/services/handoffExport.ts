/**
 * Team Handoff & CRM Export Formatter.
 * Formats structured debrief data into Slack markup or Markdown tables/checklists.
 * 100% Zero-configuration — formats and copies directly to clipboard.
 */

export interface HandoffExportData {
  clientName: string;
  company: string;
  dealStage: string;
  callDate: string;
  emailSubject: string;
  nextStepTitle?: string;
  nextStepOwner?: string;
  nextStepDueDate?: string;
  nextStepPriority?: string;
  nextStepRationale?: string;
  keyNeeds?: string[];
  objections?: string[];
  budgetSignals?: string[];
  timelineSignals?: string[];
  decisionMakers?: string[];
  risks?: string[];
  internalNotes?: string[];
}

/**
 * Formats debrief data into Slack mrkdwn syntax ready for posting into sales/delivery channels.
 */
export function formatSlackHandoff(data: HandoffExportData): string {
  const lines: string[] = [];

  lines.push(`:speech_balloon: *EchoCRM Post-Call Debrief*`);
  lines.push(`*Client:* ${data.clientName || 'N/A'} — *Company:* ${data.company || 'N/A'}`);
  lines.push(`*Stage:* \`${data.dealStage || 'Discovery'}\` | *Call Date:* ${data.callDate || new Date().toISOString().split('T')[0]}`);
  lines.push('');

  if (data.nextStepTitle) {
    lines.push(`:dart: *Agreed Next Action:*`);
    lines.push(`• *Task:* ${data.nextStepTitle}`);
    lines.push(`• *Owner:* ${data.nextStepOwner || 'Unassigned'} | *Due:* ${data.nextStepDueDate || 'TBD'} | *Priority:* ${data.nextStepPriority || 'Medium'}`);
    if (data.nextStepRationale) {
      lines.push(`• *Context:* _${data.nextStepRationale}_`);
    }
    lines.push('');
  }

  if (data.internalNotes && data.internalNotes.length > 0) {
    lines.push(`:memo: *Internal Team Handoff Notes:*`);
    data.internalNotes.forEach((note) => {
      lines.push(`• ${note}`);
    });
    lines.push('');
  }

  if (data.keyNeeds && data.keyNeeds.length > 0) {
    lines.push(`:bulb: *Key Pain Points & Requirements:*`);
    data.keyNeeds.forEach((need) => lines.push(`• ${need}`));
    lines.push('');
  }

  if ((data.budgetSignals && data.budgetSignals.length > 0) || (data.timelineSignals && data.timelineSignals.length > 0)) {
    lines.push(`:bar_chart: *Commercial & Timeline Signals:*`);
    data.budgetSignals?.forEach((b) => lines.push(`• *Budget:* ${b}`));
    data.timelineSignals?.forEach((t) => lines.push(`• *Timeline:* ${t}`));
    lines.push('');
  }

  if (data.risks && data.risks.length > 0) {
    lines.push(`:warning: *Risks & Competitors:*`);
    data.risks.forEach((r) => lines.push(`• ${r}`));
    lines.push('');
  }

  lines.push(`_Generated automatically by EchoCRM voice debrief assistant._`);

  return lines.join('\n');
}

/**
 * Formats debrief data into GitHub / Notion / Linear markdown with checklists and clean sections.
 */
export function formatMarkdownHandoff(data: HandoffExportData): string {
  const lines: string[] = [];

  lines.push(`# Client Debrief: ${data.clientName || 'Client'} (${data.company || 'Company'})`);
  lines.push(`**Date:** ${data.callDate || new Date().toISOString().split('T')[0]} | **Deal Stage:** ${data.dealStage || 'Discovery'}`);
  lines.push('');

  if (data.nextStepTitle) {
    lines.push(`## 🎯 Action Item`);
    lines.push(`- [ ] **${data.nextStepTitle}**`);
    lines.push(`  - **Assignee:** ${data.nextStepOwner || 'Unassigned'}`);
    lines.push(`  - **Due Date:** ${data.nextStepDueDate || 'TBD'}`);
    lines.push(`  - **Priority:** ${data.nextStepPriority || 'Medium'}`);
    if (data.nextStepRationale) {
      lines.push(`  - **Rationale:** ${data.nextStepRationale}`);
    }
    lines.push('');
  }

  if (data.internalNotes && data.internalNotes.length > 0) {
    lines.push(`## 📋 Internal Team Handoff Notes`);
    data.internalNotes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }

  lines.push(`## 💼 CRM Signals`);
  lines.push(`| Dimension | Signals Captured |`);
  lines.push(`|---|---|`);
  lines.push(`| **Pain Points** | ${(data.keyNeeds || []).join('; ') || 'None stated'} |`);
  lines.push(`| **Objections** | ${(data.objections || []).join('; ') || 'None stated'} |`);
  lines.push(`| **Budget Signals** | ${(data.budgetSignals || []).join('; ') || 'None stated'} |`);
  lines.push(`| **Timeline Signals** | ${(data.timelineSignals || []).join('; ') || 'None stated'} |`);
  lines.push(`| **Decision Makers** | ${(data.decisionMakers || []).join('; ') || 'None stated'} |`);
  lines.push(`| **Risks / Blockers** | ${(data.risks || []).join('; ') || 'None stated'} |`);
  lines.push('');

  lines.push(`---`);
  lines.push(`*Exported from [EchoCRM](https://github.com) — Voice-First Client Follow-Up Assistant*`);

  return lines.join('\n');
}
