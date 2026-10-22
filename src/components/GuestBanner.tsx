import React, { useState } from 'react';
import { Database, Cloud, ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface GuestBannerProps {
  onImportComplete?: (count: number) => void;
}

export const GuestBanner: React.FC<GuestBannerProps> = ({ onImportComplete }) => {
  const {
    isGuest,
    user,
    signIn,
    guestCount,
    showImportPrompt,
    importGuestDebriefsToFirestore,
    dismissGuestImportNotice,
  } = useAuth();

  const [importing, setImporting] = useState(false);
  const [importedMessage, setImportedMessage] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setImporting(true);
      const count = await importGuestDebriefsToFirestore();
      setImportedMessage(`Successfully imported ${count} local debriefs to Firestore!`);
      if (onImportComplete) onImportComplete(count);
      setTimeout(() => setImportedMessage(null), 5000);
    } catch (err) {
      console.error('Failed to import guest debriefs:', err);
    } finally {
      setImporting(false);
    }
  };

  // If user is logged in and has pending local debriefs to import
  if (!isGuest && showImportPrompt && guestCount > 0) {
    return (
      <aside
        aria-label="Import debriefs notice"
        className="bg-[#F3F9FF] border-b border-[#CFE6FF] text-[#0F172A] text-xs py-2 px-4 shadow-2xs backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#1A73D9] shrink-0" />
            <span>
              You have <strong className="font-bold text-[#1A73D9]">{guestCount}</strong> local guest{' '}
              {guestCount === 1 ? 'debrief' : 'debriefs'} stored in this browser.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1 font-bold text-white bg-[#1A73D9] hover:bg-[#155FB5] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              {importing ? 'Importing…' : 'Import to Cloud'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={dismissGuestImportNotice}
              className="p-1 text-[#5B6B7F] hover:text-[#0F172A] rounded cursor-pointer"
              title="Dismiss notice"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // If import just succeeded
  if (importedMessage) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-2xs">
        <Check className="w-4 h-4 text-emerald-600" />
        <span className="font-semibold">{importedMessage}</span>
      </div>
    );
  }

  // If in Guest / Demo mode
  if (isGuest) {
    return (
      <div
        role="status"
        className="bg-[#F3F9FF]/80 border-b border-[#E4F1FF] text-[#0F172A] text-xs py-2 px-4 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-[#1A73D9] uppercase tracking-wider text-[10px] bg-[#E4F1FF] border border-[#CFE6FF] px-2 py-0.5 rounded-full">
              Demo mode active
            </span>
            <span className="text-[#5B6B7F]">
              Debriefs save to your browser's local storage.
            </span>
          </div>
          <button
            onClick={signIn}
            className="inline-flex items-center gap-1 font-bold text-[#1A73D9] hover:text-[#155FB5] underline underline-offset-2 shrink-0 cursor-pointer"
          >
            <span>Sign in to enable Firestore cloud sync</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
