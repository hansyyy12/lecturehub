import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  BookOpen,
  Calendar,
  Users,
  FileText,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  TrendingUp,
  Wallet,
  Megaphone,
} from 'lucide-react';

interface LecturerDashboardProps {
  onSelectTab: (tab: string) => void;
  onOpenCreateCourse: () => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  onSelectTab,
  onOpenCreateCourse,
}) => {
  const { user } = useAuth();
  const { courses, enrollments, assignments, announcements, activeBudgetPlan } = useData();

  const myCourses = courses.filter((c) => c.ownerId === user?.uid);
  const myAssignments = assignments.filter((a) => a.ownerId === user?.uid);
  const enrolledCount = enrollments.filter((e) =>
    myCourses.some((c) => c.id === e.courseId)
  ).length;

  // Format today day
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = myCourses.filter((c) => (c.days || []).includes(todayName));

  // Compute upcoming schedule
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayIndex = daysOfWeek.indexOf(todayName);

  // Budget calculations
  const totalBudget = activeBudgetPlan.totalBudget || 5000;
  const totalOutflow = (activeBudgetPlan.items || []).reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const remainingBudget = totalBudget - totalOutflow;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c2468] via-[#102d7e] to-[#0a1a4a] p-6 md:p-8 text-white shadow-xl shadow-blue-900/15">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
              Lecturer Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name}! 👋
            </h1>
            <p className="mt-1 text-xs md:text-sm text-blue-200/80">
              Manage your academic courses, class lists, daily attendance registers, and continuous assessments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenCreateCourse}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Course Level
            </button>
            <button
              onClick={() => onSelectTab('lecturer-classlist')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/15 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-300" />
              Class Lists
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-cyan-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Course Levels</span>
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {myCourses.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">Distinct class sections</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-300 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {enrolledCount}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">Across all courses</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-pink-500 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Assignments</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {myAssignments.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">Published coursework</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Today's Sessions</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {todayClasses.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">{todayName} schedule</small>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Lectures */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Today's Classes · {todayName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lectures scheduled for today according to course level timings.
                </p>
              </div>
              <button
                onClick={() => onSelectTab('lecturer-timetable')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Full Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No lectures scheduled for {todayName}. Enjoy your research and grading day! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                        {course.code.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {course.name}
                          </strong>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {course.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.startTime || '08:00'} – {course.endTime || '10:00'}
                          </span>
                          {course.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {course.location}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                            {course.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectTab('lecturer-classlist')}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition whitespace-nowrap"
                    >
                      Take Attendance
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              Quick Management Shortcuts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Direct access to common tasks across your classes.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onSelectTab('lecturer-courses')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-blue-400 dark:hover:border-blue-500 transition hover:-translate-y-0.5"
              >
                <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
                <strong className="block text-xs font-bold text-slate-800 dark:text-white">
                  Courses & Codes
                </strong>
                <small className="text-[10px] text-slate-400">Class keys</small>
              </button>

              <button
                onClick={() => onSelectTab('lecturer-classlist')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-amber-400 dark:hover:border-amber-500 transition hover:-translate-y-0.5"
              >
                <Users className="w-5 h-5 text-amber-500 mb-2" />
                <strong className="block text-xs font-bold text-slate-800 dark:text-white">
                  Class Registers
                </strong>
                <small className="text-[10px] text-slate-400">Attendance & Marks</small>
              </button>

              <button
                onClick={() => onSelectTab('lecturer-announcements')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-purple-400 dark:hover:border-purple-500 transition hover:-translate-y-0.5"
              >
                <Megaphone className="w-5 h-5 text-purple-500 mb-2" />
                <strong className="block text-xs font-bold text-slate-800 dark:text-white">
                  Announcements
                </strong>
                <small className="text-[10px] text-slate-400">Send class updates</small>
              </button>

              <button
                onClick={() => onSelectTab('lecturer-meet')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-400 dark:hover:border-emerald-500 transition hover:-translate-y-0.5"
              >
                <Clock className="w-5 h-5 text-emerald-500 mb-2" />
                <strong className="block text-xs font-bold text-slate-800 dark:text-white">
                  Live Classroom
                </strong>
                <small className="text-[10px] text-slate-400">Virtual lecture</small>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Budget Snapshot */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Campus Budget
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeBudgetPlan.name}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <small className="text-[11px] text-slate-400 block">Total Budget</small>
                <strong className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                  {activeBudgetPlan.currency || 'GH₵'} {totalBudget.toLocaleString()}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <small className="text-[11px] text-slate-400 block">Remaining</small>
                <strong
                  className={`text-sm font-bold font-mono ${
                    remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {activeBudgetPlan.currency || 'GH₵'} {remainingBudget.toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('budget-tracker')}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              Open Budget Tracker <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Course Announcements */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Recent Announcements
              </h3>
              <button
                onClick={() => onSelectTab('lecturer-announcements')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No announcements sent yet. Post an announcement to update your students.
              </div>
            ) : (
              <div className="space-y-2.5">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                      <span>{a.title}</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        {a.courseCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {a.message}
                    </p>
                    <small className="text-[10px] text-slate-400 block mt-1">
                      Applies {a.appliesDate}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
