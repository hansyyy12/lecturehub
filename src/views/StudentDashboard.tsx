import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  Megaphone,
  HeartPulse,
  Wallet,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectTab: (tab: string) => void;
  onOpenCourseDetail: (courseId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectTab,
  onOpenCourseDetail,
}) => {
  const { user } = useAuth();
  const { courses, enrollments, announcements, assignments, quizzes, cycleData, activeBudgetPlan } =
    useData();

  // Find courses student is enrolled in
  const myEnrollments = enrollments.filter((e) => e.studentId === user?.uid);
  const myEnrolledCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const myCourses = courses.filter((c) => myEnrolledCourseIds.has(c.id));

  // Today's classes
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = myCourses.filter((c) => (c.days || []).includes(todayName));

  // Announcements matching enrolled courses
  const myCourseCodes = new Set(myCourses.map((c) => c.code.trim().toUpperCase()));
  const relevantAnnouncements = announcements.filter(
    (a) => !a.courseCode || myCourseCodes.has(a.courseCode.trim().toUpperCase())
  );
  const latestAnnouncement = relevantAnnouncements[0];

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
              Student Workspace · {user?.level || 'Level 200'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name}! 👋
            </h1>
            <p className="mt-1 text-xs md:text-sm text-blue-200/80">
              Index: <b className="text-white">{user?.indexNo || 'UE12345'}</b> · Account ID:{' '}
              <b className="text-white">{user?.accountId || 'STU-102'}</b>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectTab('student-settings')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Course
            </button>
            <button
              onClick={() => onSelectTab('student-marks')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/15 transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-blue-300" />
              My Marks & CA
            </button>
          </div>
        </div>
      </div>

      {/* Latest Announcement Alert */}
      {latestAnnouncement && (
        <div
          onClick={() => onSelectTab('student-announcements')}
          className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start justify-between gap-3 cursor-pointer hover:border-blue-400 transition"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {latestAnnouncement.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/60 dark:bg-blue-800/60 font-mono text-blue-800 dark:text-blue-200 font-bold">
                  {latestAnnouncement.courseCode}
                </span>
              </div>
              <p className="text-xs text-blue-800/80 dark:text-blue-300/80 line-clamp-1 mt-0.5">
                {latestAnnouncement.message}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1 flex-shrink-0 mt-1">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-cyan-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Registered Courses</span>
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {myCourses.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">In your study program</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Today's Classes</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {todayClasses.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">{todayName}</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-pink-500 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Work & Quizzes</span>
            <FileCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
            {assignments.length + quizzes.length}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">Available coursework</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 to-amber-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Cycle Care</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white truncate">
            {cycleData?.lastStart ? `${cycleData.cycleLength || 28}d Cycle` : 'Private'}
          </div>
          <small className="text-[11px] text-slate-400 font-medium">Personal health tracking</small>
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
                  Attend your live lectures and on-campus practical sessions.
                </p>
              </div>
              <button
                onClick={() => onSelectTab('student-timetable')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No classes scheduled for today. Check your study notes or budget tracker! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => onOpenCourseDetail(course.id)}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition"
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
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Courses Grid */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  My Registered Courses ({myCourses.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a course to view assignments, live quizzes, and files.
                </p>
              </div>
              <button
                onClick={() => onSelectTab('student-settings')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                + Register <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myCourses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                You haven't registered for any courses yet.
                <button
                  onClick={() => onSelectTab('student-settings')}
                  className="mt-3 block mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Enter Course Registration Code
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {myCourses.map((course) => {
                  const courseAsgs = assignments.filter((a) => a.courseCode === course.code);
                  const courseQuizzes = quizzes.filter((q) => q.courseCode === course.code);

                  return (
                    <div
                      key={course.id}
                      onClick={() => onOpenCourseDetail(course.id)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer hover:-translate-y-0.5 bg-white dark:bg-slate-800/80 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          {course.level}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {course.code}
                        </span>
                      </div>
                      <strong className="text-sm font-bold text-slate-800 dark:text-white block truncate mb-1">
                        {course.name}
                      </strong>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{courseAsgs.length} assignments</span>
                        <span>·</span>
                        <span>{courseQuizzes.length} quizzes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Period Cycle Care Widget */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Cycle Care
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Private student reproductive health
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-full">
                Protected
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-100 dark:border-rose-900/40 mb-3">
              <div className="text-xs text-rose-900 dark:text-rose-200 font-bold mb-1">
                Typical Cycle Length
              </div>
              <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                {cycleData?.cycleLength || 28} Days
              </div>
              <small className="text-[11px] text-rose-700/80 dark:text-rose-300/80 block mt-0.5">
                Last period logged: {cycleData?.lastStart || 'Not recorded'}
              </small>
            </div>

            <button
              onClick={() => onSelectTab('student-cycle')}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              Open Cycle Tracker <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Budget Widget */}
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
        </div>
      </div>
    </div>
  );
};
