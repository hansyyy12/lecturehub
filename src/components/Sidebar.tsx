import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bell,
  Users,
  FileCheck2,
  FolderArchive,
  Video,
  WalletCards,
  HeartPulse,
  LogOut,
  X,
  PlusCircle,
  HelpCircle,
  User,
  GraduationCap,
  ShieldAlert,
  Share2,
} from 'lucide-react';
import { ShareModal } from './ShareModal';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isLecturer = user?.role === 'lecturer';

  const [shareOpen, setShareOpen] = useState(false);

  const adminTabs = [
    { id: 'admin-console', label: '👑 Super Admin Console', icon: ShieldAlert },
    { id: 'lecturer-dash', label: 'Lecturer Dashboard', icon: LayoutDashboard },
    { id: 'student-dash', label: 'Student Dashboard', icon: GraduationCap },
    { id: 'lecturer-courses', label: 'Courses Master', icon: BookOpen },
    { id: 'lecturer-classlist', label: 'Class Lists & Results', icon: Users },
    { id: 'lecturer-announcements', label: 'Announcements', icon: Bell },
    { id: 'budget-tracker', label: 'Budget Tracker', icon: WalletCards },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  const lecturerTabs = [
    ...(isSuperAdmin ? [{ id: 'admin-console', label: '👑 Super Admin Console', icon: ShieldAlert }] : []),
    { id: 'lecturer-dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lecturer-courses', label: 'Courses & Codes', icon: BookOpen },
    { id: 'lecturer-timetable', label: 'My Timetable', icon: CalendarDays },
    { id: 'lecturer-announcements', label: 'Announcements', icon: Bell },
    { id: 'lecturer-classlist', label: 'Class List & Results', icon: Users },
    { id: 'lecturer-work', label: 'Assignments & Quizzes', icon: FileCheck2 },
    { id: 'lecturer-files', label: 'Course Files', icon: FolderArchive },
    { id: 'lecturer-meet', label: 'Live Video Call', icon: Video },
    { id: 'lecturer-subs', label: 'Submissions', icon: FileCheck2 },
    { id: 'budget-tracker', label: 'Campus Budget', icon: WalletCards },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  const studentTabs = [
    ...(isSuperAdmin ? [{ id: 'admin-console', label: '👑 Super Admin Console', icon: ShieldAlert }] : []),
    { id: 'student-dash', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'student-courses', label: 'My Courses', icon: BookOpen },
    { id: 'student-timetable', label: 'My Timetable', icon: CalendarDays },
    { id: 'student-announcements', label: 'Announcements', icon: Bell },
    { id: 'student-work', label: 'Classwork & Quizzes', icon: FileCheck2 },
    { id: 'student-marks', label: 'My Marks & CA', icon: GraduationCap },
    { id: 'student-files', label: 'My Study Files', icon: FolderArchive },
    { id: 'student-meet', label: 'Live Video Call', icon: Video },
    { id: 'budget-tracker', label: 'Budget Tracker 🔥', icon: WalletCards },
    { id: 'student-cycle', label: 'Period Cycle Care', icon: HeartPulse },
    { id: 'student-settings', label: 'Register Course', icon: PlusCircle },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  const tabs = isAdmin && user?.role === 'admin' ? adminTabs : isLecturer ? lecturerTabs : studentTabs;

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0b1b3f] to-[#061026] text-white flex flex-col justify-between p-4 md:p-5 border-r border-blue-900/30 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#0a1f5c] flex items-center justify-center font-extrabold text-xl shadow-md shadow-amber-400/20">
                L
              </div>
              <div>
                <strong className="text-base font-bold text-white tracking-tight block">
                  LectureHub
                </strong>
                <small className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  {isLecturer ? 'Lecturer Portal' : 'Student Workspace'}
                </small>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden text-white/60 hover:text-white p-1 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User pill */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-amber-400 text-[#0a1f5c] flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'LH'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{user?.name || 'Welcome'}</div>
              <div className="text-[11px] text-blue-200/60 truncate font-medium">
                {isLecturer ? 'Lecturer' : user?.level ? `${user.level} · ${user.indexNo || ''}` : 'Student'}
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div className="mb-2">
            <div className="text-[10px] font-extrabold tracking-widest text-blue-300/50 uppercase px-3 mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-blue-300/70'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Share with Phone / Device</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>

          <div className="px-3 pt-2 text-[11px] text-blue-300/40 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore Live Sync
            </span>
            <span className="text-[10px]">v2.6</span>
          </div>
        </div>
      </aside>

      {/* Share Modal */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
};
