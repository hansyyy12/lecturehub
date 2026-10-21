import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Assignment, Submission } from '../types';
import {
  FileCheck2,
  Upload,
  Plus,
  Clock,
  Calendar,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

import { QuizzesView } from './QuizzesView';

export const AssignmentsView: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    assignments,
    submissions,
    postAssignment,
    submitAssignment,
    gradeSubmission,
  } = useData();

  const isAdmin = user?.role === 'admin';
  const isLecturer = user?.role === 'lecturer' || isAdmin;
  const [workTab, setWorkTab] = useState<'assignments' | 'quizzes'>('assignments');

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);

  // Form states for creating assignment
  const [asgCourseCode, setAsgCourseCode] = useState('');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgType, setAsgType] = useState<'Assignment' | 'Quiz' | 'Project'>('Assignment');
  const [asgDue, setAsgDue] = useState('2026-10-30');
  const [asgDesc, setAsgDesc] = useState('');

  // Form state for student submission
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Form state for grading
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [gradeMark, setGradeMark] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Relevant assignments
  const myCourses = isAdmin
    ? courses
    : isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid || (!c.ownerId || c.ownerId === 'demo_lecturer_ama_mensah'))
    : courses.filter((c) => enrollments.some((e) => e.studentId === user?.uid && e.courseId === c.id));
  const myCourseCodes = new Set(myCourses.map((c) => c.code.toUpperCase()));

  const filteredAssignments = isAdmin
    ? assignments
    : myCourses.length > 0
    ? assignments.filter((a) => myCourseCodes.has(a.courseCode.toUpperCase()))
    : assignments;

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await postAssignment({
      ownerId: user.uid,
      courseCode: asgCourseCode || myCourses[0]?.code || 'GIS100-X7K',
      type: asgType,
      title: asgTitle.trim(),
      due: asgDue,
      desc: asgDesc.trim(),
    });
    setCreateModalOpen(false);
    setAsgTitle('');
    setAsgDesc('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setSelectedFileType(file.name.split('.').pop() || 'doc');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedFileDataUrl((ev.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !selectedFileName) {
      alert('Please attach a document or solution file.');
      return;
    }
    await submitAssignment(
      activeAssignment.id,
      selectedFileName,
      selectedFileType,
      selectedFileDataUrl,
      submissionNotes
    );
    setSubmitModalOpen(false);
    setSelectedFileName('');
    setSubmissionNotes('');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    await gradeSubmission(activeSubmission.id, gradeMark, gradeFeedback);
    setGradingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation for Assignments & Live Quizzes */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setWorkTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            workTab === 'assignments'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Coursework & Assignments ({filteredAssignments.length})
        </button>
        <button
          onClick={() => setWorkTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            workTab === 'quizzes'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Live Quizzes & Timed Tests
        </button>
      </div>

      {workTab === 'quizzes' ? (
        <QuizzesView />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isLecturer ? 'Coursework & Assignment Submissions' : 'Classwork & Assignments'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {isLecturer
                  ? 'Publish coursework, review student files, and provide graded feedback.'
                  : 'Upload your completed papers, docx, or pdf assignments.'}
              </p>
            </div>

            {isLecturer && (
              <button
                onClick={() => {
                  setAsgCourseCode(myCourses[0]?.code || '');
                  setCreateModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Publish Assignment
              </button>
            )}
          </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            No coursework or assignments currently published for your classes.
          </div>
        ) : (
          filteredAssignments.map((asg) => {
            const courseSubs = submissions.filter((s) => s.assignmentId === asg.id);
            const mySubmission = submissions.find(
              (s) => s.assignmentId === asg.id && s.studentId === user?.uid
            );

            return (
              <div
                key={asg.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {asg.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {asg.courseCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                    {asg.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {asg.due}</span>
                  </div>

                  {asg.desc && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                      {asg.desc}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  {isLecturer ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        {courseSubs.length} Submissions
                      </span>
                      <button
                        onClick={() => {
                          if (courseSubs.length > 0) {
                            setActiveSubmission(courseSubs[0]);
                            setGradeMark(courseSubs[0].mark ? String(courseSubs[0].mark) : '');
                            setGradeFeedback(courseSubs[0].feedback || '');
                            setGradingModalOpen(true);
                          } else {
                            alert('No student submissions yet for this assignment.');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition"
                      >
                        Review Submissions ({courseSubs.length})
                      </button>
                    </div>
                  ) : (
                    <div>
                      {mySubmission ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {mySubmission.status}
                            </span>
                            {mySubmission.mark && (
                              <span className="font-mono text-blue-600">
                                Mark: {mySubmission.mark} / 100
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            File: {mySubmission.fileName}
                          </span>
                          {mySubmission.feedback && (
                            <p className="text-[11px] text-slate-500 mt-1 italic">
                              Feedback: "{mySubmission.feedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveAssignment(asg);
                            setSelectedFileName('');
                            setSubmitModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload & Submit
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

      {/* Lecturer: Submissions Table if any exist */}
      {isLecturer && (
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Student Submissions Feed
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Attached File</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status & Mark</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {sub.studentName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {sub.courseCode}
                      </td>
                      <td className="py-3 px-4">{sub.itemTitle}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        📎 {sub.fileName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{sub.submissionDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'Graded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status}: {sub.mark ? `${sub.mark}/100` : 'Unmarked'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveSubmission(sub);
                            setGradeMark(sub.mark ? String(sub.mark) : '');
                            setGradeFeedback(sub.feedback || '');
                            setGradingModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          Grade / Feedback
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Publish New Coursework
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter assignment details for enrolled students.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code
                  </label>
                  <select
                    value={asgCourseCode}
                    onChange={(e) => setAsgCourseCode(e.target.value)}
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
                    Type
                  </label>
                  <select
                    value={asgType}
                    onChange={(e) => setAsgType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Project">Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vector Spatial Distribution Map"
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={asgDue}
                  onChange={(e) => setAsgDue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instructions & Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details on required format, questions, or deliverables..."
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Publish Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student: Upload & Submit Modal */}
      {submitModalOpen && activeAssignment && (
        <div
          onClick={() => setSubmitModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Submit Work: {activeAssignment.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Course: {activeAssignment.courseCode} · Due {activeAssignment.due}
            </p>

            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Document File (.docx, .pdf, .pptx)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFileName && (
                  <small className="text-emerald-600 font-bold block mt-1.5">
                    ✓ Attached: {selectedFileName}
                  </small>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes for Lecturer (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Any comments, methodology explanations, or link references..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  Submit Solution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecturer: Grade & Feedback Modal */}
      {gradingModalOpen && activeSubmission && (
        <div
          onClick={() => setGradingModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Grade Submission: {activeSubmission.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Assignment: {activeSubmission.itemTitle} · File: {activeSubmission.fileName}
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Numerical Mark (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  placeholder="e.g. 85"
                  value={gradeMark}
                  onChange={(e) => setGradeMark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lecturer Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide constructive feedback, critique, and commendation..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  Save Grade & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
