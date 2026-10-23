/**
 * Browser-native Web Speech Synthesis helper for the audio-out "AI Voice Debrief".
 * Uses window.speechSynthesis — 100% zero-configuration, works offline in all modern browsers.
 */

export interface VoiceDebriefContent {
  clientName: string;
  company: string;
  dealStage: string;
  agreedNextStep: string;
  nextStepTitle?: string;
  nextStepDueDate?: string;
  keyNeeds?: string[];
  budgetSignals?: string[];
  risks?: string[];
}

export function generateVoiceDebriefScript(content: VoiceDebriefContent): string {
  const parts: string[] = [];

  const client = content.clientName && content.clientName !== 'Needs confirmation'
    ? content.clientName
    : 'the client';
  const company = content.company && content.company !== 'Needs confirmation'
    ? `at ${content.company}`
    : '';

  parts.push(`Here is your post-call debrief for ${client} ${company}.`);
  parts.push(`Current deal stage is ${content.dealStage || 'Discovery'}.`);

  if (content.nextStepTitle && content.nextStepDueDate) {
    parts.push(`Agreed next step: ${content.nextStepTitle}, targeted for ${content.nextStepDueDate}.`);
  } else if (content.agreedNextStep && content.agreedNextStep !== 'Needs confirmation') {
    parts.push(`Agreed next step: ${content.agreedNextStep}.`);
  }

  if (content.keyNeeds && content.keyNeeds.length > 0) {
    parts.push(`Primary need identified: ${content.keyNeeds[0]}.`);
  }

  if (content.budgetSignals && content.budgetSignals.length > 0) {
    parts.push(`Budget clue: ${content.budgetSignals[0]}.`);
  }

  if (content.risks && content.risks.length > 0) {
    parts.push(`Watch out for: ${content.risks[0]}.`);
  }

  parts.push('Ready to send follow-up or add to your calendar.');

  return parts.join(' ');
}

export class VoiceDebriefPlayer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private onEndCallback: (() => void) | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
  ): void {
    if (!this.isSupported()) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.utterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.utterance = null;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    this.utterance = utterance;
    this.onEndCallback = onEnd || null;

    window.speechSynthesis.speak(utterance);
  }

  public pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.utterance = null;
      if (this.onEndCallback) {
        this.onEndCallback();
        this.onEndCallback = null;
      }
    }
  }

  public isPlaying(): boolean {
    return this.isSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused;
  }
}

export const voicePlayer = new VoiceDebriefPlayer();
