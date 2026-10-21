import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, CalendarDays, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenSidebar,
}) => {
  const { user } = useAuth();
  const isLecturer = user?.role === 'lecturer';

  const homeTab = isLecturer ? 'lecturer-dash' : 'student-dash';
  const coursesTab = isLecturer ? 'lecturer-courses' : 'student-courses';
  const timetableTab = isLecturer ? 'lecturer-timetable' : 'student-timetable';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectTab(homeTab)}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === homeTab
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onSelectTab(coursesTab)}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === coursesTab || currentTab === 'student-course-detail'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px]">Courses</span>
      </button>

      <button
        onClick={() => onSelectTab(timetableTab)}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === timetableTab
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span className="text-[10px]">Timetable</span>
      </button>

      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px]">More</span>
      </button>
    </nav>
  );
};
