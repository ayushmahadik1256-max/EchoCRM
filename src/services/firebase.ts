import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { DebriefDocument, UserProfile, CallTemplate } from '../types';

import firebaseAppConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppConfig.appId,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingFirebaseConfig.join(', ')}. ` +
    'Provide values in firebase-applet-config.json or set the corresponding VITE_FIREBASE_* environment variables.',
  );
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(
  app,
  import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseAppConfig.firestoreDatabaseId || '(default)',
);

// Test Firestore connection on boot as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited.');
      return false;
    }
    // Expected to fail with missing doc or permission on test path, which proves connection reached server
    return true;
  }
}

// Google Sign-In
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore operations for Debriefs
export async function fetchUserDebriefs(userId: string): Promise<DebriefDocument[]> {
  const path = 'debriefs';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: DebriefDocument[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as DebriefDocument);
    });
    // Sort descending by createdAt
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveDebriefToFirestore(debrief: DebriefDocument): Promise<void> {
  const path = `debriefs/${debrief.id}`;
  try {
    const docRef = doc(db, 'debriefs', debrief.id);
    await setDoc(docRef, debrief);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateDebriefInFirestore(
  id: string,
  updates: Partial<DebriefDocument>,
): Promise<void> {
  const path = `debriefs/${id}`;
  try {
    const docRef = doc(db, 'debriefs', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteDebriefFromFirestore(id: string): Promise<void> {
  const path = `debriefs/${id}`;
  try {
    const docRef = doc(db, 'debriefs', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// User Profile & Email Signature operations
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const docRef = doc(db, 'users', profile.userId);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ─── User Custom Templates ────────────────────────────────────────────────────

export async function fetchUserTemplates(userId: string): Promise<CallTemplate[]> {
  const path = 'templates';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: CallTemplate[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as CallTemplate);
    });
    return results.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveTemplateToFirestore(template: CallTemplate): Promise<void> {
  const path = `templates/${template.id}`;
  try {
    const docRef = doc(db, 'templates', template.id);
    await setDoc(docRef, {
      ...template,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTemplateFromFirestore(templateId: string): Promise<void> {
  const path = `templates/${templateId}`;
  try {
    const docRef = doc(db, 'templates', templateId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ─── Google Calendar OAuth ────────────────────────────────────────────────────

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const CALENDAR_TOKEN_STORAGE_KEY = 'echocrm_google_calendar_token';
const CALENDAR_TOKEN_LIFETIME_MS = 50 * 60 * 1000; // Google access tokens last ~60 minutes

interface CachedCalendarToken {
  accessToken: string;
  expiresAt: number;
}

let calendarTokenCache: CachedCalendarToken | null = null;

export function readCachedCalendarToken(): CachedCalendarToken | null {
  if (calendarTokenCache && calendarTokenCache.expiresAt > Date.now() + 30_000) {
    return calendarTokenCache;
  }
  try {
    const raw = sessionStorage.getItem(CALENDAR_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCalendarToken;
    if (!parsed?.accessToken || parsed.expiresAt <= Date.now() + 30_000) {
      sessionStorage.removeItem(CALENDAR_TOKEN_STORAGE_KEY);
      return null;
    }
    calendarTokenCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function hasGoogleCalendarToken(): boolean {
  return readCachedCalendarToken() !== null;
}

export function clearGoogleCalendarToken(): void {
  calendarTokenCache = null;
  try {
    sessionStorage.removeItem(CALENDAR_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions (private mode, etc.)
  }
}

/**
 * Obtains an OAuth access token carrying the calendar.events scope.
 * Signed-in users are re-authenticated silently-ish via a popup; guests are
 * signed in through the same flow so they can push the event too.
 */
export async function requestGoogleCalendarToken(): Promise<string> {
  const cached = readCachedCalendarToken();
  if (cached) return cached.accessToken;

  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_CALENDAR_SCOPE);
  provider.setCustomParameters({ prompt: 'consent' });

  const result = auth.currentUser
    ? await reauthenticateWithPopup(auth.currentUser, provider)
    : await signInWithPopup(auth, provider);

  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error(
      'Google did not return a calendar access token. Please approve calendar access and try again.',
    );
  }

  const stored: CachedCalendarToken = {
    accessToken,
    expiresAt: Date.now() + CALENDAR_TOKEN_LIFETIME_MS,
  };
  calendarTokenCache = stored;
  try {
    sessionStorage.setItem(CALENDAR_TOKEN_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Token still usable in memory for this session.
  }

  return accessToken;
}
