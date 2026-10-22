import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileAudio,
  Loader2,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  ACCEPTED_AUDIO_ACCEPT,
  transcribeAudioFile,
  validateAudioFile,
} from '../services/transcription';

interface AudioUploadCardProps {
  onTranscript: (text: string, meta: { fileName: string; wordCount: number }) => void;
  disabled?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'done' | 'error';

export const AudioUploadCard: React.FC<AudioUploadCardProps> = ({
  onTranscript,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ words: number; name: string } | null>(null);

  const isBusy = status === 'uploading' || status === 'transcribing';

  const handleFile = async (file: File) => {
    if (isBusy || disabled) return;

    const validationError = validateAudioFile(file);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      setResult(null);
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);
    setProgress(0);
    setStatus('uploading');

    try {
      const response = await transcribeAudioFile(file, (percent) => {
        setProgress(percent);
        if (percent >= 90) setStatus('transcribing');
      });

      setStatus('done');
      setResult({ words: response.wordCount, name: response.fileName });
      onTranscript(response.transcript, {
        fileName: response.fileName,
        wordCount: response.wordCount,
      });
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      setStatus('error');
      setError(err?.message || 'Could not transcribe that recording. Please try again.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    if (isBusy) return;
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="rounded-3xl border border-[#CFE6FF] bg-white/85 shadow-[0_8px_24px_rgba(26,115,217,0.06)] overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
            <FileAudio className="w-3.5 h-3.5 text-[#1A73D9]" />
            <span>Upload a call recording</span>
          </h3>
          <p className="text-[11px] text-[#5B6B7F] mt-1 leading-snug">
            Already recorded the call? Drop the audio here and Gemini transcribes it into the notes
            box above. MP3, M4A, WAV, WebM, OGG, FLAC, MP4 — up to 20MB.
          </p>
        </div>
        {(status === 'done' || status === 'error') && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A73D9] hover:text-[#155FB5] shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-5">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload an audio recording for transcription"
          aria-disabled={isBusy || disabled}
          onClick={() => !isBusy && !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !isBusy && !disabled) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isBusy && !disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all px-4 py-5 text-center ${
            disabled
              ? 'border-[#E4F1FF] bg-gray-50 cursor-not-allowed opacity-70'
              : isBusy
              ? 'border-[#1A73D9]/40 bg-[#F3F9FF] cursor-progress'
              : isDragging
              ? 'border-[#1A73D9] bg-[#E4F1FF] cursor-copy'
              : 'border-[#CFE6FF] bg-[#F9FCFF] hover:border-[#1A73D9]/60 hover:bg-[#F3F9FF] cursor-pointer'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_AUDIO_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {status === 'idle' && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="w-9 h-9 rounded-xl bg-[#E4F1FF] text-[#1A73D9] flex items-center justify-center">
                <UploadCloud className="w-4.5 h-4.5" />
              </span>
              <span className="text-xs font-semibold text-[#0F172A]">
                Drop an audio file or click to browse
              </span>
              <span className="text-[11px] text-[#5B6B7F]">
                The transcript is appended to your call notes and stays fully editable.
              </span>
            </div>
          )}

          {isBusy && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1A73D9]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {status === 'uploading'
                    ? `Uploading ${fileName || 'recording'}… ${progress}%`
                    : 'Transcribing with Gemini…'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#CFE6FF] overflow-hidden max-w-sm mx-auto">
                <div
                  className="h-full bg-[#1A73D9] transition-all duration-300"
                  style={{ width: `${status === 'transcribing' ? 100 : progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#5B6B7F]">
                {status === 'transcribing'
                  ? 'Reading the conversation — longer calls can take up to a minute.'
                  : 'Keep this tab open while the upload finishes.'}
              </p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                {result.name} transcribed — {result.words.toLocaleString()} words added to your notes.
              </span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start justify-center gap-2 text-xs text-rose-800 text-left max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleReset();
                }}
                className="p-0.5 text-rose-700 hover:text-rose-900 cursor-pointer"
                aria-label="Dismiss upload error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {status === 'done' && (
          <p className="text-[11px] text-[#5B6B7F] mt-2 leading-snug">
            Review the transcript above, add budget or next-step details if anything was unclear,
            then generate your debrief.
          </p>
        )}

        <p className="sr-only" aria-live="polite">
          {status === 'done' && result
            ? `Transcription complete. ${result.words} words added.`
            : status === 'error'
            ? `Transcription failed. ${error}`
            : ''}
        </p>
      </div>
    </div>
  );
};
