export type DealStage =
  | 'Lead'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export type EmailTone = 'Warm' | 'Professional' | 'Direct';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type DebriefStatus = 'Open' | 'Done';

export interface CRMRecord {
  clientName: string;
  company: string;
  dealStage: DealStage | string;
  keyNeeds: string[];
  objections: string[];
  budgetSignals: string[];
  timelineSignals: string[];
  decisionMakers: string[];
  risks: string[];
  agreedNextStep: string;
}

export interface NextStepTask {
  title: string;
  owner: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  rationale: string;
}

export interface DebriefResult {
  emailSubject: string;
  emailBody: string;
  emailTone?: EmailTone;
  crm: CRMRecord;
  internalNote: string[];
  nextStep: NextStepTask;
}

export interface DebriefDocument extends DebriefResult {
  id: string;
  userId: string; // 'guest' or Firebase Auth UID
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: DebriefStatus;
  clientName: string;
  company: string;
  callDate: string;
  dealStage: DealStage;
  rawTranscript: string;
  isFallbackDemo?: boolean;
}

export interface GenerateRequestPayload {
  mode?: 'full' | 'email_tone';
  transcript: string;
  metadata?: {
    clientName?: string;
    company?: string;
    callDate?: string;
    dealStage?: string;
  };
  tone?: EmailTone;
  previousEmail?: {
    subject: string;
    body: string;
  };
  todayDate?: string;
  timeZone?: string;
  signature?: string;
}


export interface GenerateToneResponse {
  emailSubject: string;
  emailBody: string;
}

export interface GenerateSuccessResponse {
  data: DebriefResult;
  usedFallback?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export interface UserProfile {
  userId: string;
  emailSignature: string;
  appendSignature?: boolean;
  senderName?: string;
  senderTitle?: string;
  company?: string;
  phone?: string;
  website?: string;
  linkedInUrl?: string;
  defaultTone?: EmailTone;
  defaultDealStage?: DealStage;
  defaultDueDateOffset?: number; // 1, 2, 3, or 5 business days
  defaultTaskPriority?: TaskPriority;
  updatedAt?: string;
}


