import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StudyFile } from '../types';
import {
  FolderArchive,
  Upload,
  Download,
  Share2,
  Trash2,
  FileText,
  Lock,
  Globe,
  Plus,
} from 'lucide-react';

export const StudyFilesView: React.FC = () => {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    studyFiles,
    uploadStudyFile,
    toggleShareFile,
    deleteStudyFile,
  } = useData();

  const isLecturer = user?.role === 'lecturer';
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');

  // Course listings
  const myCourses = isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid)
    : courses.filter((c) => enrollments.some((e) => e.studentId === user?.uid && e.courseId === c.id));
  const myCourseCodes = new Set(myCourses.map((c) => c.code.toUpperCase()));

  // Relevant files:
  // For lecturers: files uploaded by them
  // For students: files uploaded by them, OR files shared by lecturers for their enrolled courses
  const filteredFiles = studyFiles.filter((f) => {
    const isOwner = f.userId === user?.uid;
    const isSharedToMyCourse = f.shared && myCourseCodes.has(f.courseCode.toUpperCase());

    if (!isOwner && !isSharedToMyCourse) return false;
    if (activeCourseFilter !== 'all' && f.courseCode !== activeCourseFilter) return false;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        await uploadStudyFile(
          file.name,
          file.size,
          selectedCourseCode || myCourses[0]?.code || 'general',
          (ev.target?.result as string) || ''
        );
      };
      reader.readAsDataURL(file);
    }

    setUploadModalOpen(false);
  };

  const handleDownload = (file: StudyFile) => {
    if (file.fileData) {
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Downloading ${file.name}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const getFileBadge = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { label: 'PDF', color: 'bg-rose-100 text-rose-700' };
    if (ext === 'ppt' || ext === 'pptx') return { label: 'PPT', color: 'bg-amber-100 text-amber-700' };
    if (ext === 'doc' || ext === 'docx') return { label: 'DOC', color: 'bg-blue-100 text-blue-700' };
    return { label: 'FILE', color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isLecturer ? 'Course Slide Decks & Files' : 'Study Notes & Materials'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isLecturer
              ? 'Distribute lecture presentations and readings to enrolled classes.'
              : 'Access lecture notes and save your personal study summaries.'}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCourseCode(myCourses[0]?.code || 'general');
            setUploadModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Add Study File
        </button>
      </div>

      {/* Course Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCourseFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeCourseFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All Files ({studyFiles.length})
        </button>

        {myCourses.map((c) => {
          const isSelected = activeCourseFilter === c.code;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCourseFilter(c.code)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.name} ({c.level})
            </button>
          );
        })}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            No study files found. Upload lecture slides or notes to get started.
          </div>
        ) : (
          filteredFiles.map((file) => {
            const badge = getFileBadge(file.name);
            const isOwner = file.userId === user?.uid;

            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {file.courseCode}
                    </span>
                  </div>

                  <strong className="text-sm font-bold text-slate-800 dark:text-white block truncate mb-1">
                    {file.name}
                  </strong>
                  <div className="text-[11px] text-slate-400 space-y-0.5 mb-4">
                    <div>Size: {formatFileSize(file.size)}</div>
                    <div>Added: {file.addedAt}</div>
                    {file.uploaderName && <div>Uploader: {file.uploaderName}</div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>

                  <div className="flex items-center gap-1">
                    {isOwner && isLecturer && (
                      <button
                        onClick={() => toggleShareFile(file.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          file.shared
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={file.shared ? 'Shared with students' : 'Private file'}
                      >
                        {file.shared ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => deleteStudyFile(file.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div
          onClick={() => setUploadModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Upload Study Material
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select course level and upload PowerPoint, Word, or PDF file.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Associate Course
                </label>
                <select
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {myCourses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name} ({c.level} - {c.code})
                    </option>
                  ))}
                  <option value="general">General (No Course)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Choose File (.pptx, .docx, .pdf)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".ppt,.pptx,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
