import { CallTemplate } from '../types';

// Re-export CallTemplate so existing imports from this file still work
export type { CallTemplate };

/** Built-in system call templates — read-only, not stored in Firestore */
export const CALL_TEMPLATES: CallTemplate[] = [
  {
    id: 'discovery',
    userId: 'system',
    name: 'Discovery Call',
    description: 'Initial qualification, client pain points, current stack, and budget signals',
    dealStage: 'Discovery',
    preferredTone: 'Professional',
    suggestedPrompts: [
      'What is their primary business pain point or goal?',
      'What tools, vendors, or internal processes do they use today?',
      'Who else is involved in the decision, and what is the rough budget or timeline?',
      'What is the agreed first milestone or follow-up date?',
    ],
    placeholderHint:
      'e.g. Just spoke with Alex at Acme Corp. They are struggling with manual lead triage... budget looks around $30k... next step is sending technical architecture deck by Friday.',
    isCustom: false,
  },
  {
    id: 'proposal-followup',
    userId: 'system',
    name: 'Proposal Follow-Up',
    description: 'Scope review, commercial objections, timeline feasibility, and decision hurdles',
    dealStage: 'Proposal',
    preferredTone: 'Warm',
    suggestedPrompts: [
      'Did they review the scope, deliverables, and commercial pricing?',
      'What questions, pushback, or objections were raised by stakeholders?',
      'Any timeline constraints, procurement steps, or legal reviews required?',
      'When is the scheduled follow-up decision or contract review?',
    ],
    placeholderHint:
      'e.g. Followed up on our Q3 proposal with Elena. Overall positive on the tier-2 scope, but procurement wants a 10% payment milestone split... promised to adjust and resend by tomorrow afternoon.',
    isCustom: false,
  },
  {
    id: 'status-checkin',
    userId: 'system',
    name: 'Project Status Check-In',
    description: 'Milestone progress, active blockers, scope adjustments, and deliverable commitments',
    dealStage: 'Closed Won',
    preferredTone: 'Direct',
    suggestedPrompts: [
      'What key milestones or deliverables were approved during this call?',
      'Are there active blockers, dependencies, or scope creeps to flag?',
      'What action items are assigned to whom, and by what exact date?',
    ],
    placeholderHint:
      'e.g. Weekly sync with Jordan. Phase 1 mockups approved without revisions. Waiting on their API key to proceed with staging ingestion... Jordan will send keys by 4 PM today.',
    isCustom: false,
  },
];
