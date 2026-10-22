import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserProfile, Course, UserRole } from '../types';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Award,
  Megaphone,
  Radio,
  Search,
  Filter,
  UserCheck,
  Eye,
  LogOut,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  GraduationCap,
  Calendar,
  Layers,
  Share2,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { ShareModal } from '../components/ShareModal';

interface AdminSuperConsoleViewProps {
  onSelectTab: (tab: string) => void;
}

export const AdminSuperConsoleView: React.FC<AdminSuperConsoleViewProps> = ({ onSelectTab }) => {
  const {
    user,
    allUsers,
    startImpersonation,
    updateUserByAdmin,
    deleteUserByAdmin,
    isSuperAdmin,
  } = useAuth();

  const {
    courses,
    enrollments,
    announcements,
    assignments,
    submissions,
    quizzes,
    createCourse,
    updateCourse,
    deleteCourse,
    sendAnnouncement,
    markExam,
    dbStatus,
  } = useData();

  const [activeSection, setActiveSection] = useState<'users' | 'courses' | 'grades' | 'broadcast' | 'system'>('users');
  const [shareOpen, setShareOpen] = useState(false);

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'lecturer' | 'admin'>('all');

  // Edit User Modal
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editIndexNo, setEditIndexNo] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add User Modal
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newIndexNo, setNewIndexNo] = useState('');
  const [newLevel, setNewLevel] = useState('Level 100');
  const [newPhone, setNewPhone] = useState('');

  // Edit Grade Modal
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [newExamScore, setNewExamScore] = useState<number | ''>('');

  // Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchQuery =
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.indexNo || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.accountId || '').toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [allUsers, userSearch, roleFilter]);

  const handleStartEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'student');
    setEditIndexNo(u.indexNo || '');
    setEditLevel(u.level || '');
    setEditPhone(u.phone || '');
    setEditUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUserByAdmin(editingUser.uid, {
      name: editName,
      email: editEmail,
      role: editRole,
      indexNo: editRole === 'student' ? editIndexNo : '',
      level: editRole === 'student' ? editLevel : '',
      phone: editPhone,
    });
    setEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = `user_${Date.now()}`;
    const newUser: UserProfile = {
      uid,
      name: newName,
      email: newEmail,
      role: newRole,
      indexNo: newRole === 'student' ? newIndexNo : '',
      level: newRole === 'student' ? newLevel : '',
      phone: newPhone,
      accountId: (newRole === 'student' ? 'STU-' : newRole === 'lecturer' ? 'LEC-' : 'ADM-') + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString(),
    };
    await updateUserByAdmin(uid, newUser);
    setAddUserModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewIndexNo('');
    setNewPhone('');
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    await sendAnnouncement({
      courseCode: 'CAMPUS-WIDE',
      courseName: 'Office of the Vice-Chancellor / Super Admin',
      title: broadcastTitle,
      message: broadcastMessage,
      appliesDate: new Date().toISOString().slice(0, 10),
      author: user?.name || 'Super Admin',
      authorId: user?.uid || 'super_admin_hans',
    });
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleSaveGradeOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId) return;
    await markExam(selectedEnrollmentId, newExamScore === '' ? null : Number(newExamScore));
    setGradeModalOpen(false);
    setSelectedEnrollmentId('');
    setNewExamScore('');
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 text-white border border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              Super Admin God-Mode Console
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Institutional Master Control Hub
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              Complete oversight of LectureHub. Monitor real-time Firestore database state, inspect or switch into any student or lecturer account seamlessly, override academic marks, and dispatch campus directives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onSelectTab('lecturer-dash')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
            >
              <BookOpen className="w-4 h-4" />
              Lecturer Portal View
            </button>
            <button
              onClick={() => onSelectTab('student-dash')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30"
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal View
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-400/20"
            >
              <Share2 className="w-4 h-4" />
              Share with Mobile / Device
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Directory Users</span>
            <span className="text-2xl md:text-3xl font-extrabold text-white">{allUsers.length}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Academic Courses</span>
            <span className="text-2xl md:text-3xl font-extrabold text-amber-400">{courses.length}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Enrollments</span>
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-400">{enrollments.length}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Live Cloud DB</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-sm font-bold text-white uppercase">{dbStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeSection === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Roster & Stealth Impersonation ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveSection('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeSection === 'courses'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Institutional Courses ({courses.length})
        </button>

        <button
          onClick={() => setActiveSection('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeSection === 'grades'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Master Continuous Assessment & Grades
        </button>

        <button
          onClick={() => setActiveSection('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeSection === 'broadcast'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Campus Broadcast Dispatcher
        </button>

        <button
          onClick={() => setActiveSection('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeSection === 'system'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Security & Database Health
        </button>
      </div>

      {/* SECTION 1: USERS & STEALTH IMPERSONATION */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold block">Stealth Shadow Mode Enabled</span>
              Clicking <strong>&quot;Enter Shadow Session&quot;</strong> instantly shifts the app into that user&apos;s identity. You can inspect their enrolled courses, registered attendance, quiz results, and private budget/cycle records. An unobtrusive floating bar allows you to exit back to the Super Admin console anytime without alerting the target account.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, index no, or account ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                {(['all', 'student', 'lecturer', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      roleFilter === r
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setAddUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-4">User Identity</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Identifiers</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4 text-right">Stealth &amp; Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const isCurrent = user?.uid === u.uid;
                    return (
                      <tr key={u.uid} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                              u.role === 'admin'
                                ? 'bg-gradient-to-tr from-amber-500 to-rose-500'
                                : u.role === 'lecturer'
                                ? 'bg-gradient-to-tr from-indigo-600 to-blue-500'
                                : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                            }`}>
                              {u.name?.slice(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                                {u.name}
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold uppercase">
                                    Current
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40'
                              : u.role === 'lecturer'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-0.5 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 block">
                              ID: <strong className="text-slate-800 dark:text-slate-200">{u.accountId || 'N/A'}</strong>
                            </span>
                            {u.indexNo && (
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Index: <strong className="text-slate-800 dark:text-slate-200">{u.indexNo}</strong>
                              </span>
                            )}
                            {u.level && (
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Level: <strong className="text-slate-800 dark:text-slate-200">{u.level}</strong>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                          {u.phone || 'No phone set'}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Stealth Impersonate Button */}
                            {!isCurrent && (
                              <button
                                onClick={() => {
                                  startImpersonation(u);
                                  onSelectTab(u.role === 'lecturer' ? 'lecturer-dash' : 'student-dash');
                                }}
                                title="Log in as this user silently (Shadow Session)"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Enter Shadow Session
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleStartEditUser(u)}
                              title="Edit user details"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            {!isCurrent && u.email !== 'hansyyy12@gmail.com' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user ${u.name}?`)) {
                                    deleteUserByAdmin(u.uid);
                                  }
                                }}
                                title="Delete user"
                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INSTITUTIONAL COURSES */}
      {activeSection === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Institutional Course Catalog ({courses.length} Active Offerings)
            </h3>
            <button
              onClick={() => onSelectTab('lecturer-courses')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Course Offering
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              const enrolledCount = enrollments.filter((e) => e.courseId === c.id || e.courseCode === c.code).length;
              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {c.level}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {c.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lecturer: <strong className="text-slate-800 dark:text-slate-200">{c.ownerName || 'Dr. Ama Mensah'}</strong>
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2">
                      <div>Schedule: {c.days?.join(', ') || 'Mon, Wed'} ({c.startTime || '08:00'} - {c.endTime || '10:00'})</div>
                      <div>Venue: {c.location || 'Lecture Hall'}</div>
                      <div>Continuous Assessment Share: {c.caShare || 40}%</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {enrolledCount} Students Enrolled
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete course ${c.code}?`)) {
                          deleteCourse(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: MASTER CONTINUOUS ASSESSMENT & GRADES */}
      {activeSection === 'grades' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300">
            <span className="font-bold block text-sm mb-1">Institutional Grade Registry</span>
            View student assessment outcomes across all active classes. Super Admin can inspect continuous assessment (CA) marks, attendance metrics, and override final examination marks.
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Student Name &amp; Index</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Attendance Recorded</th>
                    <th className="px-5 py-4">Exam Score</th>
                    <th className="px-5 py-4 text-right">Override Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {enrollments.map((e) => {
                    const presentCount = Object.values(e.attendance || {}).filter((v) => v === 'Present').length;
                    const totalSessions = Object.keys(e.attendance || {}).length || 1;
                    const attRate = Math.round((presentCount / totalSessions) * 100);
                    const examScore = e.marks?.exam_main ?? 'Not Entered';

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{e.fullName}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{e.indexNo} &bull; {e.level}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{e.courseCode}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{e.courseName}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{presentCount} sessions</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">Rate: {attRate}%</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {examScore}
                            {typeof examScore === 'number' && ' / 100'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedEnrollmentId(e.id);
                              setNewExamScore(typeof e.marks?.exam_main === 'number' ? e.marks.exam_main : '');
                              setGradeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Override Mark
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: BROADCAST DISPATCHER */}
      {activeSection === 'broadcast' && (
        <div className="max-w-3xl space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Dispatch University-Wide Directive
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This notice will be published as an institutional directive across every student and lecturer dashboard immediately.
              </p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Directive successfully broadcast to all campus portals!
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Examination Schedule & Mid-Semester Notice"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed directive or announcement body..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30"
                >
                  <Megaphone className="w-4 h-4" />
                  Publish Campus Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 5: SECURITY & DATABASE HEALTH */}
      {activeSection === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Firebase Security Rules &amp; Health
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Firestore Cloud Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{dbStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Security Invariants:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Fortress Level 2 (Deployed)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Super Admin Account:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">hansyyy12@gmail.com</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Stealth Impersonation Engine:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Zero-Audit Shadow Active</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Real-Time Document Inventory
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-400 uppercase">Courses</span>
                <span className="text-xl font-extrabold block text-slate-900 dark:text-white">{courses.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-400 uppercase">Enrollments</span>
                <span className="text-xl font-extrabold block text-slate-900 dark:text-white">{enrollments.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-400 uppercase">Assignments</span>
                <span className="text-xl font-extrabold block text-slate-900 dark:text-white">{assignments.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-400 uppercase">Live Quizzes</span>
                <span className="text-xl font-extrabold block text-slate-900 dark:text-white">{quizzes.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              Edit Account: {editingUser.name}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              {editRole === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                      Index Number
                    </label>
                    <input
                      type="text"
                      value={editIndexNo}
                      onChange={(e) => setEditIndexNo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                      Academic Level
                    </label>
                    <select
                      value={editLevel}
                      onChange={(e) => setEditLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <option value="Level 100">Level 100</option>
                      <option value="Level 200">Level 200</option>
                      <option value="Level 300">Level 300</option>
                      <option value="Level 400">Level 400</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              Add New Campus Account
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@hub.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              {newRole === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                      Index Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UE49102"
                      value={newIndexNo}
                      onChange={(e) => setNewIndexNo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                      Academic Level
                    </label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <option value="Level 100">Level 100</option>
                      <option value="Level 200">Level 200</option>
                      <option value="Level 300">Level 300</option>
                      <option value="Level 400">Level 400</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+233 24 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Override Modal */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
              Super Admin Grade Override
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the revised final examination mark for this student (0 - 100).
            </p>
            <form onSubmit={handleSaveGradeOverride} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Examination Score (Max 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 85"
                  value={newExamScore}
                  onChange={(e) => setNewExamScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setGradeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
                >
                  Update Student Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};
