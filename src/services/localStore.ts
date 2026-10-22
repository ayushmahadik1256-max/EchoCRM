import { DebriefDocument } from '../types';
import { getSeedDebriefs } from '../data/seedDebriefs';

const STORAGE_KEY = 'echocrm_guest_debriefs_v1';

export function getGuestDebriefs(): DebriefDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Auto-populate with realistic relative-date seed debriefs
      const seed = getSeedDebriefs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as DebriefDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading guest debriefs from localStorage:', err);
    return getSeedDebriefs();
  }
}

export function saveGuestDebrief(debrief: DebriefDocument): void {
  try {
    const existing = getGuestDebriefs();
    const index = existing.findIndex((d) => d.id === debrief.id);
    let updated: DebriefDocument[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...debrief, updatedAt: new Date().toISOString() };
    } else {
      updated = [debrief, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving guest debrief to localStorage:', err);
  }
}

export function updateGuestDebrief(
  id: string,
  updates: Partial<DebriefDocument>,
): DebriefDocument | null {
  try {
    const existing = getGuestDebriefs();
    const index = existing.findIndex((d) => d.id === id);
    if (index === -1) return null;
    const updatedItem: DebriefDocument = {
      ...existing[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    existing[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return updatedItem;
  } catch (err) {
    console.error('Error updating guest debrief in localStorage:', err);
    return null;
  }
}

export function deleteGuestDebrief(id: string): void {
  try {
    const existing = getGuestDebriefs();
    const filtered = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error deleting guest debrief from localStorage:', err);
  }
}

export function clearGuestDebriefs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing guest debriefs:', err);
  }
}

const PROFILE_KEY = 'echocrm_guest_user_profile_v1';

export const DEFAULT_EMAIL_SIGNATURE = `Best regards,
Alex Chen
Senior Client Consultant | Echo Advisory Group
Direct: +1 (555) 234-8901 · alex@echoadvisory.com`;

import { UserProfile } from '../types';

export function getGuestUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const initial: UserProfile = {
        userId: 'guest',
        emailSignature: DEFAULT_EMAIL_SIGNATURE,
        appendSignature: true,
        senderName: 'Alex Chen',
        senderTitle: 'Senior Client Consultant',
        company: 'Echo Advisory Group',
        phone: '+1 (555) 234-8901',
        website: 'https://echoadvisory.example.com',
        linkedInUrl: 'https://linkedin.com/in/alexchen',
        defaultTone: 'Professional',
        defaultDealStage: 'Discovery',
        defaultDueDateOffset: 2,
        defaultTaskPriority: 'Medium',
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      appendSignature: true,
      defaultTone: 'Professional',
      defaultDealStage: 'Discovery',
      defaultDueDateOffset: 2,
      defaultTaskPriority: 'Medium',
      ...parsed,
    };
  } catch (err) {
    console.error('Error loading guest user profile:', err);
    return {
      userId: 'guest',
      emailSignature: DEFAULT_EMAIL_SIGNATURE,
      appendSignature: true,
      senderName: 'Alex Chen',
      senderTitle: 'Senior Client Consultant',
      company: 'Echo Advisory Group',
      defaultTone: 'Professional',
      defaultDealStage: 'Discovery',
      defaultDueDateOffset: 2,
      defaultTaskPriority: 'Medium',
    };
  }
}

export function saveGuestUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving guest user profile:', err);
  }
}

// ─── Guest Custom Templates ───────────────────────────────────────────────────

import { CallTemplate } from '../types';

const TEMPLATES_KEY = 'echocrm_guest_templates_v1';

export function getGuestTemplates(): CallTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CallTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading guest templates from localStorage:', err);
    return [];
  }
}

export function saveGuestTemplate(template: CallTemplate): void {
  try {
    const existing = getGuestTemplates();
    const index = existing.findIndex((t) => t.id === template.id);
    let updated: CallTemplate[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      updated = [template, ...existing];
    }
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving guest template to localStorage:', err);
  }
}

export function deleteGuestTemplate(id: string): void {
  try {
    const existing = getGuestTemplates();
    const filtered = existing.filter((t) => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error deleting guest template from localStorage:', err);
  }
}


