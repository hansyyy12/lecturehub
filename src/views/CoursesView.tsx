import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Course } from '../types';
import {
  BookOpen,
  Plus,
  Clock,
  MapPin,
  Calendar,
  Copy,
  Check,
  Edit,
  Trash2,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  Video,
  Users,
} from 'lucide-react';

interface CoursesViewProps {
  onSelectTab: (tab: string) => void;
  selectedCourseId?: string | null;
  onClearSelectedCourse?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onSelectTab,
  selectedCourseId,
  onClearSelectedCourse,
}) => {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    assignments,
    quizzes,
    meetings,
    createCourse,
    updateCourse,
    deleteCourse,
    registerStudentCourse,
  } = useData();

  const isAdmin = user?.role === 'admin';
  const isLecturer = user?.role === 'lecturer' || isAdmin;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [courseName, setCourseName] = useState('');
  const [courseLevel, setCourseLevel] = useState('Level 100');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('First Semester');
  const [days, setDays] = useState<string[]>(['Monday', 'Wednesday']);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('Lecture Hall A');

  // Student registration form
  const [regCode, setRegCode] = useState('');
  const [regFullName, setRegFullName] = useState(user?.name || '');
  const [regIndexNo, setRegIndexNo] = useState(user?.indexNo || '');
  const [regLevel, setRegLevel] = useState(user?.level || 'Level 100');
  const [regPhone, setRegPhone] = useState(user?.phone || '');
  const [regStatusMsg, setRegStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student enrollments
  const myEnrollments = enrollments.filter((e) => e.studentId === user?.uid);
  const myEnrolledIds = new Set(myEnrollments.map((e) => e.courseId));
  const myCourses = isAdmin
    ? courses
    : isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid || (!c.ownerId || c.ownerId === 'demo_lecturer_ama_mensah'))
    : courses.filter((c) => myEnrolledIds.has(c.id));

  const availableToRegister = !isLecturer
    ? courses.filter((c) => !myEnrolledIds.has(c.id))
    : [];

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeCourse = selectedCourseId
    ? courses.find((c) => c.id === selectedCourseId)
    : null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = (c?: Course) => {
    setSaveError(null);
    if (c) {
      setEditingCourse(c);
      setCourseName(c.name);
      setCourseLevel(c.level);
      setCourseCode(c.code);
      setSemester(c.semester || 'First Semester');
      setDays(c.days || ['Monday', 'Wednesday']);
      setStartDate(c.startDate || '2026-10-01');
      setEndDate(c.endDate || '2026-12-31');
      setStartTime(c.startTime || '08:00');
      setEndTime(c.endTime || '10:00');
      setLocation(c.location || '');
    } else {
      setEditingCourse(null);
      setCourseName('');
      setCourseLevel('Level 100');
      setCourseCode(`CRS-${Math.floor(100 + Math.random() * 900)}`);
      setSemester('First Semester');
      setDays(['Monday', 'Wednesday']);
      setStartDate('2026-10-01');
      setEndDate('2026-12-31');
      setStartTime('08:00');
      setEndTime('10:00');
      setLocation('Lecture Hall A');
    }
    setModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveError(null);
    setSaveLoading(true);

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          name: courseName.trim(),
          level: courseLevel,
          code: courseCode.trim().toUpperCase(),
          semester,
          days,
          startDate,
          endDate,
          startTime,
          endTime,
          location: location.trim(),
        });
      } else {
        await createCourse({
          ownerId: user.uid,
          ownerName: user.name,
          name: courseName.trim(),
          level: courseLevel,
          code: courseCode.trim().toUpperCase(),
          semester,
          days,
          startDate,
          endDate,
          startTime,
          endTime,
          location: location.trim(),
          attendanceMark: 2,
          quizWeight: 60,
          attendanceWeight: 20,
          assignmentWeight: 20,
          examMax: 100,
          caShare: 40,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save course to cloud database.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete course "${name}"?`)) {
      await deleteCourse(id);
    }
  };

  const handleRegisterCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatusMsg(null);
    const res = await registerStudentCourse(
      regCode,
      regFullName,
      regIndexNo,
      regLevel,
      regPhone
    );
    if (res.success) {
      setRegStatusMsg({ type: 'success', text: res.message });
      setRegCode('');
    } else {
      setRegStatusMsg({ type: 'error', text: res.message });
    }
  };

  const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // If a student is viewing course details
  if (activeCourse) {
    const courseAssignments = assignments.filter((a) => a.courseCode === activeCourse.code);
    const courseQuizzes = quizzes.filter((q) => q.courseCode === activeCourse.code);
    const courseMeetings = meetings.filter((m) => m.courseCode === activeCourse.code);

    return (
      <div className="space-y-6">
        <button
          onClick={onClearSelectedCourse}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        {/* Course Header */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-900">
              {activeCourse.level}
            </span>
            <span className="font-mono text-sm font-bold text-blue-200 bg-white/10 px-3 py-1 rounded-lg">
              Registration Code: {activeCourse.code}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold">{activeCourse.name}</h1>
          <p className="mt-1 text-xs md:text-sm text-blue-200/80">
            Lecturer: {activeCourse.ownerName || 'Course Instructor'} · {activeCourse.semester || 'First Semester'}
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-blue-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-300" />
              {(activeCourse.days || []).join(', ') || 'Teaching days not set'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              {activeCourse.startTime || '08:00'} – {activeCourse.endTime || '10:00'}
            </span>
            {activeCourse.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-300" />
                {activeCourse.location}
              </span>
            )}
          </div>
        </div>

        {/* Course Specific Tasks & Quizzes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assignments */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Course Assignments ({courseAssignments.length})
              </h3>
            </div>

            {courseAssignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No assignments posted for this course level yet.
              </div>
            ) : (
              <div className="space-y-3">
                {courseAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                      <span>{a.title}</span>
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        Due: {a.due}
                      </span>
                    </div>
                    {a.desc && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.desc}</p>
                    )}
                    <button
                      onClick={() => onSelectTab('student-work')}
                      className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Submit solution →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quizzes */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Live Quizzes & Exams ({courseQuizzes.length})
              </h3>
            </div>

            {courseQuizzes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active quizzes posted for this course level.
              </div>
            ) : (
              <div className="space-y-3">
                {courseQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                      <span>{q.title}</span>
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                        {q.duration} Mins
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {q.questions.length} questions · {q.questions.reduce((acc, curr) => acc + curr.marks, 0)} marks
                    </div>
                    <button
                      onClick={() => onSelectTab('student-work')}
                      className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Start / View results →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isLecturer ? 'Courses & Class Codes' : 'Course Catalog & Enrollment'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isLecturer
              ? 'Create course levels with unique registration codes for students.'
              : 'View your registered courses or enroll in a new class with the code from your lecturer.'}
          </p>
        </div>

        {isLecturer && (
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Course Level
          </button>
        )}
      </div>

      {/* Student: Quick Register Form */}
      {!isLecturer && (
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            Register for a Class
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Enter the exact course code provided by your lecturer (e.g. <code>GIS100-X7K</code> or <code>GIS400-P9M</code>).
          </p>

          {regStatusMsg && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-bold ${
                regStatusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {regStatusMsg.text}
            </div>
          )}

          <form onSubmit={handleRegisterCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GIS100-X7K"
                  value={regCode}
                  onChange={(e) => setRegCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Index Number
                </label>
                <input
                  type="text"
                  required
                  value={regIndexNo}
                  onChange={(e) => setRegIndexNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Level
                </label>
                <select
                  value={regLevel}
                  onChange={(e) => setRegLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                >
                  <option>Level 100</option>
                  <option>Level 200</option>
                  <option>Level 300</option>
                  <option>Level 400</option>
                  <option>Level 500</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Enroll into Course
            </button>
          </form>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myCourses.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            {isLecturer
              ? 'You have not created any course levels yet. Click "+ Add Course Level" above to begin.'
              : 'You have not registered for any courses yet. Enter a code above.'}
          </div>
        ) : (
          myCourses.map((c) => {
            const studentCount = enrollments.filter((e) => e.courseId === c.id).length;
            const courseAsgs = assignments.filter((a) => a.courseCode === c.code);

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {c.level}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                    {c.name}
                  </h3>
                  <small className="text-xs text-slate-400 block mb-4">
                    {c.semester || 'First Semester'} · {studentCount} enrolled student(s)
                  </small>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{(c.days || []).join(', ') || 'Days not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.startTime || '08:00'} – {c.endTime || '10:00'}</span>
                    </div>
                    {c.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  {isLecturer ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <button
                        onClick={() => onSelectTab('lecturer-classlist')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Class list & marks
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCreateModal(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                          title="Edit course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectTab('student-work')}
                      className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 text-center"
                    >
                      View Classwork & Quizzes →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Available Courses Catalog for Students */}
      {!isLecturer && availableToRegister.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Available Campus Courses ({availableToRegister.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse classes created by lecturers. Click &ldquo;Use Code &amp; Register&rdquo; to populate the code above.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableToRegister.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {c.level}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Lecturer: {c.ownerName || 'Course Instructor'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegCode(c.code);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-3 w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Use Code &amp; Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingCourse ? 'Edit Course Level' : 'Add New Course Level'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Specify the level, code, and timetable hours for this class.
            </p>

            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to GIS"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Level
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  >
                    <option>Level 100</option>
                    <option>Level 200</option>
                    <option>Level 300</option>
                    <option>Level 400</option>
                    <option>Level 500</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GIS100-X7K"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lecture Days
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allWeekDays.map((d) => {
                    const checked = days.includes(d);
                    return (
                      <label
                        key={d}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                          checked
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDays([...days, d]);
                            } else {
                              setDays(days.filter((item) => item !== d));
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span>{d.slice(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Lecture Hall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Block Room 4B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingCourse ? 'Save Changes' : 'Create Course Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
