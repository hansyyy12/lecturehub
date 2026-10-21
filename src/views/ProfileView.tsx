import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  User,
  Mail,
  GraduationCap,
  Phone,
  Hash,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  Edit2,
  Check,
} from 'lucide-react';

interface ProfileViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ theme, onToggleTheme }) => {
  const { user, updateProfile, logout } = useAuth();
  const { dbStatus } = useData();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [level, setLevel] = useState(user?.level || 'Level 200');
  const [indexNo, setIndexNo] = useState(user?.indexNo || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      level,
      indexNo: indexNo.trim(),
    });
    setSavedSuccess(true);
    setEditMode(false);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Account Profile & Preferences
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Manage your student or lecturer credentials, appearance, and backend connectivity.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Profile updated and synchronized to Firebase!
        </div>
      )}

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-amber-300 font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            {user?.name?.slice(0, 2).toUpperCase() || 'LH'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {user?.name}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="capitalize font-bold text-blue-600 dark:text-blue-400">
                {user?.role}
              </span>
              <span>·</span>
              <span>Account ID: {user?.accountId || 'USR-101'}</span>
            </div>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              {user?.role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option>Level 100</option>
                    <option>Level 200</option>
                    <option>Level 300</option>
                    <option>Level 400</option>
                    <option>Level 500</option>
                  </select>
                </div>
              )}
            </div>

            {user?.role === 'student' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Index Number
                </label>
                <input
                  type="text"
                  required
                  value={indexNo}
                  onChange={(e) => setIndexNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.email}
              </span>
            </div>

            {user?.role === 'student' && (
              <>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Index Number
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user?.indexNo || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Academic Level
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.level || 'Level 100'}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Phone
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.phone || 'Not provided'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences & Connectivity */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Preferences & Connectivity
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Color Theme
            </strong>
            <small className="text-[11px] text-slate-400">
              Toggle between light and dark visual themes.
            </small>
          </div>
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            <span className="capitalize">{theme} mode</span>
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Firestore Cloud Database
            </strong>
            <small className="text-[11px] text-slate-400">
              Enterprise edition with zero-trust security rules.
            </small>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" /> Secure Sign Out
        </button>
      </div>
    </div>
  );
};
