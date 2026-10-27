import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchProfile, saveProfile } from '../services/localStorage';
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

interface ProfileContextType {
  localUser: { uid: string; displayName: string; email: string };
  userProfile: UserProfile;
  emailSignature: string;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  appendUserSignature: (body: string) => string;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const LOCAL_USER = { uid: 'local', displayName: '', email: '' };

function createDefaultProfile(): UserProfile {
  return {
    userId: 'local',
    emailSignature: 'Best regards,',
    senderName: '',
    senderTitle: '',
    company: '',
  };
}

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => createDefaultProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    const savedProfile = await fetchProfile();
    if (savedProfile) {
      setUserProfile(savedProfile);
      return;
    }

    const profile = createDefaultProfile();
    await saveProfile(profile);
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    loadProfile().catch((error: unknown) => {
      console.error('Failed to load local profile:', error);
    });
  }, [loadProfile]);

  useEffect(() => {
    const resetProfile = () => setUserProfile(createDefaultProfile());
    window.addEventListener('echocrm:local-data-cleared', resetProfile);
    return () => window.removeEventListener('echocrm:local-data-cleared', resetProfile);
  }, []);

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      userId: 'local',
      updatedAt: new Date().toISOString(),
    };
    await saveProfile(updated);
    setUserProfile(updated);
  };

  const appendUserSignature = (body: string): string => {
    if (userProfile.appendSignature === false) return body;
    return appendSignatureToEmail(body, userProfile.emailSignature);
  };

  return (
    <ProfileContext.Provider
      value={{
        localUser: LOCAL_USER,
        userProfile,
        emailSignature: userProfile.emailSignature,
        updateUserProfile,
        isProfileModalOpen,
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        appendUserSignature,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
}
