import { NextStepTask } from '../types';
import {
  clearGoogleCalendarToken,
  requestGoogleCalendarToken,
} from './firebase';

export type CalendarSyncErrorCode =
  | 'AUTH'
  | 'PERMISSION'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'UNKNOWN';

export class CalendarSyncError extends Error {
  code: CalendarSyncErrorCode;

  constructor(message: string, code: CalendarSyncErrorCode = 'UNKNOWN') {
    super(message);
    this.name = 'CalendarSyncError';
    this.code = code;
  }
}

export interface CreatedCalendarEvent {
  id: string;
  htmlLink: string;
  startDate: string;
}

function addOneDay(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) {
    return new Date(Date.now() + 86400000).toISOString().split('T')[0];
  }
  parsed.setDate(parsed.getDate() + 1);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normaliseDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

/**
 * Creates an all-day event on the user's primary Google Calendar through the
 * Calendar REST API (true sync — no manual "save" click in Google's UI).
 */
export async function createGoogleCalendarEvent(
  task: NextStepTask,
  clientName?: string,
  company?: string,
): Promise<CreatedCalendarEvent> {
  let token: string;

  try {
    token = await requestGoogleCalendarToken();
  } catch (error: any) {
    const code = String(error?.code || '');
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new CalendarSyncError('Calendar connection cancelled before it finished.', 'AUTH');
    }
    if (code === 'auth/popup-blocked') {
      throw new CalendarSyncError(
        'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
        'AUTH',
      );
    }
    throw new CalendarSyncError(
      error?.message || 'Could not connect to Google Calendar.',
      'AUTH',
    );
  }

  const startDate = normaliseDate(task.dueDate);
  const endDate = addOneDay(startDate);

  const description = [
    `Owner: ${task.owner}`,
    `Priority: ${task.priority}`,
    `Client: ${clientName || 'N/A'}`,
    `Company: ${company || 'N/A'}`,
    '',
    'Rationale:',
    task.rationale,
    '',
    'Created by EchoCRM Assistant.',
  ].join('\n');

  let response: Response;
  try {
    response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `[EchoCRM] ${task.title}${company ? ` — ${company}` : ''}`,
          description,
          start: { date: startDate },
          end: { date: endDate },
          reminders: {
            useDefault: false,
            override: [{ method: 'popup', minutes: 60 }],
          },
          extendedProperties: {
            private: {
              source: 'echocrm',
              priority: task.priority,
              client: clientName || '',
              company: company || '',
            },
          },
        }),
      },
    );
  } catch {
    throw new CalendarSyncError(
      'Network error while contacting Google Calendar. Check your connection and retry.',
      'NETWORK',
    );
  }

  if (response.status === 401) {
    clearGoogleCalendarToken();
    throw new CalendarSyncError(
      'Your Google session expired. Click sync again to reconnect.',
      'AUTH',
    );
  }

  if (response.status === 403) {
    throw new CalendarSyncError(
      'Google denied calendar access. Make sure the Google Calendar API is enabled for this project and calendar permission was granted.',
      'PERMISSION',
    );
  }

  if (response.status === 429) {
    throw new CalendarSyncError(
      'Google Calendar rate limit reached. Please wait a moment and retry.',
      'RATE_LIMIT',
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message || '';
    } catch {
      // Ignore unparsable error bodies.
    }
    throw new CalendarSyncError(
      detail || `Google Calendar returned an error (${response.status}).`,
      'UNKNOWN',
    );
  }

  const created = await response.json();

  return {
    id: created?.id || '',
    htmlLink: created?.htmlLink || 'https://calendar.google.com/calendar/r',
    startDate,
  };
}
