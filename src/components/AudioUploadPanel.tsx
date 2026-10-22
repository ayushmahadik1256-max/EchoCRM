import React, { useCallback, useRef, useState } from 'react';
import { Upload, Mic, FileAudio, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AudioUploadStatus } from '../types';
import { transcribeAudioFile } from '../services/geminiClient';

interface AudioUploadPanelProps {
  /** Called with the cleaned transcript text when transcription succeeds */
  onTranscriptReady: (transcript: string) => void;
  /** Whether the panel is expanded / visible */
  isOpen: boolean;
  onToggle: () => void;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a', 'audio/aac', 'audio/flac', 'video/webm', 'video/mp4'];
const ACCEPT_ATTR = '.mp3,.mp4,.m4a,.wav,.ogg,.webm,.aac,.flac';
const MAX_MB = 20;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AudioUploadPanel: React.FC<AudioUploadPanelProps> = ({
  onTranscriptReady,
  isOpen,
  onToggle,
}) => {
  const [status, setStatus] = useState<AudioUploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File is too large (${formatBytes(file.size)}). Maximum size is ${MAX_MB} MB.`;
    }
    const lowerName = file.name.toLowerCase();
    const hasKnownExt = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.aac', '.flac'].some(
      (ext) => lowerName.endsWith(ext),
    );
    if (!ACCEPTED_TYPES.includes(file.type) && !hasKnownExt) {
      return `Unsupported format "${file.type || file.name.split('.').pop()}". Try MP3, M4A, WAV, WebM, or OGG.`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setStatus('idle');
    setErrorMsg(null);
    setWordCount(null);
  };

  const handleTranscribe = async () => {
    if (!selectedFile || status === 'uploading' || status === 'transcribing') return;

    setStatus('uploading');
    setErrorMsg(null);
    setProgress(0);

    // Animate fake upload progress while real request is in flight
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          clearInterval(progressTimer);
          return 88;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 400);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setStatus('transcribing');
      const result = await transcribeAudioFile(selectedFile, controller.signal);
      clearInterval(progressTimer);
      setProgress(100);
      setWordCount(result.wordCount);
      setStatus('done');
      onTranscriptReady(result.transcript);
    } catch (err: any) {
      clearInterval(progressTimer);
      if (err?.name === 'AbortError') {
        setStatus('idle');
        setProgress(0);
      } else {
        setStatus('error');
        setErrorMsg(err?.message ?? 'Transcription failed. Please try again.');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(0);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus('idle');
    setProgress(0);
    setErrorMsg(null);
    setWordCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const isBusy = status === 'uploading' || status === 'transcribing';

  return (
    <div className="border border-[#CFE6FF] rounded-2xl bg-white/90 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-[#0F172A] hover:bg-[#F3F9FF] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-[#1A73D9]" />
          <span>Upload Audio Recording</span>
          <span className="px-2 py-0.5 rounded-full bg-[#E4F1FF] text-[#1A73D9] text-[10px] font-bold">
            NEW
          </span>
        </span>
        <span className={`text-[#5B6B7F] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-fadeIn border-t border-[#E4F1FF]">
          <p className="text-[11px] text-[#5B6B7F] leading-relaxed">
            Upload a recorded call (.mp3, .m4a, .wav, .webm) up to {MAX_MB} MB.
            Gemini will transcribe the audio — then you can generate a full debrief from it.
          </p>

          {/* Drag & Drop zone */}
          {!selectedFile && status !== 'done' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 py-7 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors select-none ${
                isDragOver
                  ? 'border-[#1A73D9] bg-[#F3F9FF]'
                  : 'border-[#CFE6FF] hover:border-[#1A73D9] hover:bg-[#F3F9FF]/50'
              }`}
            >
              <Upload className={`w-6 h-6 ${isDragOver ? 'text-[#1A73D9]' : 'text-[#5B6B7F]'}`} />
              <div className="text-center">
                <p className="text-xs font-bold text-[#0F172A]">
                  {isDragOver ? 'Drop to upload' : 'Drag & drop audio here'}
                </p>
                <p className="text-[11px] text-[#5B6B7F] mt-0.5">or click to browse</p>
              </div>
              <p className="text-[10px] text-[#5B6B7F]">MP3 · M4A · WAV · WebM · OGG · FLAC · up to {MAX_MB} MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* File selected — ready to transcribe */}
          {selectedFile && status !== 'done' && (
            <div className="flex items-center gap-3 p-3 bg-[#F3F9FF] border border-[#CFE6FF] rounded-xl">
              <Mic className="w-4 h-4 text-[#1A73D9] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0F172A] truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-[#5B6B7F]">
                  {formatBytes(selectedFile.size)} · {selectedFile.type || 'audio'}
                </p>
              </div>
              {!isBusy && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 text-[#5B6B7F] hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isBusy && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#5B6B7F] flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#1A73D9]" />
                  {status === 'uploading' ? 'Uploading…' : 'Transcribing with Gemini…'}
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="w-full h-1.5 bg-[#E4F1FF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A73D9] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Success state */}
          {status === 'done' && selectedFile && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Transcript ready</p>
                  {wordCount !== null && (
                    <p className="text-[10px] text-emerald-700">{wordCount.toLocaleString()} words extracted from {selectedFile.name}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
              >
                Upload another
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-800">Upload failed</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {/* Transcribe button */}
          {selectedFile && !isBusy && status !== 'done' && (
            <button
              type="button"
              onClick={handleTranscribe}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-xl shadow-[0_2px_8px_rgba(26,115,217,0.25)] transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Transcribe with Gemini</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
