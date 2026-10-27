/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { ProfileProvider, useProfile } from './hooks/useProfile';
import { Navbar } from './components/Navbar';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AmbientBackground } from './components/AmbientBackground';
import { LandingScreen } from './screens/LandingScreen';
import { NewDebriefScreen } from './screens/NewDebriefScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { HistoryDashboardScreen } from './screens/HistoryDashboardScreen';
import {
  DebriefDocument,
  DebriefResult,
  DebriefStatus,
  DealStage,
} from './types';
import {
  fetchDebriefs,
  saveDebrief,
  updateDebrief,
  deleteDebrief,
} from './services/localStorage';
import { SAMPLE_DICTATED_NOTE, SAMPLE_METADATA } from './data/sampleNotes';
import { PageTransition } from './components/PageTransition';

type ViewMode = 'landing' | 'new' | 'history' | 'results';

function MainApp() {
  const { appendUserSignature } = useProfile();

  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [debriefs, setDebriefs] = useState<DebriefDocument[]>([]);
  const [debriefLoadError, setDebriefLoadError] = useState<string | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingTrySample = () => {
    handleCloseOnboarding();
    handleTrySampleCall();
  };

  // Active debrief in Results view
  const [activeResult, setActiveResult] = useState<DebriefResult | null>(null);
  const [activeMetadata, setActiveMetadata] = useState<any>({});
  const [activeTranscript, setActiveTranscript] = useState<string>('');
  const [activeDebriefId, setActiveDebriefId] = useState<string | undefined>(undefined);
  const [activeUsedFallback, setActiveUsedFallback] = useState(false);

  // Preload state for New Debrief
  const [presetTranscript, setPresetTranscript] = useState('');
  const [presetMetadata, setPresetMetadata] = useState<any>({});

  // Load debriefs whenever auth state changes
  const loadDebriefs = useCallback(async () => {
    setDebriefLoadError(null);
    try {
      const savedDebriefs = await fetchDebriefs();
      setDebriefs(savedDebriefs);
    } catch (err) {
      console.error('Failed to load debriefs:', err);
      setDebriefLoadError('Could not load saved debriefs from this browser.');
    }
  }, []);

  useEffect(() => {
    loadDebriefs();
  }, [loadDebriefs]);

  // Handle generation success from New Debrief
  const handleGenerateSuccess = (
    result: DebriefResult,
    metadata: any,
    transcript: string,
    usedFallback?: boolean,
  ) => {
    // Append the local profile's email signature.
    const emailBodyWithSignature = appendUserSignature(result.emailBody);
    const finalResult: DebriefResult = {
      ...result,
      emailBody: emailBodyWithSignature,
    };

    setActiveResult(finalResult);
    setActiveMetadata(metadata);
    setActiveTranscript(transcript);
    setActiveDebriefId(undefined); // New unsaved debrief
    setActiveUsedFallback(Boolean(usedFallback));
    setCurrentView('results');
  };

  // Save debriefs in this browser so no account or server database is needed.
  const persistDebrief = async (docToSave: DebriefDocument) => {
    const userDoc: DebriefDocument = {
      ...docToSave,
      userId: 'local',
    };
    await saveDebrief(userDoc);
    setActiveDebriefId(docToSave.id);
    await loadDebriefs();
  };

  const handleSaveDebrief = (docToSave: DebriefDocument): Promise<void> => persistDebrief(docToSave);

  // Toggle Open/Done status directly in History table
  const handleToggleStatus = async (id: string, currentStatus: DebriefStatus) => {
    const newStatus: DebriefStatus = currentStatus === 'Open' ? 'Done' : 'Open';
    // Optimistic UI update
    setDebriefs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
    );

    try {
      await updateDebrief(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      await loadDebriefs();
    }
  };

  // Delete debrief
  const handleDeleteDebrief = async (id: string) => {
    setDebriefs((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDebrief(id);
    } catch (err) {
      console.error('Failed to delete debrief:', err);
      await loadDebriefs();
    }
  };

  // Select debrief from History table to view / edit in Results
  const handleSelectDebrief = (doc: DebriefDocument) => {
    setActiveResult({
      emailSubject: doc.emailSubject,
      emailBody: doc.emailBody,
      emailTone: doc.emailTone,
      crm: doc.crm,
      internalNote: doc.internalNote,
      nextStep: doc.nextStep,
    });
    setActiveMetadata({
      clientName: doc.clientName,
      company: doc.company,
      dealStage: doc.dealStage,
      callDate: doc.callDate,
    });
    setActiveTranscript(doc.rawTranscript);
    setActiveDebriefId(doc.id);
    setActiveUsedFallback(Boolean(doc.isFallbackDemo));
    setCurrentView('results');
  };

  // ── Service entry points ──────────────────────────────────────────────────
  const openNewDebrief = () => {
    setPresetTranscript('');
    setPresetMetadata({});
    setCurrentView('new');
  };

  const openSampleDebrief = () => {
    setPresetTranscript(SAMPLE_DICTATED_NOTE);
    setPresetMetadata(SAMPLE_METADATA);
    setCurrentView('new');
  };

  const openHistory = () => setCurrentView('history');

  const handleStartNewDebrief = () => openNewDebrief();

  const handleTrySampleCall = () => openSampleDebrief();

  const handleViewHistory = () => openHistory();
  const view: ViewMode = currentView;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#0F172A] relative selection:bg-[#CFE6FF] selection:text-[#0F172A]">
      {/* Ambient background with softly drifting light-blue orbs */}
      <AmbientBackground />

      {/* Guided Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onTrySample={handleOnboardingTrySample}
      />

      {/* User Profile & Email Signature Settings Modal */}
      <ProfileSettingsModal
        allDebriefs={debriefs}
        onReplayTour={() => setShowOnboarding(true)}
        onDataCleared={loadDebriefs}
      />

      {/* Primary 3-zone Navigation */}
      <Navbar
        currentView={view}
        onNavigate={(target) => {
          if (target === 'new') {
            handleStartNewDebrief();
          } else if (target === 'history') {
            handleViewHistory();
          } else {
            setCurrentView('landing');
          }
        }}
        onUseSampleDirectly={handleTrySampleCall}
      />

      {/* Main Screen Body */}
      <main className="flex-1">
        {debriefLoadError && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl px-4 text-sm text-rose-700">
            {debriefLoadError}
          </div>
        )}
        <PageTransition viewKey={view}>
        {view === 'landing' && (
          <LandingScreen
            onStartNew={handleStartNewDebrief}
            onTrySample={handleTrySampleCall}
            onViewHistory={handleViewHistory}
            onOpenTour={() => setShowOnboarding(true)}
          />
        )}

        {view === 'new' && (
          <NewDebriefScreen
            initialTranscript={presetTranscript}
            initialMetadata={presetMetadata}
            onGenerateSuccess={handleGenerateSuccess}
          />
        )}

        {view === 'results' && activeResult && (
          <ResultsScreen
            initialResult={activeResult}
            metadata={activeMetadata}
            rawTranscript={activeTranscript}
            existingId={activeDebriefId}
            usedFallback={activeUsedFallback}
            onSave={handleSaveDebrief}
            onBackToEdit={() => {
              setPresetTranscript(activeTranscript);
              setPresetMetadata(activeMetadata);
              setCurrentView('new');
            }}
            onNewDebrief={handleStartNewDebrief}
          />
        )}

        {view === 'history' && (
          <HistoryDashboardScreen
            debriefs={debriefs}
            onSelectDebrief={handleSelectDebrief}
            onToggleStatus={handleToggleStatus}
            onDeleteDebrief={handleDeleteDebrief}
            onNewDebrief={handleStartNewDebrief}
          />
        )}
        </PageTransition>
      </main>

      <footer className="relative border-t border-[#E4F1FF] bg-white/70 backdrop-blur-xl py-6 mt-12 text-center text-xs text-gray-500 overflow-hidden">
        <div className="absolute inset-x-0 -top-10 h-20 bg-gradient-to-b from-transparent to-[#F3F9FF]/80 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">EchoCRM</span>
            <span>·</span>
            <span>Voice-first client follow-up assistant</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Replay Tour
            </button>
            <span>·</span>
            <span>Powered by Gemini 2.5 Flash structured outputs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <MainApp />
    </ProfileProvider>
  );
}
