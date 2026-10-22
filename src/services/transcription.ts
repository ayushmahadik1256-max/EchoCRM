export const MAX_AUDIO_UPLOAD_BYTES = 20 * 1024 * 1024; // matches the server ceiling

export const ACCEPTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.wav',
  '.webm',
  '.ogg',
  '.flac',
  '.aac',
  '.mp4',
] as const;

export const ACCEPTED_AUDIO_ACCEPT =
  'audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac,.aac,.mp4';

const FALLBACK_MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/m4a',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  mp4: 'audio/mp4',
};

export interface TranscriptionResult {
  transcript: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  wordCount: number;
}

/** Best-effort MIME detection — some browsers report "" or "application/octet-stream". */
export function resolveAudioMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return FALLBACK_MIME_BY_EXTENSION[ext] || 'audio/mpeg';
}

export function validateAudioFile(file: File): string | null {
  if (!file) return 'Please choose an audio file.';

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const looksLikeAudio =
    file.type.startsWith('audio/') ||
    file.type === 'video/webm' ||
    file.type === 'video/mp4' ||
    (ACCEPTED_AUDIO_EXTENSIONS as readonly string[]).includes(`.${ext}`);

  if (!looksLikeAudio) {
    return 'That file does not look like an audio recording. Use MP3, M4A, WAV, WebM, OGG, FLAC, or MP4.';
  }

  if (file.size === 0) return 'That file is empty.';

  if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `That recording is ${mb}MB. The limit is 20MB — trim or compress it first.`;
  }

  return null;
}

/**
 * Upload the recording as raw bytes (no multipart parsing needed server-side)
 * and resolve with the transcribed notes.
 */
export function transcribeAudioFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const mimeType = resolveAudioMimeType(file);
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/api/transcribe', true);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // Reserve the last 10% for server-side transcription.
        onProgress(Math.min(90, Math.round((event.loaded / event.total) * 90)));
      }
    };

    xhr.onload = () => {
      let payload: any = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.data?.transcript) {
        onProgress?.(100);
        resolve(payload.data as TranscriptionResult);
        return;
      }

      const message =
        payload?.message ||
        (xhr.status === 413
          ? 'Recording is too large. Please upload a file under 20MB.'
          : `Transcription failed (${xhr.status || 'network error'}).`);
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error('Network error while uploading the recording.'));
    xhr.ontimeout = () => reject(new Error('The upload timed out. Please try again.'));

    xhr.send(file);
  });
}
