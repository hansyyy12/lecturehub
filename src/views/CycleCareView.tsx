import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CycleLog, CyclePeriod } from '../types';
import {
  HeartPulse,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Sun,
  Smile,
  Zap,
  FileText,
  Clock,
  Settings,
  Bell,
  Trash2,
  CheckCircle2,
  Shield,
  HelpCircle,
  Plus,
} from 'lucide-react';

const SYMPTOMS_LIST = [
  'Cramps',
  'Headache',
  'Back pain',
  'Bloating',
  'Acne',
  'Tender breasts',
  'Nausea',
  'Mood changes',
  'Fatigue',
];

export const CycleCareView: React.FC = () => {
  const { user } = useAuth();
  const {
    cycleData,
    saveCycleEntry,
    saveCyclePeriod,
    deleteCyclePeriod,
    saveCycleSettings,
    saveCycleReminders,
    clearCycleData,
  } = useData();

  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'settings' | 'reminders'>('main');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Log Period Modal
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodEndDate, setPeriodEndDate] = useState('');

  // Daily Log Form State
  const [flow, setFlow] = useState('None');
  const [mood, setMood] = useState('Okay');
  const [energy, setEnergy] = useState('Normal');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showSymptomsBox, setShowSymptomsBox] = useState(false);
  const [showNotesBox, setShowNotesBox] = useState(false);

  // Cycle Settings State
  const [settingsCycleLength, setSettingsCycleLength] = useState(cycleData.cycleLength || 28);
  const [settingsPeriodLength, setSettingsPeriodLength] = useState(cycleData.periodLength || 5);
  const [settingsLastStart, setSettingsLastStart] = useState(cycleData.lastStart || '');

  // Reminder State
  const [remindPeriod, setRemindPeriod] = useState(cycleData.reminders?.period ?? true);
  const [remindLog, setRemindLog] = useState(cycleData.reminders?.log ?? false);
  const [remindOvulation, setRemindOvulation] = useState(cycleData.reminders?.ovulation ?? false);

  // Sync daily form when selectedDate changes or logs change
  React.useEffect(() => {
    const existing = cycleData.logs?.find((l) => l.date === selectedDate);
    if (existing) {
      setFlow(existing.flow || 'None');
      setMood(existing.mood || 'Okay');
      setEnergy(existing.energy || 'Normal');
      setSelectedSymptoms(existing.symptoms || []);
      setNotes(existing.notes || '');
    } else {
      setFlow('None');
      setMood('Okay');
      setEnergy('Normal');
      setSelectedSymptoms([]);
      setNotes('');
    }
  }, [selectedDate, cycleData.logs]);

  // Sync settings when cycleData changes
  React.useEffect(() => {
    setSettingsCycleLength(cycleData.cycleLength || 28);
    setSettingsPeriodLength(cycleData.periodLength || 5);
    setSettingsLastStart(cycleData.lastStart || '');
    setRemindPeriod(cycleData.reminders?.period ?? true);
    setRemindLog(cycleData.reminders?.log ?? false);
    setRemindOvulation(cycleData.reminders?.ovulation ?? false);
  }, [cycleData]);

  // Helper date functions
  const addDays = (dateStr: string, days: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + days, 12);
    return date.toISOString().slice(0, 10);
  };

  const dayDiff = (dateStrA: string, dateStrB: string): number => {
    const [ya, ma, da] = dateStrA.split('-').map(Number);
    const [yb, mb, db] = dateStrB.split('-').map(Number);
    const tA = new Date(ya, ma - 1, da, 12).getTime();
    const tB = new Date(yb, mb - 1, db, 12).getTime();
    return Math.round((tA - tB) / 86400000);
  };

  // Cycle Estimates
  const estimates = useMemo(() => {
    const allPeriods = [...(cycleData.periods || [])].sort((a, b) => a.start.localeCompare(b.start));
    if (cycleData.lastStart && !allPeriods.some((p) => p.start === cycleData.lastStart)) {
      allPeriods.push({ start: cycleData.lastStart, end: cycleData.lastEnd || '' });
    }
    if (!allPeriods.length) return null;

    const latest = allPeriods[allPeriods.length - 1];
    const L = Number(cycleData.cycleLength) || 28;
    const P = Number(cycleData.periodLength) || 5;
    const today = new Date().toISOString().slice(0, 10);

    const nextPeriodStart = addDays(latest.start, L);
    const ovulationDate = addDays(nextPeriodStart, -14);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, -1);

    const cycleDay = Math.max(1, dayDiff(today, latest.start) + 1);
    const daysToNext = dayDiff(nextPeriodStart, today);

    return {
      latest,
      nextPeriodStart,
      ovulationDate,
      fertileStart,
      fertileEnd,
      cycleDay,
      daysToNext,
      L,
      P,
    };
  }, [cycleData]);

  // Calendar dates marks calculation
  const calendarMarks = useMemo(() => {
    const periodDays = new Set<string>();
    const predPeriodDays = new Set<string>();
    const fertileDays = new Set<string>();
    const ovulationDays = new Set<string>();

    const L = Number(cycleData.cycleLength) || 28;
    const P = Number(cycleData.periodLength) || 5;

    // Actual periods
    (cycleData.periods || []).forEach((p) => {
      const end = p.end && p.end >= p.start ? p.end : addDays(p.start, P - 1);
      let curr = p.start;
      while (curr <= end) {
        periodDays.add(curr);
        curr = addDays(curr, 1);
      }

      const ov = addDays(addDays(p.start, L), -14);
      ovulationDays.add(ov);
      for (let k = -5; k <= -1; k++) {
        fertileDays.add(addDays(ov, k));
      }
    });

    // Future projections
    if (estimates?.latest) {
      for (let cycle = 1; cycle <= 6; cycle++) {
        const futureStart = addDays(estimates.latest.start, cycle * L);
        for (let j = 0; j < P; j++) {
          predPeriodDays.add(addDays(futureStart, j));
        }

        const futureOv = addDays(addDays(futureStart, L), -14);
        ovulationDays.add(futureOv);
        for (let k = -5; k <= -1; k++) {
          fertileDays.add(addDays(futureOv, k));
        }
      }
    }

    return { periodDays, predPeriodDays, fertileDays, ovulationDays };
  }, [cycleData, estimates]);

  // Calendar Days Matrix
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = [];
    for (let i = 0; i < 42; i++) {
      const num = i - firstDay + 1;
      let d: Date;
      let isCurrentMonth = true;

      if (num < 1) {
        d = new Date(year, month - 1, prevMonthDays + num, 12);
        isCurrentMonth = false;
      } else if (num > daysInMonth) {
        d = new Date(year, month + 1, num - daysInMonth, 12);
        isCurrentMonth = false;
      } else {
        d = new Date(year, month, num, 12);
      }

      const dateStr = d.toISOString().slice(0, 10);
      grid.push({ date: d, dateStr, isCurrentMonth });
    }

    return grid;
  }, [currentMonth]);

  const handleSaveDailyEntry = async () => {
    await saveCycleEntry({
      date: selectedDate,
      flow,
      mood,
      energy,
      symptoms: selectedSymptoms,
      notes: notes.trim(),
    });
  };

  const handleSavePeriodModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStartDate) return;
    await saveCyclePeriod(periodStartDate, periodEndDate);
    setPeriodModalOpen(false);
  };

  const handleSaveSettingsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCycleSettings(settingsCycleLength, settingsPeriodLength, settingsLastStart);
    alert('Cycle settings saved successfully.');
  };

  const handleSaveRemindersForm = async () => {
    await saveCycleReminders({
      period: remindPeriod,
      log: remindLog,
      ovulation: remindOvulation,
      time: '20:00',
    });
    alert('Notification preferences saved.');
  };

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Period Cycle Care
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Private to your account
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Track your cycle, stay prepared on campus, and record daily symptoms.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'main'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setPeriodModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Period
          </button>
        </div>
      </div>

      {activeTab === 'main' && (
        <>
          {/* 4 Stat Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="p-4 md:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                <CalendarIcon className="w-4 h-4" /> Next Period
              </div>
              <strong className="text-xl md:text-2xl font-extrabold text-rose-800 dark:text-rose-200 block font-mono">
                {estimates ? estimates.nextPeriodStart : '—'}
              </strong>
              <small className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 block">
                {estimates
                  ? estimates.daysToNext > 0
                    ? `in ${estimates.daysToNext} day(s)`
                    : estimates.daysToNext === 0
                    ? 'Expected today'
                    : `${Math.abs(estimates.daysToNext)} day(s) past estimate`
                  : 'Log your last period to calculate'}
              </small>
            </div>

            <div className="p-4 md:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" /> Cycle Day
              </div>
              <strong className="text-xl md:text-2xl font-extrabold text-purple-800 dark:text-purple-200 block font-mono">
                {estimates ? `Day ${estimates.cycleDay}` : '—'}
              </strong>
              <small className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 block">
                {estimates ? `of ${estimates.L} days cycle` : '—'}
              </small>
            </div>

            <div className="p-4 md:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <HeartPulse className="w-4 h-4" /> Fertile Window*
              </div>
              <strong className="text-lg md:text-xl font-extrabold text-emerald-800 dark:text-emerald-200 block font-mono truncate">
                {estimates ? `${estimates.fertileStart.slice(5)} – ${estimates.fertileEnd.slice(5)}` : '—'}
              </strong>
              <small className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                Estimated fertile phase
              </small>
            </div>

            <div className="p-4 md:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sun className="w-4 h-4" /> Ovulation Day*
              </div>
              <strong className="text-xl md:text-2xl font-extrabold text-amber-800 dark:text-amber-200 block font-mono">
                {estimates ? estimates.ovulationDate : '—'}
              </strong>
              <small className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
                Estimated ovulation peak
              </small>
            </div>
          </div>

          {/* Main 2-column: Calendar & Daily Logger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                    }
                    className="p-1 rounded-lg border text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                    }
                    className="p-1 rounded-lg border text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((item, idx) => {
                  const isToday = item.dateStr === todayIso;
                  const isSelected = item.dateStr === selectedDate;

                  const isPeriod = calendarMarks.periodDays.has(item.dateStr);
                  const isPredPeriod = calendarMarks.predPeriodDays.has(item.dateStr);
                  const isFertile = calendarMarks.fertileDays.has(item.dateStr);
                  const isOvulation = calendarMarks.ovulationDays.has(item.dateStr);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`h-11 flex flex-col items-center justify-center rounded-xl text-xs font-semibold relative transition cursor-pointer ${
                        !item.isCurrentMonth ? 'opacity-30' : ''
                      } ${
                        isPeriod
                          ? 'bg-rose-500 text-white font-extrabold shadow-xs'
                          : isPredPeriod
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 border-dashed'
                          : isOvulation
                          ? 'bg-amber-400 text-slate-900 font-extrabold shadow-xs'
                          : isFertile
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      } ${isSelected ? 'ring-2 ring-purple-600 ring-offset-2' : ''}`}
                    >
                      <span>{item.date.getDate()}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" /> Logged Period
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-400 border-dashed" /> Predicted Period
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-200" /> Fertile Phase*
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400" /> Ovulation Day*
                </span>
              </div>
              <small className="text-[10px] text-slate-400 block leading-relaxed">
                *Fertile window and ovulation predictions are calendar mathematical estimates and cannot be used for contraception.
              </small>
            </div>

            {/* Daily Symptom & Mood Logger */}
            <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  Log for: {selectedDate === todayIso ? 'Today' : selectedDate}
                </h3>
                <p className="text-xs text-slate-400">
                  How are you feeling physically and emotionally today?
                </p>
              </div>

              <div className="space-y-3">
                {/* Bleeding Flow */}
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
                    <Droplets className="w-4 h-4 text-rose-500" />
                    <span>Menstrual Flow</span>
                  </div>
                  <select
                    value={flow}
                    onChange={(e) => setFlow(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-rose-200 text-rose-900 dark:text-rose-200"
                  >
                    <option value="None">No bleeding</option>
                    <option value="Spotting">Spotting</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>

                {/* Mood */}
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-200">
                    <Smile className="w-4 h-4 text-purple-500" />
                    <span>Mood</span>
                  </div>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-purple-200 text-purple-900 dark:text-purple-200"
                  >
                    <option>Okay</option>
                    <option>Good</option>
                    <option>Happy</option>
                    <option>Calm</option>
                    <option>Sad</option>
                    <option>Irritated</option>
                    <option>Anxious</option>
                    <option>Low energy</option>
                  </select>
                </div>

                {/* Energy */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Energy Level</span>
                  </div>
                  <select
                    value={energy}
                    onChange={(e) => setEnergy(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-amber-200 text-amber-900 dark:text-amber-200"
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Low</option>
                    <option>Very low</option>
                  </select>
                </div>

                {/* Symptoms Dropdown / Chips */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSymptomsBox(!showSymptomsBox)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span>
                      Symptoms ({selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'None'})
                    </span>
                    <span className="text-slate-400">{showSymptomsBox ? '▲' : '▼'}</span>
                  </button>

                  {showSymptomsBox && (
                    <div className="p-3 mt-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                      {SYMPTOMS_LIST.map((sym) => {
                        const isSelected = selectedSymptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => toggleSymptom(sym)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {sym}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes Box */}
                <div>
                  <textarea
                    rows={3}
                    placeholder="Notes (optional): write study symptoms, hydration, or reminders..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveDailyEntry}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Save Daily Log to Firebase
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Period Records
            </h3>
            {cycleData.periods.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No past periods logged yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {cycleData.periods.map((p) => (
                  <div
                    key={p.start}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-800 dark:text-white block">
                        {p.start} to {p.end || 'ongoing'}
                      </strong>
                      <small className="text-[11px] text-slate-400">
                        {p.end ? `${dayDiff(p.end, p.start) + 1} days` : 'Recorded period'}
                      </small>
                    </div>
                    <button
                      onClick={() => deleteCyclePeriod(p.start)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Symptom Logs
            </h3>
            {cycleData.logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No daily logs saved yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {cycleData.logs.map((log) => (
                  <div
                    key={log.date}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white mb-1">
                      <span>{log.date}</span>
                      <span className="text-[11px] text-purple-600">
                        {log.flow !== 'None' ? `${log.flow} bleeding` : 'No bleeding'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Mood: {log.mood} · Energy: {log.energy}
                    </div>
                    {log.symptoms?.length > 0 && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Symptoms: {log.symptoms.join(', ')}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cycle Settings & Privacy
          </h3>

          <form onSubmit={handleSaveSettingsForm} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Typical Cycle Length (Days)
              </label>
              <input
                type="number"
                min="15"
                max="60"
                required
                value={settingsCycleLength}
                onChange={(e) => setSettingsCycleLength(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Typical Period Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                required
                value={settingsPeriodLength}
                onChange={(e) => setSettingsPeriodLength(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Latest Period Start Date
              </label>
              <input
                type="date"
                value={settingsLastStart}
                onChange={(e) => setSettingsLastStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Cycle Preferences
            </button>
          </form>

          <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Clear Health History
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Delete all cycle records and daily symptom logs from Firestore.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Permanently wipe all your cycle care logs?')) {
                  clearCycleData();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
            >
              Clear Cycle Data
            </button>
          </div>
        </div>
      )}

      {/* Log Period Modal */}
      {periodModalOpen && (
        <div
          onClick={() => setPeriodModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Log Period Dates
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the first day of menstrual bleeding as Day 1.
            </p>

            <form onSubmit={handleSavePeriodModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Day of Period
                </label>
                <input
                  type="date"
                  required
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Day (Optional)
                </label>
                <input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
