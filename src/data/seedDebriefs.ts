import { DebriefDocument } from '../types';

export function getSeedDebriefs(): DebriefDocument[] {
  const now = new Date();
  const formatOffset = (daysOffset: number) => {
    const d = new Date(now.getTime() + daysOffset * 86400000);
    return d.toISOString().split('T')[0];
  };

  const isoOffset = (daysOffset: number, hoursOffset = 0) => {
    const d = new Date(now.getTime() + daysOffset * 86400000 + hoursOffset * 3600000);
    return d.toISOString();
  };

  return [
    {
      id: 'seed-1-overdue',
      userId: 'guest',
      createdAt: isoOffset(-4),
      updatedAt: isoOffset(-4),
      status: 'Open',
      clientName: 'David Vance',
      company: 'Apex Logistics Corp',
      callDate: formatOffset(-4),
      dealStage: 'Negotiation',
      rawTranscript:
        'Discussed fleet management API contract. David pushed back on the annual billing clause and asked for quarterly terms. Agreed next step was sending redline agreement by yesterday.',
      emailSubject: 'Quarterly Terms & Redlined Contract — Apex Logistics',
      emailBody:
        'Hi David,\n\nFollowing our discussion regarding the fleet management API rollout, attached is the revised contract reflecting the quarterly payment schedule you requested. Please let me know once your legal counsel has had a chance to review.\n\nBest regards,',
      emailTone: 'Professional',
      crm: {
        clientName: 'David Vance',
        company: 'Apex Logistics Corp',
        dealStage: 'Negotiation',
        keyNeeds: ['Fleet telemetry API', 'Quarterly billing cadence'],
        objections: ['Annual upfront commitment required board approval'],
        budgetSignals: ['$120k ARR contract size'],
        timelineSignals: ['Targeting Q1 dispatch rollout'],
        decisionMakers: ['David Vance (VP Operations)', 'Legal Counsel'],
        risks: ['Delayed signature risks slipping into next fiscal quarter'],
        agreedNextStep: 'Send revised redline agreement with quarterly milestones.',
      },
      internalNote: [
        'David wants quarterly terms to avoid capital expenditure committee delay.',
        'Payment terms modified from net-30 annual to net-30 quarterly.',
        'Overdue action item: legal redlines need to go out immediately today.',
        'High deal value ($120k ARR); close probability estimated at 85%.',
        'Check with engineering on webhook rate limits for their 400 trucks.',
      ],
      nextStep: {
        title: 'Send Redlined Agreement with Quarterly Terms',
        owner: 'Lead Negotiator',
        dueDate: formatOffset(-2), // OVERDUE
        priority: 'High',
        rationale: 'Client waiting on revised commercial terms to take to CFO.',
      },
    },
    {
      id: 'seed-2-duetoday',
      userId: 'guest',
      createdAt: isoOffset(-1),
      updatedAt: isoOffset(-1),
      status: 'Open',
      clientName: 'Elena Rostova',
      company: 'Aether Robotics',
      callDate: formatOffset(-1),
      dealStage: 'Discovery',
      rawTranscript:
        'Elena outlined their warehouse automation pilot. They need vision sensor telemetry ingestion in under 50ms. Follow-up action: send sensor compatibility matrix today.',
      emailSubject: 'Sensor Compatibility Matrix & Discovery Notes — Aether Robotics',
      emailBody:
        'Hi Elena,\n\nThank you for walking us through Aether Robotics’ warehouse automation roadmap yesterday. I am compiling our sensor compatibility matrix along with sample ingestion benchmarks to confirm sub-50ms processing for your lidar stack. I will share that document by end of day today.\n\nBest regards,',
      emailTone: 'Warm',
      crm: {
        clientName: 'Elena Rostova',
        company: 'Aether Robotics',
        dealStage: 'Discovery',
        keyNeeds: ['Low-latency sensor telemetry', 'Lidar edge-ingestion support'],
        objections: ['Previous vendor had 200ms latency spikes'],
        budgetSignals: ['Funded by Series A robotics infrastructure pool'],
        timelineSignals: ['Warehouse test track opens in 6 weeks'],
        decisionMakers: ['Elena Rostova (Chief Architect)'],
        risks: ['Strict hardware compatibility requirements'],
        agreedNextStep: 'Send sensor compatibility matrix and latency guarantees.',
      },
      internalNote: [
        'Strong technical alignment; Elena is very sharp on sensor clock sync.',
        'Must emphasize sub-50ms ingestion architecture.',
        'Action due today: compile sensor matrix with our field engineering notes.',
        'Discovery call went exceptionally well.',
        'Schedule follow-up demo for next Tuesday if matrix is approved.',
      ],
      nextStep: {
        title: 'Deliver Sensor Compatibility Matrix',
        owner: 'Solutions Architect',
        dueDate: formatOffset(0), // DUE TODAY
        priority: 'High',
        rationale: 'Required before Elena can greenlight trial integration.',
      },
    },
    {
      id: 'seed-3-done',
      userId: 'guest',
      createdAt: isoOffset(-6),
      updatedAt: isoOffset(-2),
      status: 'Done', // COMPLETED
      clientName: 'Tariq Al-Mansoor',
      company: 'Kite FinTech',
      callDate: formatOffset(-6),
      dealStage: 'Closed Won',
      rawTranscript:
        'Final check-in call. Contract signed by their general counsel. Kicked off Slack Connect channel and scheduled kickoff workshop for next Monday.',
      emailSubject: 'Welcome to EchoCRM — Kickoff Workshop Confirmation',
      emailBody:
        'Hi Tariq,\n\nCongratulations on finalizing our partnership! We are thrilled to welcome Kite FinTech aboard. The Slack Connect channel has been created, and our calendar invitation for Monday’s kickoff workshop is on its way.\n\nBest regards,',
      emailTone: 'Warm',
      crm: {
        clientName: 'Tariq Al-Mansoor',
        company: 'Kite FinTech',
        dealStage: 'Closed Won',
        keyNeeds: ['Transaction categorization pipeline', 'Dedicated CSM'],
        objections: ['None remaining; security checklist cleared'],
        budgetSignals: ['Signed 2-year enterprise agreement'],
        timelineSignals: ['Go-live slated for December 1st'],
        decisionMakers: ['Tariq Al-Mansoor (VP Engineering)'],
        risks: ['Zero risks identified; security clearance completed'],
        agreedNextStep: 'Conduct onboarding kickoff workshop.',
      },
      internalNote: [
        'Contract executed and countersigned.',
        'Onboarding handoff to customer success team completed.',
        'Slack Connect channel established.',
        'First invoice dispatched by finance.',
        'Status marked Done.',
      ],
      nextStep: {
        title: 'Run Onboarding Kickoff Workshop',
        owner: 'CSM Lead',
        dueDate: formatOffset(3),
        priority: 'Medium',
        rationale: 'Ensure seamless transition to production workspace.',
      },
    },
    {
      id: 'seed-4-proposal',
      userId: 'guest',
      createdAt: isoOffset(-2),
      updatedAt: isoOffset(-2),
      status: 'Open',
      clientName: 'Rachel Kim',
      company: 'Hyperion Design Studio',
      callDate: formatOffset(-2),
      dealStage: 'Proposal',
      rawTranscript:
        'Rachel requested a customized proposal for 25 seat licenses with single sign-on and Figma plugin integration. She expects proposal by this Thursday.',
      emailSubject: 'Proposal Preview: 25 Seats + SSO — Hyperion Design Studio',
      emailBody:
        'Hi Rachel,\n\nGreat speaking with you about Hyperion’s growing studio operations. As requested, we are putting together a custom proposal covering 25 full seats, Okta SSO provisioning, and our Figma workflow integration. I look forward to sending the complete deck your way this Thursday morning.\n\nBest regards,',
      emailTone: 'Professional',
      crm: {
        clientName: 'Rachel Kim',
        company: 'Hyperion Design Studio',
        dealStage: 'Proposal',
        keyNeeds: ['25 team seats', 'Okta SSO', 'Figma integration'],
        objections: ['Wants guarantees on designer onboarding support'],
        budgetSignals: ['$35k annual software budget'],
        timelineSignals: ['Rollout planned for start of Q1'],
        decisionMakers: ['Rachel Kim (Creative Director)', 'Finance Lead'],
        risks: ['Competitor tool already tested by freelance contractors'],
        agreedNextStep: 'Deliver scoped commercial proposal with SSO tier included.',
      },
      internalNote: [
        'Rachel loves the UI aesthetics and clean interface philosophy.',
        'Include complimentary onboarding training session in proposal to beat competitor.',
        'SSO is a mandatory hard requirement for their IT group.',
        'Proposal deck due Thursday.',
        'Follow-up call penciled for next Monday.',
      ],
      nextStep: {
        title: 'Submit Tailored 25-Seat Proposal Deck',
        owner: 'Account Executive',
        dueDate: formatOffset(2), // THIS WEEK
        priority: 'High',
        rationale: 'Deadline requested by Rachel for internal partner review.',
      },
    },
    {
      id: 'seed-5-lead',
      userId: 'guest',
      createdAt: isoOffset(-5),
      updatedAt: isoOffset(-5),
      status: 'Open',
      clientName: 'Carlos Mendez',
      company: 'Terra Agritech',
      callDate: formatOffset(-5),
      dealStage: 'Lead',
      rawTranscript:
        'Initial intro call via inbound demo request. Carlos manages drone irrigation telemetry. Exploring whether automated post-inspection summaries can sync to their farm management system.',
      emailSubject: 'Introductory Notes & Irrigation Telemetry Integration — Terra Agritech',
      emailBody:
        'Hi Carlos,\n\nIt was a pleasure connecting today and learning more about Terra Agritech’s autonomous drone operations. I am organizing a brief overview of how our API pushes automated summaries directly into custom GIS and farm management platforms. Let’s reconvene next week for a live test with your sample telemetry.\n\nBest regards,',
      emailTone: 'Direct',
      crm: {
        clientName: 'Carlos Mendez',
        company: 'Terra Agritech',
        dealStage: 'Lead',
        keyNeeds: ['GIS telemetry ingestion', 'Automated field inspection briefs'],
        objections: ['Unsure if field workers will adopt mobile voice interface'],
        budgetSignals: ['Early pilot budget available ($15k)'],
        timelineSignals: ['Harvest season starts in 3 months'],
        decisionMakers: ['Carlos Mendez (Operations Manager)'],
        risks: ['Rural connectivity constraints in field locations'],
        agreedNextStep: 'Prepare architecture one-pager on offline voice syncing.',
      },
      internalNote: [
        'Interesting agritech use case; offline voice dictation capability is huge for them.',
        'Carlos is sole decision-maker for the $15k pilot trial.',
        'Need to demonstrate how offline audio cache works without cell signal.',
        'Send one-pager by next Monday.',
        'Good early stage candidate for case study if pilot closes.',
      ],
      nextStep: {
        title: 'Share Offline Voice Sync Architecture One-Pager',
        owner: 'Technical Lead',
        dueDate: formatOffset(5), // LATER
        priority: 'Medium',
        rationale: 'Proves mobile reliability for Carlos’s field teams.',
      },
    },
  ];
}
