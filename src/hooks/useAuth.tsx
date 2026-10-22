import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  testConnection,
  saveDebriefToFirestore,
  fetchUserProfile,
  saveUserProfileToFirestore,
} from '../services/firebase';
import {
  getGuestDebriefs,
  clearGuestDebriefs,
  getGuestUserProfile,
  saveGuestUserProfile,
  DEFAULT_EMAIL_SIGNATURE,
} from '../services/localStore';
import { UserProfile } from '../types';

export function appendSignatureToEmail(body: string, signature: string): string {
  if (!signature || !signature.trim()) return body;
  const trimmedBody = body.trim();
  const trimmedSig = signature.trim();

  if (trimmedBody.endsWith(trimmedSig)) {
    return trimmedBody;
  }

  // Check if body ends with a generic closing that matches start of signature
  const closingRegex = /(?:^|\n\n|\n)(?:Best regards,?|Warm regards,?|Regards,?|Best,?|Sincerely,?|Thanks,?|Thank you,?)\s*$/i;

  if (
    closingRegex.test(trimmedBody) &&
    /^(?:Best regards|Warm regards|Regards|Best|Sincerely|Thanks|Thank you)/i.test(trimmedSig)
  ) {
    const withoutClosing = trimmedBody.replace(closingRegex, '').trim();
    return `${withoutClosing}\n\n${trimmedSig}`;
  }

  return `${trimmedBody}\n\n${trimmedSig}`;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  guestCount: number;
  userProfile: UserProfile;
  emailSignature: string;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  importGuestDebriefsToFirestore: () => Promise<number>;
  dismissGuestImportNotice: () => void;
  showImportPrompt: boolean;
  refreshGuestCount: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  appendUserSignature: (body: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(0);
  const [showImportPrompt, setShowImportPrompt] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const guest = getGuestUserProfile();
    return {
      userId: 'guest',
      emailSignature: guest.emailSignature || DEFAULT_EMAIL_SIGNATURE,
      senderName: guest.senderName || 'Alex Chen',
      senderTitle: guest.senderTitle || 'Senior Client Consultant',
      company: guest.company || 'Echo Advisory Group',
    };
  });

  const refreshGuestCount = () => {
    const list = getGuestDebriefs();
    setGuestCount(list.length);
  };

  // Load profile when user changes
  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      try {
        const firestoreProfile = await fetchUserProfile(currentUser.uid);
        if (firestoreProfile) {
          setUserProfile(firestoreProfile);
        } else {
          // Initialize profile from guest settings or account info
          const guestSettings = getGuestUserProfile();
          const newProfile: UserProfile = {
            userId: currentUser.uid,
            emailSignature: guestSettings.emailSignature || DEFAULT_EMAIL_SIGNATURE,
            senderName: currentUser.displayName || guestSettings.senderName || 'Consultant',
            senderTitle: guestSettings.senderTitle || 'Principal Consultant',
            company: guestSettings.company || 'Advisory Group',
            updatedAt: new Date().toISOString(),
          };
          await saveUserProfileToFirestore(newProfile);
          setUserProfile(newProfile);
        }
      } catch (err) {
        console.error('Failed to load user profile from Firestore:', err);
      }
    } else {
      const guest = getGuestUserProfile();
      setUserProfile({
        userId: 'guest',
        emailSignature: guest.emailSignature || DEFAULT_EMAIL_SIGNATURE,
        senderName: guest.senderName || 'Alex Chen',
        senderTitle: guest.senderTitle || 'Senior Client Consultant',
        company: guest.company || 'Echo Advisory Group',
      });
    }
  }, []);

  useEffect(() => {
    testConnection();
    refreshGuestCount();

    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      loadProfile(currentUser);

      if (currentUser) {
        const guestItems = getGuestDebriefs();
        if (guestItems.length > 0) {
          setShowImportPrompt(true);
        }
      } else {
        setShowImportPrompt(false);
      }
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      userId: user ? user.uid : 'guest',
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updated);

    if (user) {
      await saveUserProfileToFirestore(updated);
    } else {
      saveGuestUserProfile(updated);
    }
  };

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setShowImportPrompt(false);
      refreshGuestCount();
    } catch (err: any) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const importGuestDebriefsToFirestore = async (): Promise<number> => {
    if (!user) return 0;
    const items = getGuestDebriefs();
    if (!items.length) return 0;

    let imported = 0;
    for (const item of items) {
      await saveDebriefToFirestore({
        ...item,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      });
      imported++;
    }

    clearGuestDebriefs();
    setShowImportPrompt(false);
    refreshGuestCount();
    return imported;
  };

  const dismissGuestImportNotice = () => {
    setShowImportPrompt(false);
  };

  const appendUserSignature = (body: string): string => {
    if (userProfile.appendSignature === false) {
      return body;
    }
    return appendSignatureToEmail(body, userProfile.emailSignature);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: !user,
        guestCount,
        userProfile,
        emailSignature: userProfile.emailSignature,
        updateUserProfile,
        signIn,
        signOut,
        importGuestDebriefsToFirestore,
        dismissGuestImportNotice,
        showImportPrompt,
        refreshGuestCount,
        isProfileModalOpen,
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        appendUserSignature,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
