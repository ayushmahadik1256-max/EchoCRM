import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Full debrief response schema
const fullDebriefSchema = {
  type: Type.OBJECT,
  properties: {
    emailSubject: {
      type: Type.STRING,
      description: 'Concise, specific subject line for the follow-up email without placeholders.',
    },
    emailBody: {
      type: Type.STRING,
      description:
        'Client-ready, polished follow-up email. Only commits to actions explicitly stated in the call notes. Zero generic filler or bracket placeholders.',
    },
    crm: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: 'Client full name or "Needs confirmation"',
        },
        company: {
          type: Type.STRING,
          description: 'Client company name or "Needs confirmation"',
        },
        dealStage: {
          type: Type.STRING,
          description:
            'One of: Lead, Discovery, Proposal, Negotiation, Closed Won, Closed Lost. Match closest stage.',
        },
        keyNeeds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Concrete pain points and requirements stated by the client.',
        },
        objections: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Hesitations, questions, or pushbacks raised by the client.',
        },
        budgetSignals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Explicit or inferred monetary clues, budget caps, or approval thresholds.',
        },
        timelineSignals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Target dates, deadlines, milestones, or quarters mentioned.',
        },
        decisionMakers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Names and roles of decision makers, influencers, or sign-offs.',
        },
        risks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Blockers, competitor presence, technical hurdles, or timeline risks.',
        },
        agreedNextStep: {
          type: Type.STRING,
          description:
            'Single concrete next deliverable or action committed to on the call, or "Needs confirmation".',
        },
      },
      required: [
        'clientName',
        'company',
        'dealStage',
        'keyNeeds',
        'objections',
        'budgetSignals',
        'timelineSignals',
        'decisionMakers',
        'risks',
        'agreedNextStep',
      ],
    },
    internalNote: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 8 bullet items summarizing key context for the internal team.',
    },
    nextStep: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Clear task title for the agreed next step.',
        },
        owner: {
          type: Type.STRING,
          description: 'Owner name or role (e.g., Account Lead, Solutions Architect).',
        },
        dueDate: {
          type: Type.STRING,
          description: 'Resolved due date in ISO YYYY-MM-DD format based on today\'s date.',
        },
        priority: {
          type: Type.STRING,
          enum: ['Low', 'Medium', 'High'],
          description: 'Urgency priority.',
        },
        rationale: {
          type: Type.STRING,
          description: 'Why this action is critical now.',
        },
      },
      required: ['title', 'owner', 'dueDate', 'priority', 'rationale'],
    },
  },
  required: ['emailSubject', 'emailBody', 'crm', 'internalNote', 'nextStep'],
};

// Email tone regeneration schema
const emailToneSchema = {
  type: Type.OBJECT,
  properties: {
    emailSubject: {
      type: Type.STRING,
      description: 'Subject line matching the requested tone.',
    },
    emailBody: {
      type: Type.STRING,
      description:
        'Rewritten follow-up email strictly reflecting the requested tone (Warm, Professional, or Direct).',
    },
  },
  required: ['emailSubject', 'emailBody'],
};

const singleCrmSchema = {
  type: Type.OBJECT,
  properties: {
    crm: fullDebriefSchema.properties.crm,
  },
  required: ['crm'],
};

const singleInternalNoteSchema = {
  type: Type.OBJECT,
  properties: {
    internalNote: fullDebriefSchema.properties.internalNote,
  },
  required: ['internalNote'],
};

const singleNextStepSchema = {
  type: Type.OBJECT,
  properties: {
    nextStep: fullDebriefSchema.properties.nextStep,
  },
  required: ['nextStep'],
};


const SYSTEM_INSTRUCTION = `You are EchoCRM, an elite voice-first client debrief AI for consultants, agency account managers, and B2B salespeople.
Your task is to take messy post-call voice notes (often containing self-corrections, filler words, speech recognition artifacts) and generate 4 high-value artifacts:
1. A client-ready follow-up email
2. Structured CRM fields
3. An internal handoff note (5 to 8 concise bullets)
4. A suggested next-step task with a concrete due date resolved against today's date

Strict Rules:
- Fact preservation: Clean up dictation artifacts (filler words, false starts, "wait no, sorry"), but preserve every real fact, metric, number, date, and person mentioned.
- Zero hallucination: Never invent commitments, prices, timelines, or promises the client did not make.
- Missing values: Any single-string field that cannot be determined from notes or metadata must be exactly "Needs confirmation" (or an empty array [] where a list is expected).
- Email rules: Concise, specific to this call, one clear call to action, no generic filler, and absolutely NO placeholders in brackets (e.g. do not write "[Your Name]" or "[Link]").
- The email may ONLY commit the sender to actions explicitly stated in the notes.
- Date resolution: Resolve relative dates ("this Friday", "next Tuesday", "in two weeks") accurately against the provided today's date. Due dates must be in ISO YYYY-MM-DD.
- Tone default is Professional, unless specified otherwise (Warm, Professional, Direct).`;

