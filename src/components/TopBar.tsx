import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Menu, Search, Moon, Sun, Bell, Cloud, Database } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onOpenSidebar: () => void;
  onOpenQuickJump: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectTab: (tab: string) => void;
}

const TAB_TITLES: Record<string, string> = {
  'admin-console': '👑 Super Admin God-Mode Console',
  'lecturer-dash': 'Dashboard',
  'lecturer-courses': 'Courses & Registration Codes',
  'lecturer-timetable': 'My Teaching Timetable',
  'lecturer-announcements': 'Course Announcements',
  'lecturer-classlist': 'Class List, Attendance & Results',
  'lecturer-work': 'Assignments & Live Quizzes',
  'lecturer-files': 'Course Study Files',
  'lecturer-meet': 'Live Video Classroom',
  'lecturer-subs': 'Student Submissions',
  'budget-tracker': 'Smart Dynamic Budgeting',
  'student-dash': 'My Dashboard',
  'student-courses': 'My Registered Courses',
  'student-timetable': 'My Class Schedule',
  'student-announcements': 'Course Announcements',
  'student-work': 'Classwork & Quizzes',
  'student-marks': 'Continuous Assessment & Marks',
  'student-files': 'My Study Files',
  'student-meet': 'Live Video Classroom',
  'student-cycle': 'Period Cycle Care Tracker',
  'student-settings': 'Course Registration',
  'profile': 'Profile & Preferences',
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenSidebar,
  onOpenQuickJump,
  theme,
  onToggleTheme,
  onSelectTab,
}) => {
  const { user, isSuperAdmin } = useAuth();
  const { announcements, dbStatus } = useData();

  const title = TAB_TITLES[currentTab] || 'LectureHub Workspace';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 h-16 md:h-18 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:block">
            {user?.role === 'lecturer' ? 'Lecturer Portal' : 'Student Portal'}
          </div>
          <h2 className="text-base md:text-xl font-bold text-slate-800 dark:text-white truncate leading-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Super Admin Quick Button */}
        {isSuperAdmin && (
          <button
            onClick={() => onSelectTab('admin-console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'admin-console'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span>👑 God-Mode</span>
          </button>
        )}

        {/* Firebase Live Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 shadow-2xs">
          <Database className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Firebase Real-time</span>
        </div>

        {/* Quick Jump Search */}
        <button
          onClick={onOpenQuickJump}
          className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          title="Quick Jump (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Jump</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Announcement Bell */}
        <button
          onClick={() =>
            onSelectTab(user?.role === 'lecturer' ? 'lecturer-announcements' : 'student-announcements')
          }
          className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          title="Announcements"
        >
          <Bell className="w-4 h-4" />
          {announcements.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {announcements.length > 9 ? '9+' : announcements.length}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
        </button>

        {/* Today Label */}
        <span className="hidden xl:inline text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          {todayFormatted}
        </span>

        {/* Avatar */}
        <button
          onClick={() => onSelectTab('profile')}
          className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-900 text-amber-300 font-bold text-xs flex items-center justify-center shadow-md shadow-blue-900/20 ring-2 ring-white dark:ring-slate-900 cursor-pointer"
          title="User Profile"
        >
          {user?.name?.slice(0, 2).toUpperCase() || 'LH'}
        </button>
      </div>
    </header>
  );
};
