import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  X,
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
  User,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';

interface QuickJumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}

export const QuickJumpModal: React.FC<QuickJumpModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const { user, isSuperAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isLecturer = user?.role === 'lecturer';

  const baseItems = isLecturer
    ? [
        { id: 'lecturer-dash', title: 'Dashboard', desc: 'Teaching overview & KPIs', icon: LayoutDashboard },
        { id: 'lecturer-courses', title: 'Courses & Codes', desc: 'Create course levels and registration codes', icon: BookOpen },
        { id: 'lecturer-timetable', title: 'My Timetable', desc: 'Weekly teaching schedule', icon: CalendarDays },
        { id: 'lecturer-announcements', title: 'Announcements', desc: 'Send alerts to enrolled students', icon: Bell },
        { id: 'lecturer-classlist', title: 'Class List & Results', desc: 'Attendance register and exam gradebook', icon: Users },
        { id: 'lecturer-work', title: 'Assignments & Quizzes', desc: 'Publish coursework and create live quizzes', icon: FileCheck2 },
        { id: 'lecturer-files', title: 'Course Files', desc: 'Upload lecture slides and reading documents', icon: FolderArchive },
        { id: 'lecturer-meet', title: 'Live Video Call', desc: 'Virtual classroom lecture', icon: Video },
        { id: 'lecturer-subs', title: 'Student Submissions', desc: 'Grade assignment files with feedback', icon: FileCheck2 },
        { id: 'budget-tracker', title: 'Campus Budget', desc: 'Financial planning and expenses', icon: WalletCards },
        { id: 'profile', title: 'Profile & Settings', desc: 'Account preferences & dark mode', icon: User },
      ]
    : [
        { id: 'student-dash', title: 'My Dashboard', desc: 'Learning hub & today classes', icon: LayoutDashboard },
        { id: 'student-courses', title: 'My Courses', desc: 'Registered course catalog', icon: BookOpen },
        { id: 'student-timetable', title: 'My Timetable', desc: 'Class schedules & lecture rooms', icon: CalendarDays },
        { id: 'student-announcements', title: 'Announcements', desc: 'Broadcast notices from your lecturers', icon: Bell },
        { id: 'student-work', title: 'Classwork & Quizzes', desc: 'Assignments and live online exams', icon: FileCheck2 },
        { id: 'student-marks', title: 'My Marks & CA', desc: 'Continuous assessment calculation & breakdown', icon: BookOpen },
        { id: 'student-files', title: 'My Study Files', desc: 'Course slides & study documents', icon: FolderArchive },
        { id: 'student-meet', title: 'Live Video Call', desc: 'Join online lecture room', icon: Video },
        { id: 'budget-tracker', title: 'Budget Tracker 🔥', desc: 'Personal finance & hostel expenses', icon: WalletCards },
        { id: 'student-cycle', title: 'Period Cycle Care', desc: 'Private menstrual health and fertility tracker', icon: HeartPulse },
        { id: 'student-settings', title: 'Register Course', desc: 'Enroll into new course with code', icon: PlusCircle },
      ];

  const items = isSuperAdmin
    ? [
        {
          id: 'admin-console',
          title: '👑 Super Admin God-Mode Console',
          desc: 'Institutional control, shadow impersonation, and master grades',
          icon: ShieldAlert,
        },
        ...baseItems,
      ]
    : baseItems;

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.desc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectTab(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelectTab, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 md:pt-24"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search dashboard, courses, timetable, budget..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No sections match your search "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold truncate">{item.title}</strong>
                      <small className="block text-[11px] text-slate-400 truncate">{item.desc}</small>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">↵</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate faster with keyboard</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↑</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↓</kbd> to move ·{' '}
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
};
