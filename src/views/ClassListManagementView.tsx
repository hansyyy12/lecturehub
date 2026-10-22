import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Course, Enrollment } from '../types';
import {
  Users,
  Calendar,
  Download,
  Printer,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const ClassListManagementView: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    quizzes,
    quizAttempts,
    submissions,
    markAttendance,
    markExam,
    updateCourseSettings,
  } = useData();

  const isAdmin = user?.role === 'admin';
  const myCourses = isAdmin
    ? courses
    : courses.filter((c) => c.ownerId === user?.uid || (!c.ownerId || c.ownerId === 'demo_lecturer_ama_mensah'));
  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const activeCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];

  const todayIso = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState<string>(todayIso);
  const [attHistoryStudent, setAttHistoryStudent] = useState<string>('all');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Settings State for active course
  const [attMarkPerSession, setAttMarkPerSession] = useState<number>(
    activeCourse?.attendanceMark ?? 2
  );
  const [quizWeight, setQuizWeight] = useState<number>(activeCourse?.quizWeight ?? 60);
  const [attWeight, setAttWeight] = useState<number>(activeCourse?.attendanceWeight ?? 20);
  const [asgWeight, setAsgWeight] = useState<number>(activeCourse?.assignmentWeight ?? 20);
  const [examMax, setExamMax] = useState<number>(activeCourse?.examMax ?? 100);
  const [caShare, setCaShare] = useState<number>(activeCourse?.caShare ?? 40);

  // Synchronize settings when switching course
  React.useEffect(() => {
    if (activeCourse) {
      setAttMarkPerSession(activeCourse.attendanceMark ?? 2);
      setQuizWeight(activeCourse.quizWeight ?? 60);
      setAttWeight(activeCourse.attendanceWeight ?? 20);
      setAsgWeight(activeCourse.assignmentWeight ?? 20);
      setExamMax(activeCourse.examMax ?? 100);
      setCaShare(activeCourse.caShare ?? 40);
    }
  }, [activeCourse?.id]);

  // Students enrolled in this course
  const classStudents = useMemo(() => {
    if (!activeCourse) return [];
    return enrollments.filter(
      (e) =>
        e.courseId === activeCourse.id ||
        (Boolean(e.courseCode && activeCourse.code) &&
          e.courseCode.trim().toUpperCase() === activeCourse.code.trim().toUpperCase())
    );
  }, [enrollments, activeCourse?.id, activeCourse?.code]);

  // Course Quizzes
  const courseQuizzes = useMemo(() => {
    if (!activeCourse) return [];
    return quizzes.filter((q) => q.courseCode.toUpperCase() === activeCourse.code.toUpperCase());
  }, [quizzes, activeCourse?.code]);

  // Calculations for CA and totals
  const studentStats = useMemo(() => {
    const stats: Record<
      string,
      {
        present: number;
        absent: number;
        late: number;
        sessions: number;
        attPct: number;
        quizEarned: number;
        quizMax: number;
        ca: number;
        examMark: number | null;
        total: number | null;
      }
    > = {};

    classStudents.forEach((st) => {
      // 1. Attendance
      const entries = Object.entries(st.attendance || {}).filter(([_, s]) =>
        ['Present', 'Absent', 'Late'].includes(s)
      );
      const present = entries.filter(([_, s]) => s === 'Present').length;
      const absent = entries.filter(([_, s]) => s === 'Absent').length;
      const late = entries.filter(([_, s]) => s === 'Late').length;
      const sessions = entries.length;
      const attPct = sessions > 0 ? (present / sessions) * 100 : 0;

      // 2. Quizzes
      let qEarned = 0;
      let qMax = 0;
      courseQuizzes.forEach((q) => {
        const att = quizAttempts.find(
          (a) => a.quizId === q.id && a.studentId === st.studentId && a.submittedAt
        );
        qMax += q.questions.reduce((sum, item) => sum + item.marks, 0);
        if (att && att.score !== null) {
          qEarned += Number(att.score) || 0;
        }
      });
      const quizPct = qMax > 0 ? (qEarned / qMax) * 100 : 0;

      // 3. Assignments
      const gradedSubs = submissions.filter(
        (sub) =>
          sub.courseCode.toUpperCase() === activeCourse?.code.toUpperCase() &&
          sub.studentId === st.studentId &&
          sub.status === 'Graded' &&
          sub.mark !== null &&
          sub.mark !== undefined
      );
      const asgPct =
        gradedSubs.length > 0
          ? gradedSubs.reduce((acc, curr) => acc + (Number(curr.mark) || 0), 0) /
            gradedSubs.length
          : 0;

      // Weighted CA calculation
      const weights: [number, number][] = [];
      if (qMax > 0) weights.push([quizPct, quizWeight]);
      if (sessions > 0) weights.push([attPct, attWeight]);
      if (gradedSubs.length > 0) weights.push([asgPct, asgWeight]);

      const totalWeight = weights.reduce((acc, w) => acc + w[1], 0);
      const ca = totalWeight > 0 ? weights.reduce((acc, w) => acc + w[0] * w[1], 0) / totalWeight : 0;

      // Exam
      const rawExam = st.marks?.exam_main;
      const hasExam = rawExam !== undefined && rawExam !== null && rawExam !== '';
      const examMark = hasExam ? Number(rawExam) : null;
      const examPct = hasExam ? (Number(rawExam) / examMax) * 100 : null;

      // Combined Total
      const total =
        examPct !== null
          ? (ca * caShare) / 100 + (examPct * (100 - caShare)) / 100
          : null;

      stats[st.id] = {
        present,
        absent,
        late,
        sessions,
        attPct,
        quizEarned: qEarned,
        quizMax: qMax,
        ca,
        examMark,
        total,
      };
    });

    return stats;
  }, [classStudents, courseQuizzes, quizAttempts, submissions, activeCourse, quizWeight, attWeight, asgWeight, examMax, caShare]);

  // Attendance summary on selected date
  const dateSummary = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    classStudents.forEach((st) => {
      const s = st.attendance?.[attendanceDate];
      if (s === 'Present') p++;
      else if (s === 'Absent') a++;
      else if (s === 'Late') l++;
    });
    return {
      present: p,
      absent: a,
      late: l,
      unmarked: classStudents.length - p - a - l,
    };
  }, [classStudents, attendanceDate]);

  // All recorded attendance dates
  const recordedDates = useMemo(() => {
    const set = new Set<string>();
    classStudents.forEach((st) => {
      Object.keys(st.attendance || {}).forEach((d) => set.add(d));
    });
    return Array.from(set).sort().reverse();
  }, [classStudents]);

  const handleShiftDate = (days: number) => {
    const d = new Date(attendanceDate);
    d.setDate(d.getDate() + days);
    setAttendanceDate(d.toISOString().slice(0, 10));
  };

  const handleMarkAllUnmarkedPresent = async () => {
    const unmarked = classStudents.filter((st) => !st.attendance?.[attendanceDate]);
    if (unmarked.length === 0) {
      alert('All students are already marked for this date.');
      return;
    }
    if (confirm(`Mark ${unmarked.length} student(s) as Present on ${attendanceDate}?`)) {
      for (const st of unmarked) {
        await markAttendance(st.id, attendanceDate, 'Present');
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!activeCourse) return;
    await updateCourseSettings(activeCourse.id, {
      attendanceMark: Number(attMarkPerSession),
      quizWeight: Number(quizWeight),
      attendanceWeight: Number(attWeight),
      assignmentWeight: Number(asgWeight),
      examMax: Number(examMax),
      caShare: Number(caShare),
    });
    setCopiedStatus('Settings saved to Firestore!');
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!activeCourse || classStudents.length === 0) return;

    const headers = [
      'Student Name',
      'Account ID',
      'Index Number',
      `Attendance (${attendanceDate})`,
      'Total Attendance',
      'Quiz Score',
      'CA (%)',
      `Exam Mark (out of ${examMax})`,
      'Total Combined Mark',
    ];

    const rows = classStudents.map((st) => {
      const s = studentStats[st.id] || {};
      return [
        `"${st.fullName}"`,
        `"${st.accountId || ''}"`,
        `"${st.indexNo || ''}"`,
        `"${st.attendance?.[attendanceDate] || 'Not marked'}"`,
        `"${s.present}/${s.sessions} (${Math.round(s.attPct || 0)}%)"`,
        `"${s.quizEarned}/${s.quizMax}"`,
        `"${(s.ca || 0).toFixed(1)}%"`,
        `"${s.examMark !== null ? s.examMark : '—'}"`,
        `"${s.total !== null ? s.total.toFixed(1) : 'Needs exam'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${activeCourse.name}_${activeCourse.level}_Class_Results_${attendanceDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Class List, Attendance & Results
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Real-time daily attendance registers, continuous assessment (CA) weighting, and exam gradebooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Course Level Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {myCourses.map((c) => {
          const isSelected = activeCourse?.id === c.id;
          const count = enrollments.filter((e) => e.courseId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>
                {c.name} ({c.level})
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                }`}
              >
                {count} students
              </span>
            </button>
          );
        })}
      </div>

      {activeCourse ? (
        <>
          {/* Assessment Settings Accordion */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Gradebook Weightings: {activeCourse.name} ({activeCourse.level})
                </h3>
                <p className="text-xs text-slate-400">
                  Configure assessment weights saved directly to Firestore.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {copiedStatus && (
                  <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                    {copiedStatus}
                  </span>
                )}
                <button
                  onClick={handleSaveSettings}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  Save Settings
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Marks per Session
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={attMarkPerSession}
                  onChange={(e) => setAttMarkPerSession(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Quiz Weight (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quizWeight}
                  onChange={(e) => setQuizWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Attendance Weight (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={attWeight}
                  onChange={(e) => setAttWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Assignment Weight (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={asgWeight}
                  onChange={(e) => setAsgWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Exam Max Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={examMax}
                  onChange={(e) => setExamMax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  CA Share in Total (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={caShare}
                  onChange={(e) => setCaShare(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono"
                />
              </div>
            </div>
            <small className="text-[11px] text-slate-400 block mt-2">
              Formula: Final Grade = (CA × {caShare}%) + (Exam% × {100 - caShare}%).
            </small>
          </div>

          {/* Date Picker Bar & Summary */}
          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Attendance Date:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  onClick={() => handleShiftDate(-1)}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-white px-2 py-1 focus:outline-none"
                />
                <button
                  onClick={() => handleShiftDate(1)}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {attendanceDate !== todayIso && (
                <button
                  onClick={() => setAttendanceDate(todayIso)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Jump to Today
                </button>
              )}

              <button
                onClick={handleMarkAllUnmarkedPresent}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
              >
                ✓ Mark Unmarked as Present
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                Present: {dateSummary.present}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold">
                Absent: {dateSummary.absent}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                Late: {dateSummary.late}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                Unmarked: {dateSummary.unmarked}
              </span>
            </div>
          </div>

          {/* Roster & Gradebook Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Account ID</th>
                    <th className="py-3 px-4">Index No</th>
                    <th className="py-3 px-4">
                      Attendance <br />
                      <span className="text-[10px] text-blue-600 lowercase font-medium">({attendanceDate})</span>
                    </th>
                    <th className="py-3 px-4">Attendance Total</th>
                    <th className="py-3 px-4">Quiz Score</th>
                    <th className="py-3 px-4">CA (%)</th>
                    <th className="py-3 px-4">
                      Exam Mark <br />
                      <span className="text-[10px] text-slate-400 lowercase font-medium">(out of {examMax})</span>
                    </th>
                    <th className="py-3 px-4">Total Combined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No students enrolled in this course yet. Students can register using code{' '}
                        <b className="text-blue-600 font-mono">{activeCourse.code}</b>.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((st) => {
                      const stat = studentStats[st.id] || {};
                      const currentStatus = st.attendance?.[attendanceDate] || '';

                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {st.fullName}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {st.accountId || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {st.indexNo || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                markAttendance(
                                  st.id,
                                  attendanceDate,
                                  e.target.value as 'Present' | 'Absent' | 'Late' | ''
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                                  : currentStatus === 'Absent'
                                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-700 dark:text-rose-300'
                                  : currentStatus === 'Late'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <option value="">Not marked</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold">
                              {stat.present}/{stat.sessions}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {stat.sessions > 0 ? `${Math.round(stat.attPct)}%` : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold">
                              {stat.quizEarned}/{stat.quizMax}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {stat.quizMax > 0
                                ? `${Math.round((stat.quizEarned / stat.quizMax) * 100)}%`
                                : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                            {(stat.ca || 0).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max={examMax}
                              step="0.5"
                              value={stat.examMark !== null ? stat.examMark : ''}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                markExam(st.id, val === '' ? null : Number(val));
                              }}
                              placeholder={`— / ${examMax}`}
                              className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-white"
                            />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {stat.total !== null ? (
                              <span
                                className={`font-extrabold text-sm font-mono ${
                                  stat.total >= 70
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : stat.total >= 50
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {stat.total.toFixed(1)} / 100
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Pending exam
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Attendance Matrix */}
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Historical Attendance Register
                </h3>
                <p className="text-xs text-slate-400">
                  Matrix of all recorded lecture dates for {activeCourse.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Student:</span>
                <select
                  value={attHistoryStudent}
                  onChange={(e) => setAttHistoryStudent(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-white"
                >
                  <option value="all">All Students (Full Matrix)</option>
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {recordedDates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700">
                No attendance dates recorded yet. Mark attendance above to build the history log.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-[10px]">
                      <th className="py-2.5 px-3 text-left">Student</th>
                      {recordedDates.map((d) => (
                        <th key={d} className="py-2.5 px-2 whitespace-nowrap">
                          <button
                            onClick={() => setAttendanceDate(d)}
                            className="hover:text-blue-600 hover:underline"
                            title="Click to view/edit this day"
                          >
                            {d.slice(5)}
                          </button>
                        </th>
                      ))}
                      <th className="py-2.5 px-3">Present</th>
                      <th className="py-2.5 px-3">Absent</th>
                      <th className="py-2.5 px-3">Late</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {classStudents
                      .filter(
                        (st) => attHistoryStudent === 'all' || st.id === attHistoryStudent
                      )
                      .map((st) => {
                        const s = studentStats[st.id] || {};
                        return (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <td className="py-2.5 px-3 text-left font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {st.fullName}
                            </td>
                            {recordedDates.map((d) => {
                              const stat = st.attendance?.[d];
                              return (
                                <td key={d} className="py-2.5 px-2">
                                  {stat === 'Present' ? (
                                    <span className="w-5 h-5 rounded-md inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                      P
                                    </span>
                                  ) : stat === 'Absent' ? (
                                    <span className="w-5 h-5 rounded-md inline-flex items-center justify-center bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                                      A
                                    </span>
                                  ) : stat === 'Late' ? (
                                    <span className="w-5 h-5 rounded-md inline-flex items-center justify-center bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                      L
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600">–</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 font-bold text-emerald-600">{s.present}</td>
                            <td className="py-2.5 px-3 font-bold text-rose-600">{s.absent}</td>
                            <td className="py-2.5 px-3 font-bold text-amber-600">{s.late}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          Create a course level first to manage class rosters and results.
        </div>
      )}
    </div>
  );
};
