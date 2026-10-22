import { DebriefResult } from '../types';

export const SAMPLE_DICTATED_NOTE = `Uh, okay, just hopped off the debrief with Sarah Jenkins from Meridian Health Tech... wait, sorry, Meridian BioTech, let me make sure that's right. Sarah was on the line with Marcus Lin, their VP of Product Strategy. So basically, they loved the initial UX walkthrough we did on the analytics dashboard last Tuesday, but Sarah brought up a serious hesitation: she said their engineering leads are worried the data ingestion pipeline might choke on 50,000 concurrent patient records, especially with HIPAA compliance encryption overhead. That's their main pushback right now. 

On the budget side, Marcus hinted they have about eighty-five to ninety-five K earmarked from their remaining Q4 modernization budget, but anything above that needs CFO sign-off from Elena. 

For the timeline, they really need a working beta live in staging by November 14th before their board audit kicks off. 

Agreed next step: I told them I would send a technical response with our Redis caching benchmarks and a refined phased rollout scope by this Friday afternoon, October 24th. Once they see the latency numbers, Marcus will schedule a 30-minute tech review with their security team.`;

export const SAMPLE_METADATA = {
  clientName: 'Sarah Jenkins',
  company: 'Meridian BioTech',
  dealStage: 'Proposal' as const,
  callDate: new Date().toISOString().split('T')[0],
};

export const PREGENERATED_SAMPLE_RESULT: DebriefResult = {
  emailSubject: 'Follow-Up & Technical Latency Benchmarks — Meridian BioTech / EchoCRM',
  emailBody: `Hi Sarah,\n\nThank you for the productive call today with Marcus. It was great to hear your team's positive feedback on the analytics dashboard walkthrough.\n\nTo address your question regarding data ingestion volume under HIPAA compliance, I am putting together benchmark documentation demonstrating our sub-120ms latency at 50,000+ concurrent records, alongside a phased rollout plan that keeps us comfortably ahead of your November 14 staging deadline.\n\nAs agreed, I will share the technical benchmarks and updated scope by this Friday, October 24, at 4:00 PM. Once you and Marcus have had a chance to review, we look forward to connecting with your security architect.\n\nBest regards,`,
  emailTone: 'Professional',
  crm: {
    clientName: 'Sarah Jenkins',
    company: 'Meridian BioTech',
    dealStage: 'Proposal',
    keyNeeds: [
      'High-throughput analytics dashboard',
      'HIPAA-compliant encrypted data ingestion pipeline',
      'Sub-120ms latency handling 50k concurrent patient records',
    ],
    objections: [
      'Concern that ingestion pipeline might choke under enterprise volume with encryption overhead',
    ],
    budgetSignals: [
      '$85k - $95k earmarked in Q4 modernization budget; higher spend requires CFO sign-off',
    ],
    timelineSignals: [
      'Working beta in staging by November 14th before board audit',
    ],
    decisionMakers: [
      'Sarah Jenkins (Primary Stakeholder)',
      'Marcus Lin (VP of Product Strategy)',
      'Elena (CFO - required for budgets exceeding $95k)',
    ],
    risks: [
      'Security architect approval pending',
      'Tight window before board audit deadline',
    ],
    agreedNextStep:
      'Deliver Redis caching benchmarks and phased rollout scope by Friday, October 24th.',
  },
  internalNote: [
    'Sarah and Marcus are enthusiastic about the UI, but technical credibility on latency is the dealmaker.',
    'Ingestion bottleneck objection must be handled decisively with concrete Redis benchmark data.',
    'Keep initial contract strictly under $95K to bypass CFO Elena approval cycle for faster closing.',
    'Critical path deadline: staging deployment must be solid before November 14th board audit.',
    'Next action: draft latency benchmark memo and send Friday by 4 PM.',
  ],
  nextStep: {
    title: 'Send Redis Latency Benchmarks & Phased Scope',
    owner: 'Account Lead',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    priority: 'High',
    rationale:
      'Directly resolves client objection regarding ingestion scalability prior to security architect review.',
  },
};
