import {
  DebriefResult,
  EmailTone,
  GenerateRequestPayload,
} from '../types';
import { PREGENERATED_SAMPLE_RESULT, SAMPLE_DICTATED_NOTE } from '../data/sampleNotes';

export interface GenerateResultResponse {
  data: DebriefResult;
  usedFallback?: boolean;
}

export async function generateDebriefFromApi(
  payload: GenerateRequestPayload,
): Promise<GenerateResultResponse> {
  const isSampleTranscript =
    payload.transcript.trim() === SAMPLE_DICTATED_NOTE.trim() ||
    payload.transcript.includes('Meridian Health Tech') ||
    payload.transcript.includes('Meridian BioTech');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'full',
        transcript: payload.transcript,
        metadata: payload.metadata,
        tone: payload.tone || 'Professional',
        todayDate: payload.todayDate || new Date().toISOString().split('T')[0],
        timeZone: payload.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        signature: payload.signature,
      }),
    });


    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message =
        errorJson.message ||
        (res.status === 429
          ? 'Rate limit reached. Please wait a moment and try again.'
          : `Server returned error (${res.status})`);

      // Reliability fallback for sample note demo
      if (isSampleTranscript) {
        console.warn('Backend returned error during sample note; utilizing pregenerated demo fallback.');
        return {
          data: PREGENERATED_SAMPLE_RESULT,
          usedFallback: true,
        };
      }

      throw new Error(message);
    }

    const json = await res.json();
    if (!json.data) {
      throw new Error('Invalid response structure received from EchoCRM server.');
    }

    return {
      data: json.data,
      usedFallback: false,
    };
  } catch (err: any) {
    if (isSampleTranscript) {
      console.warn('Fetch failed for sample note; using verified offline demo fallback.', err);
      return {
        data: PREGENERATED_SAMPLE_RESULT,
        usedFallback: true,
      };
    }
    throw err;
  }
}

export async function regenerateEmailTone(
  payload: {
    tone: EmailTone;
    transcript: string;
    metadata?: any;
    previousEmail: { subject: string; body: string };
    signature?: string;
  },
): Promise<{ emailSubject: string; emailBody: string }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'email_tone',
      tone: payload.tone,
      transcript: payload.transcript,
      metadata: payload.metadata,
      previousEmail: payload.previousEmail,
      todayDate: new Date().toISOString().split('T')[0],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      signature: payload.signature,
    }),
  });


  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.message || `Failed to regenerate tone (${res.status})`,
    );
  }

  const json = await res.json();
  return json.data;
}
