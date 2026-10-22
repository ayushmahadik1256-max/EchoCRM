// Helper to detect Web Speech API availability
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition,
  );
}

export function createSpeechRecognitionInstance(): any | null {
  if (!isSpeechRecognitionSupported()) return null;
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  return recognition;
}
