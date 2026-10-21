import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export const TimetableView: React.FC = () => {
  const { user } = useAuth();
  const { courses, enrollments } = useData();
  const isLecturer = user?.role === 'lecturer';

  // Find user's courses
  const myEnrollments = enrollments.filter((e) => e.studentId === user?.uid);
  const myEnrolledCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const myCourses = isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid)
    : courses.filter((c) => myEnrolledCourseIds.has(c.id));

  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();
  };

  const dayCourses = myCourses
    .filter((c) => (c.days || []).includes(selectedDay))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isLecturer ? 'Teaching Schedule & Timetable' : 'Class Timetable'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Automatically organized based on course levels and teaching hours.
          </p>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {daysOfWeek.map((day) => {
          const count = myCourses.filter((c) => (c.days || []).includes(day)).length;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isSelected
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Schedule */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {selectedDay} Schedule
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {dayCourses.length} class session(s) scheduled for this day.
        </p>

        {dayCourses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700">
            No lectures or sessions scheduled for {selectedDay}.
          </div>
        ) : (
          <div className="space-y-4">
            {dayCourses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-blue-400 dark:hover:border-blue-500 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-blue-600/20 flex-shrink-0">
                    {c.code.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {c.level}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        ({c.code})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {c.startTime || '08:00'} – {c.endTime || '10:00'}
                      </span>
                      {getDuration(c.startTime, c.endTime) && (
                        <span>· {getDuration(c.startTime, c.endTime)}</span>
                      )}
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {c.location}
                        </span>
                      )}
                      <span>· {c.semester || 'First Semester'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start md:self-auto">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Teaching Period: {c.startDate || '2026-10-01'} to {c.endDate || '2026-12-31'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Week Overview Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Weekly Roster Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {daysOfWeek.map((day) => {
            const matches = myCourses.filter((c) => (c.days || []).includes(day));
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                  selectedDay === day
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700/70 bg-slate-50/40 dark:bg-slate-900/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {day.slice(0, 3)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {matches.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {matches.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="text-[10px] p-1 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 font-semibold truncate text-slate-800 dark:text-white"
                    >
                      {m.code.slice(0, 6)} ({m.startTime})
                    </div>
                  ))}
                  {matches.length > 2 && (
                    <div className="text-[9px] text-blue-600 font-bold">
                      +{matches.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
