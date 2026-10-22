import { useState, useRef, useEffect, useCallback } from 'react';
import { isSpeechRecognitionSupported, createSpeechRecognitionInstance } from '../services/speech';

export interface UseSpeechRecognitionOptions {
  onTranscriptUpdate: (finalChunk: string) => void;
}

export function useSpeechRecognition({ onTranscriptUpdate }: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const recognitionRef = useRef<any>(null);
  const isSupported = isSpeechRecognitionSupported();

  // Keep callback fresh in ref
  const onUpdateRef = useRef(onTranscriptUpdate);
  useEffect(() => {
    onUpdateRef.current = onTranscriptUpdate;
  }, [onTranscriptUpdate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    setIsRecording(false);
    setInterimTranscript('');
    setAnnouncement('Microphone recording stopped.');
  }, []);

  const startListening = useCallback(() => {
    setSpeechError(null);

    if (!isSupported) {
      setSpeechError(
        'Speech recognition is not supported in this browser. Chrome or Edge is recommended. You can type or paste notes below.',
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }

      const recognition = createSpeechRecognitionInstance();
      if (!recognition) {
        setSpeechError('Failed to initialize speech recognition engine.');
        return;
      }

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setAnnouncement('Microphone recording active. Speak your call debrief notes.');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += text + ' ';
          } else {
            interim += text;
          }
        }

        if (finalChunk.trim()) {
          onUpdateRef.current(finalChunk);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(
            'Microphone access was denied. Please allow microphone permissions in browser settings or use the typed fallback below.',
          );
        } else if (event.error === 'no-speech') {
          // No speech detected; quiet event, do not aggressively error
          return;
        } else if (event.error === 'audio-capture') {
          setSpeechError('No audio capture device found. Check your microphone connection.');
        } else if (event.error === 'network') {
          setSpeechError('Network error connecting to speech recognition service.');
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}. You can still type notes manually.`);
        }
        setIsRecording(false);
        setInterimTranscript('');
        setAnnouncement('Microphone recording stopped due to error.');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError(
        'Could not start microphone. Please check permissions or type your notes directly.',
      );
      setIsRecording(false);
    }
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isRecording,
    interimTranscript,
    speechError,
    isSupported,
    announcement,
    startListening,
    stopListening,
    clearError: () => setSpeechError(null),
  };
}
