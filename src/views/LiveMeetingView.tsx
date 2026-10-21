import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LiveMeeting } from '../types';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Send,
  Plus,
  Users,
  Copy,
  Check,
} from 'lucide-react';

export const LiveMeetingView: React.FC = () => {
  const { user } = useAuth();
  const { courses, enrollments, meetings, createMeeting } = useData();

  const isLecturer = user?.role === 'lecturer';
  const [activeRoom, setActiveRoom] = useState<LiveMeeting | null>(null);

  // Call States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // New Meeting modal state
  const [newMeetingModalOpen, setNewMeetingModalOpen] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetCourseCode, setMeetCourseCode] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const myCourses = isLecturer
    ? courses.filter((c) => c.ownerId === user?.uid)
    : courses.filter((c) => enrollments.some((e) => e.studentId === user?.uid && e.courseId === c.id));
  const myCourseCodes = new Set(myCourses.map((c) => c.code.toUpperCase()));

  const filteredMeetings = meetings.filter((m) => myCourseCodes.has(m.courseCode.toUpperCase()));

  useEffect(() => {
    let interval: any;
    if (activeRoom) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeRoom]);

  // Camera initialization
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCamOn(true);
      setMicOn(true);
    } catch {
      // Audio fallback or simulated
      console.warn('Camera/mic access unavailable; running in offline simulation mode.');
    }
  };

  const stopLocalMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleJoinCall = async (meeting: LiveMeeting) => {
    setActiveRoom(meeting);
    setChatMessages([
      { sender: 'System', text: `Welcome to ${meeting.title} (${meeting.courseCode})` },
    ]);
    await startLocalMedia();
  };

  const handleLeaveCall = () => {
    stopLocalMedia();
    setActiveRoom(null);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
    }
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
    }
    setCamOn(!camOn);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      { sender: user?.name || 'User', text: inputMessage.trim() },
    ]);
    setInputMessage('');
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    await createMeeting(meetTitle.trim(), meetCourseCode || myCourses[0]?.code || 'GIS100-X7K');
    setNewMeetingModalOpen(false);
    setMeetTitle('');
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Live Video Classroom
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Real-time peer-to-peer classroom sessions with live screen sharing and student chat.
          </p>
        </div>

        {isLecturer && !activeRoom && (
          <button
            onClick={() => {
              setMeetCourseCode(myCourses[0]?.code || '');
              setNewMeetingModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Video Session
          </button>
        )}
      </div>

      {activeRoom ? (
        /* Video Room Layout */
        <div className="rounded-2xl bg-[#081229] border border-blue-900/40 p-4 md:p-6 text-white space-y-4 shadow-2xl">
          {/* Room Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {activeRoom.courseCode} · Live Lecture
              </span>
              <h3 className="text-base font-extrabold text-white">{activeRoom.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatCallTime(callDuration)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> 1 Participant
              </span>
            </div>
          </div>

          {/* Grid Layout: Video Stage + Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative aspect-video rounded-2xl bg-[#040915] border border-white/10 overflow-hidden flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${camOn ? 'block' : 'hidden'}`}
                />

                {!camOn && (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-xl font-bold text-amber-300">
                      {user?.name?.slice(0, 2).toUpperCase() || 'LH'}
                    </div>
                    <span className="text-xs font-bold">{user?.name} (Camera Off)</span>
                  </div>
                )}

                {/* Pill in corner */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-xs font-bold flex items-center gap-1.5">
                  {handRaised && <span>✋</span>}
                  <span>{user?.name} (You)</span>
                  {!micOn && <span className="text-rose-400">🔇</span>}
                </div>
              </div>

              {/* In-Call Controls */}
              <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 flex-wrap">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition cursor-pointer ${
                    micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-600 text-white shadow-xs'
                  }`}
                  title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleCam}
                  className={`p-3 rounded-xl transition cursor-pointer ${
                    camOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-600 text-white shadow-xs'
                  }`}
                  title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`p-3 rounded-xl transition cursor-pointer ${
                    handRaised ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Raise / Lower Hand"
                >
                  <Hand className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" /> Leave Classroom
                </button>
              </div>
            </div>

            {/* Chat Log Panel (1 Col) */}
            <div className="rounded-2xl bg-[#040915] border border-white/10 p-4 flex flex-col justify-between h-[380px] lg:h-auto">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Class Chat
                </h4>
                <div className="space-y-2 overflow-y-auto max-h-60 pr-1 text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="font-bold text-amber-300 block">{msg.sender}</span>
                      <span className="text-slate-200">{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-3">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sessions Catalog */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              No live classroom sessions currently active. Check back during lecture hours.
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Session
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {meeting.courseCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                    {meeting.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Peer-to-peer interactive lecture room for enrolled students.
                  </p>
                </div>

                <button
                  onClick={() => handleJoinCall(meeting)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Video className="w-4 h-4" /> {isLecturer ? 'Start Live Class' : 'Join Classroom'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Meeting Modal */}
      {newMeetingModalOpen && (
        <div
          onClick={() => setNewMeetingModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create Virtual Classroom Session
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Students registered for this course level will see this session appear live.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Course Level
                </label>
                <select
                  value={meetCourseCode}
                  onChange={(e) => setMeetCourseCode(e.target.value)}
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
                  Lecture Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 4: Spatial Analysis & Map Projections"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Launch Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
