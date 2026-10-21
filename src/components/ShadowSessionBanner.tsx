import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, LogOut, ShieldAlert } from 'lucide-react';

interface ShadowSessionBannerProps {
  onExitToAdmin: () => void;
}

export const ShadowSessionBanner: React.FC<ShadowSessionBannerProps> = ({ onExitToAdmin }) => {
  const { impersonatingUser, stopImpersonation } = useAuth();

  if (!impersonatingUser) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white px-4 py-2.5 shadow-lg border-b border-amber-300/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center font-bold">
            <Eye className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wide text-amber-200">
              Stealth Shadow Session Active:
            </span>{' '}
            <span className="font-semibold text-white">
              Viewing as <strong>{impersonatingUser.name}</strong> ({impersonatingUser.role} &bull; {impersonatingUser.accountId || impersonatingUser.indexNo || impersonatingUser.email})
            </span>
            <span className="hidden md:inline text-white/70 ml-2">
              (Silent inspection mode: No notification was sent to this user)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              stopImpersonation();
              onExitToAdmin();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-xs transition-all border border-white/20 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-300" />
            Exit Shadow Session &amp; Return to Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};
