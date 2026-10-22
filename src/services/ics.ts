import { NextStepTask } from '../types';

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatDateToIcs(dateStr: string): string {
  // Expected YYYY-MM-DD
  const clean = dateStr.replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    return clean;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

function getNextDayIcs(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const next = new Date(Date.now() + 86400000);
    return formatDateToIcs(next.toISOString().split('T')[0]);
  }
  const next = new Date(d.getTime() + 86400000);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function downloadTaskIcs(
  task: NextStepTask,
  clientName?: string,
  company?: string,
): void {
  const dtStamp =
    new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0] + 'Z';
  const dtStart = formatDateToIcs(task.dueDate);
  const dtEnd = getNextDayIcs(task.dueDate);
  const uid = `echocrm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@echocrm.local`;

  const summary = escapeIcsText(
    `[EchoCRM] ${task.title}${company ? ` — ${company}` : ''}`,
  );
  const description = escapeIcsText(
    `Owner: ${task.owner}\nPriority: ${task.priority}\nClient: ${clientName || 'N/A'}\nCompany: ${company || 'N/A'}\n\nRationale:\n${task.rationale}\n\nCreated by EchoCRM Assistant.`,
  );

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EchoCRM//Voice Follow-Up Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanSlug = (task.title || 'task')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 30);
  const filename = `EchoCRM-${cleanSlug || 'followup'}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
