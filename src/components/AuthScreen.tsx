import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { GraduationCap, BookOpen, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, User, Lock, Mail, Phone, Hash, Share2, Smartphone, QrCode } from 'lucide-react';
import { ShareModal } from './ShareModal';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsDemo, loginAsAdminDemo, loginWithAdminCredentials } = useAuth();
  const [view, setView] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Sign In state
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIndexNo, setRegIndexNo] = useState('');
  const [regLevel, setRegLevel] = useState('Level 200');
  const [regPhone, setRegPhone] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmed = signinIdentifier.trim();
      // Check for administrator index number directly in student sign-in
      if (trimmed.toUpperCase() === 'LH-ADMIN-84729163') {
        await loginWithAdminCredentials(trimmed, signinPassword);
      } else {
        await loginWithEmail(trimmed, signinPassword, selectedRole);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(
        regEmail,
        regPassword,
        selectedRole,
        regName,
        selectedRole === 'student' ? regIndexNo : undefined,
        selectedRole === 'student' ? regLevel : undefined,
        regPhone
      );
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(role);
    } catch (err: any) {
      setError('Demo login initialization failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#050c22] text-white">
      {/* Hero Panel */}
      <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-between bg-gradient-to-br from-[#0c2468] via-[#091a48] to-[#04091e] relative overflow-hidden border-b md:border-b-0 md:border-r border-blue-900/30">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#0a1f5c] flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-amber-400/20">
              L
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">LectureHub</span>
              <span className="text-xs font-semibold text-blue-300 tracking-wider uppercase">Firebase Real-time Backend</span>
            </div>
          </div>

          <div className="mt-12 md:mt-20">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Class is in session, wherever you study.
            </h1>
            <p className="mt-4 text-base md:text-lg text-blue-200/80 max-w-lg leading-relaxed">
              Real-time Firestore persistence for courses, timetables, continuous assessments, live exams, campus budgeting, and reproductive health care.
            </p>

            {/* Role Cards in Hero */}
            <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-4 rounded-xl text-left border transition-all ${
                  selectedRole === 'student'
                    ? 'bg-blue-600/20 border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className={`w-5 h-5 ${selectedRole === 'student' ? 'text-amber-400' : 'text-blue-300'}`} />
                  <h4 className="font-bold text-sm text-white">I am a Student</h4>
                </div>
                <p className="text-xs text-blue-200/70">Classes, marks, study files & cycle tracker</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('lecturer')}
                className={`p-4 rounded-xl text-left border transition-all ${
                  selectedRole === 'lecturer'
                    ? 'bg-blue-600/20 border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className={`w-5 h-5 ${selectedRole === 'lecturer' ? 'text-amber-400' : 'text-blue-300'}`} />
                  <h4 className="font-bold text-sm text-white">I am a Lecturer</h4>
                </div>
                <p className="text-xs text-blue-200/70">Class lists, attendance, grading & live exams</p>
              </button>
            </div>

            {/* Quick Demo Launchers */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-3">
                ⚡ Instant Demo Personas (No Password Needed)
              </span>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await loginAsAdminDemo();
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-indigo-500/25 hover:from-amber-500/35 hover:to-indigo-500/35 border border-amber-400/50 text-amber-200 text-xs font-extrabold flex items-center justify-between transition shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    👑 Enter as Super Admin (hansyyy12@gmail.com)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black uppercase">
                    God-Mode
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('lecturer')}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Dr. Ama Mensah (Lecturer)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student')}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    Kofi Mensah (Student)
                  </button>
                </div>

                {/* Share Link with Another Device Button */}
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Share / Open on Phone or Another Device</span>
                  <QrCode className="w-3.5 h-3.5 text-blue-300 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-blue-300/60 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Enterprise Firestore Zero-Trust Security Active</span>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-1/2 p-6 md:p-14 bg-white text-slate-800 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {view === 'signin' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Welcome Back 👋</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Sign in as {selectedRole === 'student' ? 'a Student' : 'a Lecturer'} or choose another role.
                </p>
              </div>

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={() => loginWithGoogle(selectedRole)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center justify-center gap-3 transition mb-6 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  or sign in with credentials
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sign In Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setSelectedRole(r);
                      if (r === 'admin' && !signinIdentifier) {
                        setSigninIdentifier('hansyyy12@gmail.com');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
                  >
                    <option value="student">Student Account</option>
                    <option value="lecturer">Lecturer Account</option>
                    <option value="admin">Super Admin Account (God-Mode)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {selectedRole === 'student' ? 'Index Number or Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === 'student' ? 'e.g. UE12345 or student@hub.edu' : 'e.g. lecturer@hub.edu'}
                      value={signinIdentifier}
                      onChange={(e) => setSigninIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-bold text-sm shadow-md shadow-blue-900/20 transition cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500 font-medium">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Create an account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Create Account</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Join LectureHub and sync your campus workspace to Firebase.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kofi Mensah"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Register As
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                    </select>
                  </div>

                  {selectedRole === 'student' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Academic Level
                      </label>
                      <select
                        value={regLevel}
                        onChange={(e) => setRegLevel(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      >
                        <option>Level 100</option>
                        <option>Level 200</option>
                        <option>Level 300</option>
                        <option>Level 400</option>
                        <option>Level 500</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="0241234567"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {selectedRole === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Index Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. UE12345"
                        value={regIndexNo}
                        onChange={(e) => setRegIndexNo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="0241234567"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@university.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <small className="text-[11px] text-slate-400 block mt-1">Minimum 6 characters.</small>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-bold text-sm shadow-md shadow-blue-900/20 transition cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};
