import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Megaphone, Calendar, Send, Plus, CheckCircle2, Clock } from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { user } = useAuth();
  const { courses, enrollments, announcements, sendAnnouncement } = useData();
  const isLecturer = user?.role === 'lecturer';

  // Form states
  const [targetCourseId, setTargetCourseId] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [appliesDate, setAppliesDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const myCourses = isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid)
    : courses.filter((c) => enrollments.some((e) => e.studentId === user?.uid && e.courseId === c.id));
  const myCourseCodes = new Set(myCourses.map((c) => c.code.toUpperCase()));

  const relevantAnnouncements = isLecturer
    ? announcements.filter((a) => myCourseCodes.has(a.courseCode.toUpperCase()))
    : announcements.filter((a) => myCourseCodes.has(a.courseCode.toUpperCase()));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !annTitle.trim() || !annMessage.trim()) return;

    const chosenCourse = myCourses.find((c) => c.id === targetCourseId) || myCourses[0];
    if (!chosenCourse) return;

    setSubmitting(true);
    await sendAnnouncement({
      courseId: chosenCourse.id,
      courseCode: chosenCourse.code,
      courseName: chosenCourse.name,
      level: chosenCourse.level,
      title: annTitle.trim(),
      message: annMessage.trim(),
      appliesDate,
      author: user.name,
      authorId: user.uid,
    });

    setSubmitting(false);
    setSuccessMsg(true);
    setAnnTitle('');
    setAnnMessage('');
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Course Announcements
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {isLecturer
            ? 'Broadcast classroom venue changes, schedule updates, or reminders to enrolled students.'
            : 'Official broadcast messages from your lecturers for your enrolled courses.'}
        </p>
      </div>

      {isLecturer && (
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-600" />
            Send New Class Announcement
          </h3>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Announcement broadcast successfully and saved to Firebase!
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Course Level
                </label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                >
                  {myCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level} - {c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date this applies to
                </label>
                <input
                  type="date"
                  required
                  value={appliesDate}
                  onChange={(e) => setAppliesDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Venue Change for Friday Lecture"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message Body
              </label>
              <textarea
                rows={3}
                required
                placeholder="Write full details for students..."
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {isLecturer ? 'Sent Announcements' : 'Class Notices & Broadcasts'} ({relevantAnnouncements.length})
        </h3>

        {relevantAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            No announcements for your enrolled courses yet.
          </div>
        ) : (
          <div className="space-y-3">
            {relevantAnnouncements.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Megaphone className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                        {a.title}
                      </strong>
                      <small className="text-[11px] text-slate-400">
                        {a.courseName} · {a.level} · applies {a.appliesDate}
                      </small>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                    {a.courseCode}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {a.message}
                </p>

                <div className="text-[10px] text-slate-400 pt-1">
                  Sent by {a.author}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
