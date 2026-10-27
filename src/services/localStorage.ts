import { DebriefDocument, UserProfile, CallTemplate } from '../types';

// This app stores data in the visitor's browser. No account or cloud database
// is required; data stays on this device until the browser storage is cleared.
const KEYS = {
  debriefs: 'echocrm_debriefs_v1',
  profile: 'echocrm_profile_v1',
  templates: 'echocrm_templates_v1',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const getDebriefs = () => read<DebriefDocument[]>(KEYS.debriefs, []);

export async function fetchDebriefs(): Promise<DebriefDocument[]> {
  return getDebriefs().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveDebrief(debrief: DebriefDocument): Promise<void> {
  write(KEYS.debriefs, [...getDebriefs().filter((item) => item.id !== debrief.id), debrief]);
}

export async function updateDebrief(
  id: string,
  updates: Partial<DebriefDocument>,
): Promise<void> {
  write(KEYS.debriefs, getDebriefs().map((item) => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
}

export async function deleteDebrief(id: string): Promise<void> {
  write(KEYS.debriefs, getDebriefs().filter((item) => item.id !== id));
}

// User Profile & Email Signature operations
export async function fetchProfile(): Promise<UserProfile | null> {
  return read<UserProfile | null>(KEYS.profile, null);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  write(KEYS.profile, { ...profile, updatedAt: new Date().toISOString() });
}

// ─── User Custom Templates ────────────────────────────────────────────────────

export async function fetchTemplates(): Promise<CallTemplate[]> {
  return read<CallTemplate[]>(KEYS.templates, []).sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
}

export async function saveTemplate(template: CallTemplate): Promise<void> {
  const items = read<CallTemplate[]>(KEYS.templates, []);
  write(KEYS.templates, [...items.filter((item) => item.id !== template.id), template]);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  write(KEYS.templates, read<CallTemplate[]>(KEYS.templates, []).filter((item) => item.id !== templateId));
}

// ─── Google Calendar OAuth ────────────────────────────────────────────────────

export async function clearLocalData(): Promise<void> {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event('echocrm:local-data-cleared'));
}