function appendSignatureToText(body: string, sig?: string): string {
  if (!sig || !sig.trim()) return body;
  const trimmedBody = body.trim();
  const trimmedSig = sig.trim();
  if (trimmedBody.endsWith(trimmedSig)) return trimmedBody;
  const closingRegex = /(?:^|\n\n|\n)(?:Best regards,?|Warm regards,?|Regards,?|Best,?|Sincerely,?|Thanks,?|Thank you,?)\s*$/i;
  if (
    closingRegex.test(trimmedBody) &&
    /^(?:Best regards|Warm regards|Regards|Best|Sincerely|Thanks|Thank you)/i.test(trimmedSig)
  ) {
    const withoutClosing = trimmedBody.replace(closingRegex, '').trim();
    return `${withoutClosing}\n\n${trimmedSig}`;
  }
  return `${trimmedBody}\n\n${trimmedSig}`;
}

export const generateHandler = async (req: Request, res: Response) => {
  try {
    const {
      mode = 'full',
      transcript,
      metadata = {},
      tone = 'Professional',
      previousEmail,
      revisionPrompt,
      section,
      todayDate,
      timeZone,
      signature,
    } = req.body;


    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 15) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Please provide at least 20 characters of call notes or dictation to generate follow-up.',
      });
    }


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not configured.');
      return res.status(500).json({
        error: 'CONFIG_ERROR',
        message: 'Server Gemini API key is missing. Please ensure GEMINI_API_KEY is configured.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const nowIso = todayDate || new Date().toISOString().split('T')[0];
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    if (mode === 'email_tone') {
      // Regenerate only the email with the requested tone
      const prompt = `Current date: ${nowIso}
User timezone: ${tz}
Requested email tone: ${tone}

Context Metadata:
Client: ${metadata.clientName || 'Unspecified'}
Company: ${metadata.company || 'Unspecified'}
Deal Stage: ${metadata.dealStage || 'Unspecified'}

Original call transcript:
"""${transcript}"""

Previous draft:
Subject: ${previousEmail?.subject || ''}
Body: ${previousEmail?.body || ''}

Task:
Rewrite the client follow-up email strictly matching the "${tone}" tone:
- Warm: Welcoming, appreciative, relationship-building, yet clear and professional.
- Professional: Balanced, crisp, executive, polished, standard B2B etiquette.
- Direct: Ultra-concise, action-oriented, zero fluff, bullet-point friendly, fast to read.

Ensure no bracket placeholders, no generic filler, and only commit to actions verified in the transcript.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: emailToneSchema,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      if (!parsed.emailSubject || !parsed.emailBody) {
        throw new Error('Incomplete tone rewrite received from model');
      }

      const finalEmailBody = appendSignatureToText(parsed.emailBody, signature);

      return res.json({
        data: {
          emailSubject: parsed.emailSubject,
          emailBody: finalEmailBody,
        },
      });
    }


    // Full debrief mode
    const prompt = `Current date: ${nowIso}
User timezone: ${tz}
Preferred initial email tone: ${tone}

Optional client metadata provided:
Client Name: ${metadata.clientName || 'Not specified'}
Company: ${metadata.company || 'Not specified'}
Call Date: ${metadata.callDate || nowIso}
Deal Stage: ${metadata.dealStage || 'Not specified'}

Raw Dictated Call Notes:
"""${transcript}"""

Generate the structured JSON debrief containing:
1. emailSubject & emailBody (client-ready, professional, no brackets)
2. crm object (clientName, company, dealStage, keyNeeds, objections, budgetSignals, timelineSignals, decisionMakers, risks, agreedNextStep)
3. internalNote (5 to 8 bullet items)
4. nextStep object (title, owner, dueDate in YYYY-MM-DD, priority, rationale)
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: fullDebriefSchema,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    // Validate server-side
    if (!parsed.emailSubject || !parsed.emailBody || !parsed.crm || !parsed.internalNote || !parsed.nextStep) {
      throw new Error('Model response did not meet required debrief schema');
    }

    // Ensure list fields are arrays
    const crm = parsed.crm;
    crm.keyNeeds = Array.isArray(crm.keyNeeds) ? crm.keyNeeds : [];
    crm.objections = Array.isArray(crm.objections) ? crm.objections : [];
    crm.budgetSignals = Array.isArray(crm.budgetSignals) ? crm.budgetSignals : [];
    crm.timelineSignals = Array.isArray(crm.timelineSignals) ? crm.timelineSignals : [];
    crm.decisionMakers = Array.isArray(crm.decisionMakers) ? crm.decisionMakers : [];
    crm.risks = Array.isArray(crm.risks) ? crm.risks : [];

    // Prioritize explicitly passed metadata if notes had "Needs confirmation"
    if (metadata.clientName && (!crm.clientName || crm.clientName === 'Needs confirmation')) {
      crm.clientName = metadata.clientName;
    }
    if (metadata.company && (!crm.company || crm.company === 'Needs confirmation')) {
      crm.company = metadata.company;
    }
    if (metadata.dealStage && (!crm.dealStage || crm.dealStage === 'Needs confirmation')) {
      crm.dealStage = metadata.dealStage;
    }

    const finalEmailBody = appendSignatureToText(parsed.emailBody, signature);

    return res.json({
      data: {
        ...parsed,
        emailBody: finalEmailBody,
        emailTone: tone,
      },
    });

  } catch (error: any) {
    console.error('Error generating debrief:', error);
    return res.status(500).json({
      error: 'GENERATION_FAILED',
      message:
        error?.message ||
        'Failed to generate debrief from voice notes. Please review your notes or try again.',
    });
  }
};

// ---------------------------------------------------------------------------
// Audio transcription (upload a recorded call, get clean notes back)
// ---------------------------------------------------------------------------

const TRANSCRIBE_SYSTEM_INSTRUCTION = `You are EchoCRM's call transcription engine.
You receive an audio recording of a sales or client call. Produce a faithful, readable transcript.

Strict rules:
- Transcribe what was actually said. Do not summarize, shorten, or invent.
- Keep speaker turns readable: prefix each change of speaker with "Speaker 1:", "Speaker 2:" (use names only when clearly stated).
- Preserve every number, metric, date, price, company name, and person mentioned.
- Drop pure filler ("um", "uh") and false starts, but keep self-corrections such as "Tuesday, sorry, Wednesday".
- If a section is unintelligible, write "[inaudible]" instead of guessing.
- Output plain text only: no markdown fences, no commentary, no headings.`;

const AUDIO_MIME_ALLOWLIST = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'video/webm',
  'video/mp4',
]);

