import React, { useState, useEffect } from 'react';
import {
  Mic,
  History,
  PlusCircle,
  Sliders,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { ScrollProgressBar } from './visuals/ScrollProgressBar';

interface NavbarProps {
  currentView: 'landing' | 'new' | 'history' | 'results';
  onNavigate: (view: 'landing' | 'new' | 'history') => void;
  onUseSampleDirectly: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onUseSampleDirectly,
}) => {
  const { openProfileModal } = useProfile();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Sticky Glass Top Bar */}
      <header
        className={`sticky top-0 z-30 transition-all duration-200 glass-header ${
          isScrolled ? 'glass-header-scrolled py-0' : 'py-0.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73D9] rounded-xl py-1 px-1.5 transition-colors cursor-pointer"
          >
            <div className="logo-3d w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A73D9] to-[#7FB8F2] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(26,115,217,0.4)] group-hover:shadow-[0_8px_22px_rgba(26,115,217,0.5)]">
              <Mic className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A] group-hover:text-[#1A73D9] transition-colors whitespace-nowrap">
                EchoCRM
              </span>
              <span className="text-[10px] text-[#5B6B7F] -mt-1 font-medium hidden sm:inline">
                Voice Client Debriefs
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/70 border border-white/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_8px_rgba(26,115,217,0.04)] backdrop-blur-md rounded-2xl text-xs font-semibold text-[#5B6B7F]">
            <button
              onClick={() => onNavigate('new')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'new'
                  ? 'bg-[#1A73D9] text-white shadow-[0_2px_8px_rgba(26,115,217,0.3)]'
                  : 'hover:text-[#0F172A] hover:bg-white/90'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Debrief</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-[#1A73D9] text-white shadow-[0_2px_8px_rgba(26,115,217,0.3)]'
                  : 'hover:text-[#0F172A] hover:bg-white/90'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Debrief History</span>
            </button>

            <button
              onClick={onUseSampleDirectly}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:text-[#1A73D9] hover:bg-white/90 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1A73D9]" />
              <span>Try Sample Note</span>
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'landing'
                  ? 'bg-white text-[#1A73D9] shadow-2xs font-bold'
                  : 'hover:text-[#0F172A] hover:bg-white/90'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How it Works</span>
            </button>
          </nav>

          {/* Zone 3: Settings & Auth Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(
              <>
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white/80 border border-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_3px_rgba(26,115,217,0.06)] rounded-xl hover:bg-white hover:text-[#1A73D9] hover:border-[#1A73D9]/20 transition-all cursor-pointer min-h-[36px]"
                  title="Configure Profile, Signature & Preferences"
                  aria-label="Settings"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#1A73D9]" />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white/80 border border-white/90 shadow-2xs p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={openProfileModal}
                    className="flex items-center gap-2 text-xs text-[#0F172A] hover:text-[#1A73D9] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="View & Edit Profile / Signature"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span className="font-semibold max-w-[120px] truncate">
                      Profile
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scroll progress rail */}
        <ScrollProgressBar />
      </header>

      {/* Mobile Floating Glass Bottom Dock (< 768px) */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40 pointer-events-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto flex items-center justify-around p-1.5 bg-white/90 backdrop-blur-xl border border-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_12px_36px_rgba(26,115,217,0.18)] rounded-2xl"
        >
          <button
            onClick={() => onNavigate('landing')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
              currentView === 'landing' ? 'text-[#1A73D9] bg-[#F3F9FF]' : 'text-[#5B6B7F]'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onNavigate('new')}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              currentView === 'new'
                ? 'text-white bg-[#1A73D9] shadow-[0_2px_8px_rgba(26,115,217,0.35)]'
                : 'text-[#1A73D9] bg-[#E4F1FF]'
            }`}
          >
            <Mic className="w-4 h-4 mb-0.5" />
            <span>Dictate</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
              currentView === 'history' ? 'text-[#1A73D9] bg-[#F3F9FF]' : 'text-[#5B6B7F]'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>Ledger</span>
          </button>

          {(
            <button
              onClick={openProfileModal}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold text-[#5B6B7F] hover:text-[#1A73D9] transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 mb-0.5" />
              <span>Settings</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
