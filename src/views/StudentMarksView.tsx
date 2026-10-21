import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const StudentMarksView: React.FC = () => {
  const { user } = useAuth();
  const { courses, enrollments, quizzes, quizAttempts, assignments, submissions } = useData();

  const myEnrollments =
    user?.role === 'admin' && !enrollments.some((e) => e.studentId === user?.uid)
      ? enrollments
      : enrollments.filter((e) => e.studentId === user?.uid);
  const enrolledCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const myCourses = courses.filter((c) => enrolledCourseIds.has(c.id));

  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const activeCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];
  const activeEnrollment = myEnrollments.find((e) => e.courseId === activeCourse?.id);

  const marksData = useMemo(() => {
    if (!activeCourse || !activeEnrollment) return null;

    const courseCode = activeCourse.code.toUpperCase();

    const courseQuizzes = quizzes
      .filter((q) => q.courseCode.toUpperCase() === courseCode)
      .map((q) => {
        const attempt = quizAttempts.find(
          (a) => a.quizId === q.id && a.studentId === user?.uid && a.submittedAt
        );
        const max = q.questions.reduce((sum, item) => sum + item.marks, 0);
        const isReleased = attempt && q.releaseResults && attempt.score !== null;

        return {
          id: q.id,
          title: q.title,
          max,
          score: isReleased ? attempt.score : null,
          status: isReleased
            ? 'Released'
            : attempt
            ? attempt.needsManual
              ? 'Awaiting Marking'
              : 'Results Hidden'
            : 'Not Taken',
        };
      });

    const courseAssignments = assignments
      .filter((a) => a.courseCode.toUpperCase() === courseCode)
      .map((a) => {
        const sub = submissions.find(
          (s) => s.assignmentId === a.id && s.studentId === user?.uid
        );
        const isGraded = sub?.status === 'Graded' && sub.mark !== null && sub.mark !== undefined;

        return {
          id: a.id,
          title: a.title,
          due: a.due,
          mark: isGraded ? Number(sub.mark) : null,
          feedback: sub?.feedback || '',
          status: isGraded ? 'Graded' : sub ? 'Submitted' : 'Not Submitted',
        };
      });

    const attEntries = Object.entries(activeEnrollment.attendance || {}).filter(([_, s]) =>
      ['Present', 'Absent', 'Late'].includes(s)
    );
    const presentCount = attEntries.filter(([_, s]) => s === 'Present').length;
    const totalSessions = attEntries.length;
    const attPct = totalSessions > 0 ? (presentCount / totalSessions) * 100 : null;

    const completedQuizzes = courseQuizzes.filter((q) => q.score !== null);
    const quizEarned = completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    const quizMax = completedQuizzes.reduce((sum, q) => sum + q.max, 0);
    const quizPct = quizMax > 0 ? (quizEarned / quizMax) * 100 : null;

    const completedAsgs = courseAssignments.filter((a) => a.mark !== null);
    const asgPct =
      completedAsgs.length > 0
        ? completedAsgs.reduce((sum, a) => sum + (a.mark || 0), 0) / completedAsgs.length
        : null;

    const weights: [number, number][] = [];
    if (quizPct !== null) weights.push([quizPct, Number(activeCourse.quizWeight ?? 60)]);
    if (attPct !== null) weights.push([attPct, Number(activeCourse.attendanceWeight ?? 20)]);
    if (asgPct !== null) weights.push([asgPct, Number(activeCourse.assignmentWeight ?? 20)]);

    const totalWeight = weights.reduce((acc, w) => acc + w[1], 0);
    const ca = totalWeight > 0 ? weights.reduce((acc, w) => acc + w[0] * w[1], 0) / totalWeight : null;

    return {
      courseQuizzes,
      courseAssignments,
      attEntries,
      presentCount,
      totalSessions,
      attPct,
      quizPct,
      asgPct,
      ca,
    };
  }, [activeCourse, activeEnrollment, quizzes, quizAttempts, assignments, submissions, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          My Continuous Assessment & Marks
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Real-time grades, quiz scores, assignment feedback, and lecture attendance percentages.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {myCourses.map((c) => {
          const isSelected = activeCourse?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.name} · {c.level}
            </button>
          );
        })}
      </div>

      {activeCourse && marksData ? (
        <>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-100 dark:stroke-slate-700 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-blue-600 fill-none transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={
                    marksData.ca !== null ? 264 - (264 * Math.min(100, marksData.ca)) / 100 : 264
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {marksData.ca !== null ? `${marksData.ca.toFixed(1)}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Course CA</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeCourse.name} ({activeCourse.level})
                </h3>
                <span
                  className={`text-xs font-bold ${
                    marksData.ca === null
                      ? 'text-slate-400'
                      : marksData.ca >= 70
                      ? 'text-emerald-600'
                      : marksData.ca >= 50
                      ? 'text-blue-600'
                      : 'text-rose-600'
                  }`}
                >
                  ●{' '}
                  {marksData.ca === null
                    ? 'No marks released yet'
                    : marksData.ca >= 70
                    ? 'Excellent standing'
                    : marksData.ca >= 50
                    ? 'On track'
                    : 'Requires attention'}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Quizzes</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {marksData.quizPct !== null ? `${marksData.quizPct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${marksData.quizPct || 0}%` }}
                      className="h-full bg-purple-600 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Assignments</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {marksData.asgPct !== null ? `${marksData.asgPct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${marksData.asgPct || 0}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Lecture Attendance</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {marksData.attPct !== null ? `${marksData.attPct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${marksData.attPct || 0}%` }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quizzes & Tests
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Quiz Title</th>
                    <th className="py-2.5 px-4">Your Score</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {marksData.courseQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No quizzes scheduled for this course.
                      </td>
                    </tr>
                  ) : (
                    marksData.courseQuizzes.map((q) => (
                      <tr key={q.id}>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                          {q.title}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-600">
                          {q.score !== null ? `${q.score} / ${q.max}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === 'Released'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Coursework & Assignments
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Assignment Title</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4">Mark</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Lecturer Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {marksData.courseAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No assignments for this course.
                      </td>
                    </tr>
                  ) : (
                    marksData.courseAssignments.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                          {a.title}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{a.due}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {a.mark !== null ? `${a.mark} / 100` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.status === 'Graded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                          {a.feedback || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          Enroll in a course to view continuous assessment grades and marks.
        </div>
      )}
    </div>
  );
};