// Gemini caps the whole inline request (base64 payload + prompt) at 20 MB.
// Base64 inflates raw bytes by ~33%, so 14 MB of audio stays safely under it.
const MAX_AUDIO_BYTES = 14 * 1024 * 1024;

export const transcribeHandler = async (req: Request, res: Response) => {
  try {
    const mimeType = String(req.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const fileNameHeader = req.headers['x-file-name'];
    const fileName = fileNameHeader
      ? decodeURIComponent(String(fileNameHeader))
      : 'call-recording';

    const audio = req.body as Buffer;

    if (!Buffer.isBuffer(audio) || audio.length === 0) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'No audio data received. Please choose an audio file and try again.',
      });
    }

    if (!AUDIO_MIME_ALLOWLIST.has(mimeType)) {
      return res.status(415).json({
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: `Unsupported audio format "${mimeType || 'unknown'}". Use MP3, M4A, WAV, WebM, OGG, FLAC, or MP4.`,
      });
    }

    if (audio.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message:
          'Recording is larger than 14MB. Please upload a shorter clip or compress the audio.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not configured.');
      return res.status(500).json({
        error: 'CONFIG_ERROR',
        message: 'Server Gemini API key is missing. Please ensure GEMINI_API_KEY is configured.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: audio.toString('base64') } },
            {
              text: 'Transcribe this client call recording following the rules exactly.',
            },
          ],
        },
      ],
      config: {
        systemInstruction: TRANSCRIBE_SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    const transcript = (response.text || '').trim();
    if (!transcript) {
      throw new Error('The recording could not be transcribed. It may be silent or corrupted.');
    }

    return res.json({
      data: {
        transcript,
        fileName,
        mimeType,
        bytes: audio.length,
        wordCount: transcript.split(/\s+/).filter(Boolean).length,
      },
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({
      error: 'TRANSCRIPTION_FAILED',
      message:
        error?.message ||
        'Failed to transcribe this recording. Please check the file and try again.',
    });
  }
};

export const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'EchoCRM',
    model: MODEL_NAME,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    features: ['debrief', 'email_tone', 'audio_transcription'],
  });
};

// ─── Route wiring ─────────────────────────────────────────────────────────────

export const jsonBodyParser = express.json({ limit: '2mb' });
export const rawAudioBodyParser = express.raw({ type: () => true, limit: '24mb' });

export function registerRoutes(app: Express) {
  app.use(jsonBodyParser);
  app.post('/api/generate', generateHandler);
  app.post('/api/transcribe', rawAudioBodyParser, transcribeHandler);
  app.get('/api/health', healthHandler);
}
