/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SignInModal } from './components/SignInModal';
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
  fetchUserDebriefs,
  saveDebriefToFirestore,
  updateDebriefInFirestore,
  deleteDebriefFromFirestore,
} from './services/firebase';
import { SAMPLE_DICTATED_NOTE, SAMPLE_METADATA } from './data/sampleNotes';
import { PageTransition } from './components/PageTransition';

type ViewMode = 'landing' | 'new' | 'history' | 'results';

type PendingIntent = 'new' | 'sample' | 'demo' | 'history' | 'save';

const DEFAULT_SIGN_IN_REASON =
  'Sign in with Google to save debriefs to your account and access them on any device.';

function MainApp() {
  const { user, loading: authLoading, signIn, appendUserSignature } = useAuth();

  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [debriefs, setDebriefs] = useState<DebriefDocument[]>([]);
  const [debriefLoadError, setDebriefLoadError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Sign-in is only requested when a visitor tries to use the service. The
  // intent they chose is remembered and replayed after authentication.
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInReason, setSignInReason] = useState(DEFAULT_SIGN_IN_REASON);
  const pendingIntentRef = useRef<PendingIntent | null>(null);
  const pendingSaveDocRef = useRef<DebriefDocument | null>(null);
  const saveCallbacksRef = useRef<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
  } | null>(null);
  const previousUidRef = useRef<string | null>(null);

  const promptSignIn = (intent: PendingIntent | null, reason?: string) => {
    pendingIntentRef.current = intent;
    setSignInReason(reason || DEFAULT_SIGN_IN_REASON);
    setSignInError(null);
    setSignInOpen(true);
  };

  const cancelSignIn = () => {
    setSignInOpen(false);
    pendingIntentRef.current = null;
    pendingSaveDocRef.current = null;
    if (saveCallbacksRef.current) {
      saveCallbacksRef.current.reject(new Error('SIGN_IN_CANCELLED'));
      saveCallbacksRef.current = null;
    }
  };

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
    if (!user) {
      setDebriefs([]);
      return;
    }
    setDebriefLoadError(null);
    try {
      const firestoreList = await fetchUserDebriefs(user.uid);
      setDebriefs(firestoreList);
    } catch (err) {
      console.error('Failed to load debriefs:', err);
      setDebriefLoadError('Could not load your debriefs from Firebase. Please try again.');
    }
  }, [user]);

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
    // Automatically append the signed-in user's email signature (guests have
    // no profile yet, so their generated email is left untouched).
    const emailBodyWithSignature = user
      ? appendUserSignature(result.emailBody)
      : result.emailBody;
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

  // Persist a debrief to Firestore (requires an authenticated user).
  const persistDebrief = async (docToSave: DebriefDocument) => {
    if (!user) throw new Error('Sign in is required to save debriefs.');
    const userDoc: DebriefDocument = {
      ...docToSave,
      userId: user.uid,
    };
    await saveDebriefToFirestore(userDoc);
    setActiveDebriefId(docToSave.id);
    await loadDebriefs();
  };

  // Saving is the first point where an account is required. Guests keep their
  // debrief in the current session; clicking Save opens the sign-in prompt and
  // the same save is completed automatically after authentication.
  const handleSaveDebrief = (docToSave: DebriefDocument): Promise<void> => {
    if (!user) {
      pendingSaveDocRef.current = docToSave;
      promptSignIn(
        'save',
        'Sign in to store this debrief in your account. You can keep using EchoCRM without an account.',
      );
      return new Promise<void>((resolve, reject) => {
        saveCallbacksRef.current = { resolve, reject };
      });
    }
    return persistDebrief(docToSave);
  };

  // Toggle Open/Done status directly in History table
  const handleToggleStatus = async (id: string, currentStatus: DebriefStatus) => {
    const newStatus: DebriefStatus = currentStatus === 'Open' ? 'Done' : 'Open';
    // Optimistic UI update
    setDebriefs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
    );

    try {
      if (!user) throw new Error('Sign in is required to update debriefs.');
      await updateDebriefInFirestore(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      await loadDebriefs();
    }
  };

  // Delete debrief
  const handleDeleteDebrief = async (id: string) => {
    setDebriefs((prev) => prev.filter((d) => d.id !== id));
    try {
      if (!user) throw new Error('Sign in is required to delete debriefs.');
      await deleteDebriefFromFirestore(id);
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
  // Each raw action is also replayed by the post-sign-in effect, so they must
  // not depend on a possibly stale `user` closure.

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

  const openInstantDemo = () => {
    const emailWithSig = user
      ? appendUserSignature(PREGENERATED_SAMPLE_RESULT.emailBody)
      : PREGENERATED_SAMPLE_RESULT.emailBody;
    setActiveResult({
      ...PREGENERATED_SAMPLE_RESULT,
      emailBody: emailWithSig,
    });
    setActiveMetadata(SAMPLE_METADATA);
    setActiveTranscript(SAMPLE_DICTATED_NOTE);
    setActiveDebriefId(undefined);
    setActiveUsedFallback(true);
    setCurrentView('results');
  };

  const openHistory = () => setCurrentView('history');

  // Guests can use the full workflow (record, upload, sample, demo, results).
  // An account is only needed for storage-backed features.
  const handleStartNewDebrief = () => openNewDebrief();

  const handleTrySampleCall = () => openSampleDebrief();

  const handleInstantJudgeDemo = () => openInstantDemo();

  const handleViewHistory = () => {
    if (!user) {
      promptSignIn('history', 'Sign in to view, search, and manage your saved debriefs.');
      return;
    }
    openHistory();
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      await signIn();
    } catch (error: unknown) {
      console.error('Google Sign-In failed:', error);
      const code = (error as { code?: string } | null)?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setSignInError('Sign-in was cancelled. Click “Continue with Google” to try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setSignInError(
          'This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
        );
      } else if (code === 'auth/operation-not-allowed') {
        setSignInError('Google sign-in is disabled for this project. Enable it in Firebase Console → Authentication.');
      } else {
        setSignInError('Google sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  // After a successful sign-in, close the prompt and replay the action the
  // visitor originally clicked (start a debrief, open history, etc.). Waiting
  // for authLoading to finish also ensures the profile/signature is loaded.
  useEffect(() => {
    if (authLoading || !user) return;
    setSignInOpen(false);
    setSignInError(null);
    const pendingIntent = pendingIntentRef.current;
    pendingIntentRef.current = null;
    if (pendingIntent === 'new') openNewDebrief();
    else if (pendingIntent === 'sample') openSampleDebrief();
    else if (pendingIntent === 'demo') openInstantDemo();
    else if (pendingIntent === 'history') openHistory();
    else if (pendingIntent === 'save') {
      const doc = pendingSaveDocRef.current;
      pendingSaveDocRef.current = null;
      const callbacks = saveCallbacksRef.current;
      saveCallbacksRef.current = null;
      if (!doc) {
        callbacks?.resolve();
        return;
      }
      persistDebrief(doc)
        .then(() => callbacks?.resolve())
        .catch((err) => callbacks?.reject(err));
    }
    // open*/persist helpers only call stable state setters or the latest user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Signing out returns the visitor to the public landing page and clears
  // any in-progress, account-specific state. A guest's first auth resolution
  // is not a sign-out, so it must not reset the screen they are using.
  useEffect(() => {
    if (authLoading) return;
    const previousUid = previousUidRef.current;
    previousUidRef.current = user?.uid ?? null;
    if (user || !previousUid) return;
    setCurrentView('landing');
    setActiveResult(null);
    setActiveMetadata({});
    setActiveTranscript('');
    setActiveDebriefId(undefined);
    setActiveUsedFallback(false);
    setPresetTranscript('');
    setPresetMetadata({});
    setShowOnboarding(false);
    pendingIntentRef.current = null;
    pendingSaveDocRef.current = null;
    if (saveCallbacksRef.current) {
      saveCallbacksRef.current.reject(new Error('SIGN_IN_CANCELLED'));
      saveCallbacksRef.current = null;
    }
  }, [user, authLoading]);

  // Guests can work through the whole flow; only account-backed actions
  // (saving, history, custom templates) require sign-in.
  const view: ViewMode = currentView;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F3F9FF]">
        <div className="logo-3d w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1A73D9] to-[#7FB8F2] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(26,115,217,0.4)]">
          <Mic className="w-5 h-5 stroke-[2.2]" />
        </div>
        <p className="text-sm font-semibold text-[#5B6B7F]">Loading EchoCRM…</p>
      </div>
    );
  }

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

      {/* Sign-in prompt shown only when a visitor starts using the service */}
      <SignInModal
        isOpen={signInOpen}
        onClose={cancelSignIn}
        onSignIn={handleSignIn}
        signingIn={signingIn}
        error={signInError}
        reason={signInReason}
      />

      {/* User Profile & Email Signature Settings Modal */}
      {user && (
        <ProfileSettingsModal
          allDebriefs={debriefs}
          onReplayTour={() => setShowOnboarding(true)}
          onDataCleared={loadDebriefs}
        />
      )}

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
        onRequestSignIn={() => promptSignIn(null)}
        onUseSampleDirectly={handleTrySampleCall}
      />

      {/* Main Screen Body */}
      <main className="flex-1">
        {user && debriefLoadError && (
          <div role="alert" className="mx-auto mt-4 max-w-7xl px-4 text-sm text-rose-700">
            {debriefLoadError}
          </div>
        )}
        <PageTransition viewKey={view}>
        {view === 'landing' && (
          <LandingScreen
            onStartNew={handleStartNewDebrief}
            onTrySample={handleTrySampleCall}
            onInstantJudgeDemo={handleInstantJudgeDemo}
            onViewHistory={handleViewHistory}
            onOpenTour={() => setShowOnboarding(true)}
          />
        )}

        {view === 'new' && (
          <NewDebriefScreen
            initialTranscript={presetTranscript}
            initialMetadata={presetMetadata}
            onGenerateSuccess={handleGenerateSuccess}
            onRequestSignIn={() =>
              promptSignIn(null, 'Sign in to create and save your own call templates.')
            }
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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
