import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  fetchUserProfile,
  saveUserProfileToFirestore,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
} from '../services/firebase';
import { UserProfile } from '../types';

export function appendSignatureToEmail(body: string, signature: string): string {
  if (!signature || !signature.trim()) return body;
  const trimmedBody = body.trim();
  const trimmedSig = signature.trim();

  if (trimmedBody.endsWith(trimmedSig)) return trimmedBody;

  const closingRegex = /(?:^|\n\n|\n)(?:Best regards,?|Warm regards,?|Regards,?|Best,?|Sincerely,?|Thanks,?|Thank you,?)\s*$/i;
  if (
    closingRegex.test(trimmedBody) &&
    /^(?:Best regards|Warm regards|Regards|Best|Sincerely|Thanks|Thank you)/i.test(trimmedSig)
  ) {
    return `${trimmedBody.replace(closingRegex, '').trim()}\n\n${trimmedSig}`;
  }

  return `${trimmedBody}\n\n${trimmedSig}`;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile;
  emailSignature: string;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  appendUserSignature: (body: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createDefaultProfile(user: User | null): UserProfile {
  const name = user?.displayName || '';
  return {
    userId: user?.uid || '',
    emailSignature: name ? `Best regards,\n${name}` : 'Best regards,',
    senderName: name,
    senderTitle: '',
    company: '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => createDefaultProfile(null));
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUserProfile(createDefaultProfile(null));
      return;
    }

    const firestoreProfile = await fetchUserProfile(currentUser.uid);
    if (firestoreProfile) {
      setUserProfile(firestoreProfile);
      return;
    }

    const profile = createDefaultProfile(currentUser);
    await saveUserProfileToFirestore(profile);
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(true);
      loadProfile(currentUser)
        .catch((error: unknown) => {
          console.error('Failed to load user profile from Firestore:', error);
          setUserProfile(createDefaultProfile(currentUser));
        })
        .finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [loadProfile]);

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Sign in is required to update your profile.');
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfileToFirestore(updated);
    setUserProfile(updated);
  };

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
  };

  const appendUserSignature = (body: string): string => {
    if (userProfile.appendSignature === false) return body;
    return appendSignatureToEmail(body, userProfile.emailSignature);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userProfile,
        emailSignature: userProfile.emailSignature,
        updateUserProfile,
        signIn,
        signOut,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
