import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  HelpCircle,
  Timer,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';

export const QuizzesView: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    quizzes,
    quizAttempts,
    createQuiz,
    submitQuizAttempt,
    gradeManualQuizAttempt,
    setQuizRelease,
  } = useData();

  const isLecturer = user?.role === 'lecturer';

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalQuiz, setReviewModalQuiz] = useState<Quiz | null>(null);
  const [activeTakingQuiz, setActiveTakingQuiz] = useState<Quiz | null>(null);

  // Taking quiz state
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Create quiz form state
  const [qCourseCode, setQCourseCode] = useState('');
  const [qTitle, setQTitle] = useState('');
  const [qDuration, setQDuration] = useState(20);
  const [qRelease, setQRelease] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q_1',
      text: 'Which UTM zone covers southern Ghana?',
      type: 'multiple-choice',
      options: ['Zone 29N', 'Zone 30N', 'Zone 31N', 'Zone 32N'],
      answer: 'Zone 30N',
      marks: 5,
    },
    {
      id: 'q_2',
      text: 'Raster models represent continuous spatial surfaces.',
      type: 'true-false',
      options: ['True', 'False'],
      answer: 'True',
      marks: 5,
    },
  ]);

  // Lecturer courses & enrolled courses
  const isAdmin = user?.role === 'admin';
  const myCourses = isAdmin
    ? courses
    : isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid || (!c.ownerId || c.ownerId === 'demo_lecturer_ama_mensah'))
    : courses.filter((c) => enrollments.some((e) => e.studentId === user?.uid && e.courseId === c.id));
  const myCourseCodes = new Set(myCourses.map((c) => c.code.toUpperCase()));

  const filteredQuizzes = isAdmin
    ? quizzes
    : myCourses.length > 0
    ? quizzes.filter((q) => myCourseCodes.has(q.courseCode.toUpperCase()))
    : quizzes;

  // Timer countdown while student is taking quiz
  useEffect(() => {
    if (!activeTakingQuiz || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTakingQuiz, secondsRemaining]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveTakingQuiz(quiz);
    setStudentAnswers({});
    setSecondsRemaining((quiz.duration || 20) * 60);
  };

  const handleSubmitQuiz = async (auto = false) => {
    if (!activeTakingQuiz) return;
    await submitQuizAttempt(activeTakingQuiz.id, studentAnswers, auto);
    setActiveTakingQuiz(null);
    if (auto) {
      alert('Time expired. Your quiz answers were automatically submitted to Firestore.');
    }
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'multiple-choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: '',
      marks: 2,
    };
    setQuestions([...questions, newQ]);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (questions.some((q) => !q.text.trim() || !q.answer.trim())) {
      alert('Please fill out all question texts and answer keys.');
      return;
    }

    await createQuiz({
      ownerId: user.uid,
      courseCode: qCourseCode || myCourses[0]?.code || 'GIS100-X7K',
      title: qTitle.trim(),
      duration: Number(qDuration) || 20,
      releaseResults: qRelease,
      questions,
    });

    setCreateModalOpen(false);
    setQTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isLecturer ? 'Live Quizzes & Examinations' : 'Online Quizzes & Exams'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isLecturer
              ? 'Create timed in-app assessments with automatic and manual grading.'
              : 'Take timed tests for your enrolled courses and review your continuous assessment marks.'}
          </p>
        </div>

        {isLecturer && (
          <button
            onClick={() => {
              setQCourseCode(myCourses[0]?.code || '');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Live Quiz
          </button>
        )}
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            No live quizzes or exams currently scheduled.
          </div>
        ) : (
          filteredQuizzes.map((quiz) => {
            const attempts = quizAttempts.filter((a) => a.quizId === quiz.id);
            const myAttempt = quizAttempts.find(
              (a) => a.quizId === quiz.id && a.studentId === user?.uid
            );
            const totalMarks = quiz.questions.reduce((acc, curr) => acc + curr.marks, 0);

            return (
              <div
                key={quiz.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      Live Quiz
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {quiz.courseCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                      <Timer className="w-3.5 h-3.5" />
                      {quiz.duration} Minutes
                    </span>
                    <span>·</span>
                    <span>{quiz.questions.length} Questions</span>
                    <span>·</span>
                    <span>{totalMarks} Marks</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  {isLecturer ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        {attempts.length} attempts
                      </span>
                      <button
                        onClick={() => setReviewModalQuiz(quiz)}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition cursor-pointer"
                      >
                        Review Results ({attempts.length})
                      </button>
                    </div>
                  ) : (
                    <div>
                      {myAttempt?.submittedAt ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                            </span>
                            {quiz.releaseResults && myAttempt.score !== null ? (
                              <span className="font-mono text-purple-600 text-sm">
                                {myAttempt.score} / {myAttempt.maxScore} marks
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                Results hidden
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Timer className="w-3.5 h-3.5" /> Start Quiz Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Taking Quiz Full-Screen / Modal */}
      {activeTakingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Bar */}
            <div className="p-4 md:p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                  {activeTakingQuiz.courseCode} · Live Exam
                </span>
                <h3 className="text-base font-extrabold">{activeTakingQuiz.title}</h3>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 font-mono text-sm font-extrabold text-amber-300">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <span>
                  {Math.floor(secondsRemaining / 60)}:
                  {String(secondsRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Questions list */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activeTakingQuiz.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">
                      Question {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                      {q.marks} Mark(s)
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    {q.text}
                  </p>

                  {/* Options */}
                  {q.type === 'multiple-choice' || q.type === 'true-false' ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            studentAnswers[q.id] === opt
                              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 text-purple-900 dark:text-purple-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`answer_${q.id}`}
                            value={opt}
                            checked={studentAnswers[q.id] === opt}
                            onChange={(e) =>
                              setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })
                            }
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      placeholder="Type your explanation or concise response..."
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) =>
                        setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-400">
                Answered: {Object.keys(studentAnswers).length} / {activeTakingQuiz.questions.length}
              </span>
              <button
                onClick={() => handleSubmitQuiz(false)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Submit Completed Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecturer: Review Results Modal */}
      {reviewModalQuiz && (
        <div
          onClick={() => setReviewModalQuiz(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Results: {reviewModalQuiz.title}
                </h3>
                <span className="text-xs text-slate-400">
                  Course: {reviewModalQuiz.courseCode} ·{' '}
                  {quizAttempts.filter((a) => a.quizId === reviewModalQuiz.id).length} Submissions
                </span>
              </div>

              {/* Release Toggle */}
              <button
                onClick={() =>
                  setQuizRelease(reviewModalQuiz.id, !reviewModalQuiz.releaseResults)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  reviewModalQuiz.releaseResults
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {reviewModalQuiz.releaseResults ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Results Released
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Results Hidden
                  </>
                )}
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-3">
              {quizAttempts
                .filter((a) => a.quizId === reviewModalQuiz.id)
                .map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <strong className="block text-sm font-bold text-slate-800 dark:text-white">
                        {attempt.studentName || 'Student'}
                      </strong>
                      <small className="text-xs text-slate-400">
                        Objective Score: {attempt.objectiveScore} / {attempt.maxScore}
                      </small>
                    </div>

                    <div className="flex items-center gap-3">
                      {attempt.needsManual ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Add mark"
                            className="w-20 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900 font-mono"
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                gradeManualQuizAttempt(
                                  attempt.id,
                                  val,
                                  attempt.objectiveScore || 0
                                );
                              }
                            }}
                          />
                          <span className="text-[11px] text-amber-600 font-bold">Manual mark needed</span>
                        </div>
                      ) : (
                        <span className="font-mono text-base font-extrabold text-purple-600 dark:text-purple-400">
                          {attempt.score} / {attempt.maxScore}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReviewModalQuiz(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {createModalOpen && (
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create Live In-App Quiz / Exam
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add multiple choice, true/false, or short answer questions with points.
            </p>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Level
                  </label>
                  <select
                    value={qCourseCode}
                    onChange={(e) => setQCourseCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    {myCourses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name} ({c.level} - {c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={qDuration}
                    onChange={(e) => setQDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz / Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Semester Spatial Coordinates Exam"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Questions Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Questions ({questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          Question {idx + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuestions(questions.filter((item) => item.id !== q.id))
                            }
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Enter question text..."
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].text = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Type
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].type = e.target.value as any;
                              if (e.target.value === 'true-false') {
                                updated[idx].options = ['True', 'False'];
                              }
                              setQuestions(updated);
                            }}
                            className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-800"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True / False</option>
                            <option value="short-answer">Short Answer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            required
                            value={q.marks}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].marks = Number(e.target.value);
                              setQuestions(updated);
                            }}
                            className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      {q.type === 'multiple-choice' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={q.options.join(', ')}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].options = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              setQuestions(updated);
                            }}
                            className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-800"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Zone 30N or True"
                          value={q.answer}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].answer = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full p-2 rounded-lg border text-xs bg-white dark:bg-slate-800 text-emerald-700 font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Save & Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
