import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeCourses,
  createCourseDoc,
  updateCourseDoc,
  deleteCourseDoc,
  subscribeEnrollments,
  createEnrollmentDoc,
  updateEnrollmentAttendance,
  updateEnrollmentExamMark,
  subscribeAnnouncements,
  createAnnouncementDoc,
  subscribeAssignments,
  createAssignmentDoc,
  subscribeSubmissions,
  createSubmissionDoc,
  gradeSubmissionDoc,
  subscribeQuizzes,
  createQuizDoc,
  updateQuizRelease,
  subscribeQuizAttempts,
  setQuizAttemptDoc,
  subscribeStudyFiles,
  createStudyFileDoc,
  updateStudyFileDoc,
  deleteStudyFileDoc,
  subscribeBudgetPlans,
  setBudgetPlanDoc,
  deleteBudgetPlanDoc,
  initialBudgetPlan,
  subscribeCycleData,
  setCycleDataDoc,
  initialCycleData,
  subscribePersonalTasks,
  createPersonalTaskDoc,
  deletePersonalTaskDoc,
  subscribeMeetings,
  createMeetingDoc,
  findCourseByCode,
} from '../services/firebaseService';
import { auth } from '../lib/firebase';
import {
  Course,
  Enrollment,
  Announcement,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  StudyFile,
  BudgetPlan,
  BudgetItem,
  CycleData,
  CycleLog,
  PersonalTask,
  LiveMeeting,
} from '../types';

interface DataContextType {
  courses: Course[];
  enrollments: Enrollment[];
  announcements: Announcement[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  studyFiles: StudyFile[];
  budgetPlans: BudgetPlan[];
  activeBudgetPlan: BudgetPlan;
  cycleData: CycleData;
  personalTasks: PersonalTask[];
  meetings: LiveMeeting[];
  loading: boolean;
  dbStatus: 'connected' | 'connecting' | 'offline';

  // Course & Enrollment
  createCourse: (course: Omit<Course, 'id'>) => Promise<string | undefined>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  registerStudentCourse: (
    code: string,
    fullName: string,
    indexNo: string,
    level: string,
    phone: string
  ) => Promise<{ success: boolean; message: string }>;
  markAttendance: (
    enrollmentId: string,
    date: string,
    status: 'Present' | 'Absent' | 'Late' | ''
  ) => Promise<void>;
  markExam: (enrollmentId: string, mark: number | null) => Promise<void>;
  updateCourseSettings: (courseId: string, updates: Partial<Course>) => Promise<void>;

  // Announcements
  sendAnnouncement: (data: Omit<Announcement, 'id'>) => Promise<string | undefined>;

  // Work & Submissions
  postAssignment: (data: Omit<Assignment, 'id'>) => Promise<string | undefined>;
  submitAssignment: (
    assignmentId: string,
    fileName: string,
    fileType: string,
    fileDataUrl: string,
    notes?: string
  ) => Promise<string | undefined>;
  gradeSubmission: (id: string, mark: string | number, feedback: string) => Promise<void>;

  // Quizzes
  createQuiz: (data: Omit<Quiz, 'id'>) => Promise<string | undefined>;
  submitQuizAttempt: (
    quizId: string,
    answers: Record<string, string>,
    autoSubmitted?: boolean
  ) => Promise<void>;
  gradeManualQuizAttempt: (
    attemptId: string,
    manualScore: number,
    objectiveScore: number
  ) => Promise<void>;
  setQuizRelease: (quizId: string, release: boolean) => Promise<void>;

  // Files
  uploadStudyFile: (
    name: string,
    size: number,
    courseCode: string,
    fileData?: string
  ) => Promise<string | undefined>;
  toggleShareFile: (id: string) => Promise<void>;
  deleteStudyFile: (id: string) => Promise<void>;

  // Budget Tracker
  switchBudgetPlan: (planId: string) => void;
  createBudgetPlan: (name: string, currency: string, totalBudget: number) => Promise<void>;
  updateBudgetLimit: (limit: number) => Promise<void>;
  addBudgetItem: (item: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudgetItem: (itemId: string, name: string, amount: number) => Promise<void>;
  deleteBudgetItem: (itemId: string) => Promise<void>;

  // Cycle Care Tracker
  saveCycleEntry: (entry: CycleLog) => Promise<void>;
  saveCyclePeriod: (start: string, end: string) => Promise<void>;
  deleteCyclePeriod: (start: string) => Promise<void>;
  saveCycleSettings: (cycleLength: number, periodLength: number, lastStart: string) => Promise<void>;
  saveCycleReminders: (reminders: CycleData['reminders']) => Promise<void>;
  clearCycleData: () => Promise<void>;

  // Personal Tasks
  addPersonalTask: (title: string, desc: string) => Promise<void>;
  deletePersonalTask: (id: string) => Promise<void>;

  // Live Meetings
  createMeeting: (title: string, courseCode: string) => Promise<string | undefined>;
}

const DataContext = createContext<DataContextType | null>(null);

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course_1',
    ownerId: 'demo_lecturer_ama_mensah',
    ownerName: 'Dr. Ama Mensah',
    name: 'Introduction to GIS',
    level: 'Level 100',
    code: 'GIS100-X7K',
    semester: 'First Semester',
    days: ['Monday', 'Wednesday'],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Lecture Hall A',
    attendanceMark: 2,
    quizWeight: 60,
    attendanceWeight: 20,
    assignmentWeight: 20,
    examMax: 100,
    caShare: 40,
  },
  {
    id: 'course_2',
    ownerId: 'demo_lecturer_ama_mensah',
    ownerName: 'Dr. Ama Mensah',
    name: 'Introduction to GIS',
    level: 'Level 400',
    code: 'GIS400-P9M',
    semester: 'First Semester',
    days: ['Tuesday', 'Thursday'],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Lecture Hall B',
    attendanceMark: 2,
    quizWeight: 60,
    attendanceWeight: 20,
    assignmentWeight: 20,
    examMax: 100,
    caShare: 40,
  },
  {
    id: 'course_3',
    ownerId: 'demo_lecturer_ama_mensah',
    ownerName: 'Dr. Ama Mensah',
    name: 'Mathematics',
    level: 'Level 100',
    code: 'MAT100-A3B',
    semester: 'First Semester',
    days: ['Monday', 'Friday'],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    startTime: '13:00',
    endTime: '15:00',
    location: 'Science Block C',
    attendanceMark: 2,
    quizWeight: 60,
    attendanceWeight: 20,
    assignmentWeight: 20,
    examMax: 100,
    caShare: 40,
  },
  {
    id: 'course_4',
    ownerId: 'demo_lecturer_ama_mensah',
    ownerName: 'Dr. Ama Mensah',
    name: 'Mathematics',
    level: 'Level 200',
    code: 'MAT200-C8D',
    semester: 'First Semester',
    days: ['Wednesday', 'Friday'],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    startTime: '15:00',
    endTime: '17:00',
    location: 'Science Block C',
    attendanceMark: 2,
    quizWeight: 60,
    attendanceWeight: 20,
    assignmentWeight: 20,
    examMax: 100,
    caShare: 40,
  },
];

const DEFAULT_ENROLLMENT: Enrollment = {
  id: 'enroll_seed_201',
  courseId: 'course_2',
  courseCode: 'GIS400-P9M',
  courseName: 'Introduction to GIS',
  studentId: 'demo_student_kofi_mensah',
  accountId: 'STU-201',
  fullName: 'Kofi Mensah',
  indexNo: 'UE12345',
  phone: '+233 20 987 6543',
  level: 'Level 200',
  attendance: {
    '2026-10-18': 'Present',
    '2026-10-20': 'Present',
  },
  marks: {
    exam_main: 82,
  },
  registeredAt: '2026-10-17',
};

const DEFAULT_ASSIGNMENT: Assignment = {
  id: 'asg_1',
  ownerId: 'demo_lecturer_ama_mensah',
  courseCode: 'GIS400-P9M',
  type: 'Assignment',
  title: 'GIS Mapping Assignment 1',
  due: '2026-10-25',
  desc: 'Create a vector map showing advanced spatial distribution and submit docx or pdf.',
};

const DEFAULT_QUIZ: Quiz = {
  id: 'quiz_1',
  ownerId: 'demo_lecturer_ama_mensah',
  courseCode: 'GIS400-P9M',
  title: 'GIS Coordinate Systems & Projections Test',
  duration: 25,
  releaseResults: true,
  questions: [
    {
      id: 'q1',
      text: 'Which UTM zone covers the greater portion of southern Ghana?',
      type: 'multiple-choice',
      options: ['Zone 29N', 'Zone 30N', 'Zone 31N', 'Zone 32N'],
      answer: 'Zone 30N',
      marks: 5,
    },
    {
      id: 'q2',
      text: 'Raster data models represent continuous geographical surfaces using square grid cells.',
      type: 'true-false',
      options: ['True', 'False'],
      answer: 'True',
      marks: 5,
    },
  ],
};

const DEFAULT_ANNOUNCEMENT: Announcement = {
  id: 'ann_1',
  courseId: 'course_2',
  courseCode: 'GIS400-P9M',
  courseName: 'Introduction to GIS',
  level: 'Level 400',
  title: 'GIS Lab Session - Venue Update',
  message: 'Please take note that tomorrow afternoon practical lab will be held in Lecture Hall B.',
  appliesDate: '2026-10-21',
  author: 'Dr. Ama Mensah',
  authorId: 'demo_lecturer_ama_mensah',
  createdAt: new Date().toISOString(),
};

const DEFAULT_MEETING: LiveMeeting = {
  id: 'meet_1',
  ownerId: 'demo_lecturer_ama_mensah',
  courseCode: 'GIS400-P9M',
  title: 'Live Lecture: Coordinate Systems (Level 400)',
  active: true,
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_courses');
      return s ? JSON.parse(s) : DEFAULT_COURSES;
    } catch {
      return DEFAULT_COURSES;
    }
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_enrollments');
      return s ? JSON.parse(s) : [DEFAULT_ENROLLMENT];
    } catch {
      return [DEFAULT_ENROLLMENT];
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_announcements');
      return s ? JSON.parse(s) : [DEFAULT_ANNOUNCEMENT];
    } catch {
      return [DEFAULT_ANNOUNCEMENT];
    }
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_assignments');
      return s ? JSON.parse(s) : [DEFAULT_ASSIGNMENT];
    } catch {
      return [DEFAULT_ASSIGNMENT];
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_submissions');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_quizzes');
      return s ? JSON.parse(s) : [DEFAULT_QUIZ];
    } catch {
      return [DEFAULT_QUIZ];
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_quiz_attempts');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [studyFiles, setStudyFiles] = useState<StudyFile[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_study_files');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_budget_plans');
      return s ? JSON.parse(s) : [initialBudgetPlan(user?.uid || 'guest')];
    } catch {
      return [initialBudgetPlan(user?.uid || 'guest')];
    }
  });

  const [activePlanId, setActivePlanId] = useState<string>(budgetPlans[0]?.id || '');
  const [cycleData, setCycleData] = useState<CycleData>(() => {
    try {
      const s = localStorage.getItem('lh_local_cycle_data');
      return s ? JSON.parse(s) : initialCycleData(user?.uid || 'guest');
    } catch {
      return initialCycleData(user?.uid || 'guest');
    }
  });

  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_personal_tasks');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [meetings, setMeetings] = useState<LiveMeeting[]>(() => {
    try {
      const s = localStorage.getItem('lh_local_meetings');
      return s ? JSON.parse(s) : [DEFAULT_MEETING];
    } catch {
      return [DEFAULT_MEETING];
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');

  // Sync to local storage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem('lh_local_courses', JSON.stringify(courses));
      localStorage.setItem('lh_local_enrollments', JSON.stringify(enrollments));
      localStorage.setItem('lh_local_announcements', JSON.stringify(announcements));
      localStorage.setItem('lh_local_assignments', JSON.stringify(assignments));
      localStorage.setItem('lh_local_submissions', JSON.stringify(submissions));
      localStorage.setItem('lh_local_quizzes', JSON.stringify(quizzes));
      localStorage.setItem('lh_local_quiz_attempts', JSON.stringify(quizAttempts));
      localStorage.setItem('lh_local_study_files', JSON.stringify(studyFiles));
      localStorage.setItem('lh_local_budget_plans', JSON.stringify(budgetPlans));
      localStorage.setItem('lh_local_cycle_data', JSON.stringify(cycleData));
      localStorage.setItem('lh_local_personal_tasks', JSON.stringify(personalTasks));
      localStorage.setItem('lh_local_meetings', JSON.stringify(meetings));
    } catch {}
  }, [
    courses,
    enrollments,
    announcements,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    studyFiles,
    budgetPlans,
    cycleData,
    personalTasks,
    meetings,
  ]);

  // Real-time synchronization with Firestore
  useEffect(() => {
    setLoading(true);
    setDbStatus('connecting');
    const unsubs: (() => void)[] = [];

    try {
      // 1. Academic Catalog Data (Always subscribed so phone/laptop see updates immediately)
      unsubs.push(
        subscribeCourses(
          (list) => {
            if (list.length > 0) {
              setCourses(list);
            }
            setDbStatus('connected');
          },
          (err) => {
            console.warn('Courses sync offline:', err.message);
          }
        )
      );

      unsubs.push(
        subscribeAnnouncements(
          (list) => {
            if (list.length > 0) setAnnouncements(list);
          },
          (err) => console.warn('Announcements sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeMeetings(
          (m) => {
            if (m.length > 0) setMeetings(m);
          },
          (err) => console.warn('Meetings sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeQuizzes(
          (list) => {
            if (list.length > 0) setQuizzes(list);
          },
          (err) => console.warn('Quizzes sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeAssignments(
          (list) => {
            if (list.length > 0) setAssignments(list);
          },
          (err) => console.warn('Assignments sync offline:', err.message)
        )
      );

      // 2. User-specific and Enrollment Data
      unsubs.push(
        subscribeEnrollments(
          (list) => {
            if (list.length > 0) setEnrollments(list);
          },
          (err) => console.warn('Enrollments sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeSubmissions(
          (list) => setSubmissions(list),
          (err) => console.warn('Submissions sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeQuizAttempts(
          (list) => setQuizAttempts(list),
          (err) => console.warn('Quiz attempts sync offline:', err.message)
        )
      );

      unsubs.push(
        subscribeStudyFiles(
          (list) => setStudyFiles(list),
          (err) => console.warn('Study files sync offline:', err.message)
        )
      );

      if (firebaseUser) {
        const authUid = firebaseUser.uid;
        unsubs.push(
          subscribeBudgetPlans(
            authUid,
            async (plans) => {
              if (!plans.length) {
                const def = initialBudgetPlan(authUid);
                try {
                  await setBudgetPlanDoc(def);
                } catch {}
                setBudgetPlans([def]);
                setActivePlanId(def.id);
              } else {
                setBudgetPlans(plans);
                if (!activePlanId || !plans.some((p) => p.id === activePlanId)) {
                  setActivePlanId(plans[0].id);
                }
              }
            },
            (err) => console.warn('Budget plans sync offline:', err.message)
          )
        );

        unsubs.push(
          subscribeCycleData(
            authUid,
            async (data) => {
              if (!data) {
                const def = initialCycleData(authUid);
                try {
                  await setCycleDataDoc(def);
                } catch {}
                setCycleData(def);
              } else {
                setCycleData(data);
              }
            },
            (err) => console.warn('Cycle data sync offline:', err.message)
          )
        );

        unsubs.push(
          subscribePersonalTasks(
            authUid,
            (tasks) => setPersonalTasks(tasks),
            (err) => console.warn('Personal tasks sync offline:', err.message)
          )
        );
      }

      setLoading(false);
    } catch (err) {
      console.warn('Subscription error handled: ', err);
      setDbStatus('offline');
      setLoading(false);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [firebaseUser]);

  const activeBudgetPlan = useMemo(() => {
    if (!budgetPlans.length) return initialBudgetPlan(user?.uid || 'guest');
    return budgetPlans.find((p) => p.id === activePlanId) || budgetPlans[0];
  }, [budgetPlans, activePlanId, user?.uid]);

  /* -------------------------------------------------------------
   * Action Implementations
   * -----------------------------------------------------------*/

  const createCourse = async (course: Omit<Course, 'id'>) => {
    const cleanCode = course.code.trim().toUpperCase();
    const id = `crs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const currentUid = auth.currentUser?.uid || user?.uid || course.ownerId;
    const newCourse: Course = {
      ...course,
      id,
      code: cleanCode,
      ownerId: currentUid,
      ownerName: user?.name || course.ownerName || 'Course Lecturer',
    };

    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== id)]);

    try {
      await createCourseDoc(newCourse, id);
    } catch (e: any) {
      console.warn('Firestore course creation error: ', e);
    }
    return id;
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await updateCourseDoc(id, updates);
    } catch (e) {
      console.warn('Firestore update error: ', e);
    }
  };

  const deleteCourse = async (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCourseDoc(id);
    } catch (e) {
      console.warn('Firestore delete error: ', e);
    }
  };

  const registerStudentCourse = async (
    code: string,
    fullName: string,
    indexNo: string,
    level: string,
    phone: string
  ) => {
    const cleanCode = code.trim().toUpperCase();
    let targetCourse = courses.find((c) => c.code.trim().toUpperCase() === cleanCode);

    // If not found in current local state, query Firestore directly for cross-device consistency!
    if (!targetCourse) {
      try {
        const fetched = await findCourseByCode(cleanCode);
        if (fetched) {
          targetCourse = fetched;
          setCourses((prev) => [fetched, ...prev.filter((c) => c.id !== fetched.id)]);
        }
      } catch (err) {
        console.warn('Error fetching course by code from Firestore:', err);
      }
    }

    if (!targetCourse) {
      return {
        success: false,
        message: `No course matches registration code "${code}". Please confirm the code with your lecturer.`,
      };
    }

    const currentUid = auth.currentUser?.uid || user?.uid || 'student';
    const alreadyEnrolled = enrollments.some(
      (e) => (e.studentId === currentUid || (user && e.studentId === user.uid)) && e.courseId === targetCourse!.id
    );
    if (alreadyEnrolled) {
      return {
        success: false,
        message: `You are already registered for ${targetCourse.name} (${targetCourse.level}).`,
      };
    }

    const newEnrollment: Enrollment = {
      id: `enr_${currentUid}_${targetCourse.id}`,
      courseId: targetCourse.id,
      courseCode: targetCourse.code,
      courseName: targetCourse.name,
      studentId: currentUid,
      accountId: user?.accountId || `STU-${currentUid.slice(0, 6).toUpperCase()}`,
      fullName: fullName.trim() || user?.name || 'Student',
      indexNo: indexNo.trim() || user?.indexNo || '',
      level: level || user?.level || targetCourse.level || 'Level 100',
      phone: phone.trim() || user?.phone || '',
      attendance: {},
      marks: {},
      registeredAt: new Date().toISOString(),
    };

    setEnrollments((prev) => [...prev.filter((e) => e.id !== newEnrollment.id), newEnrollment]);

    try {
      await createEnrollmentDoc(newEnrollment);
    } catch (e: any) {
      console.error('Firestore enrollment error: ', e);
      return {
        success: false,
        message: `Cloud registration failed: ${e.message || 'Permission denied or network failure'}.`,
      };
    }

    return {
      success: true,
      message: `Successfully registered for ${targetCourse.name} (${targetCourse.level})!`,
    };
  };

  const markAttendance = async (
    enrollmentId: string,
    date: string,
    status: 'Present' | 'Absent' | 'Late' | ''
  ) => {
    setEnrollments((prev) =>
      prev.map((e) => {
        if (e.id !== enrollmentId) return e;
        const att = { ...(e.attendance || {}) };
        if (!status) {
          delete att[date];
        } else {
          att[date] = status;
        }
        return { ...e, attendance: att };
      })
    );

    if (firebaseUser) {
      try {
        await updateEnrollmentAttendance(enrollmentId, date, status);
      } catch (e) {
        console.warn('Firestore attendance error: ', e);
      }
    }
  };

  const markExam = async (enrollmentId: string, mark: number | null) => {
    setEnrollments((prev) =>
      prev.map((e) => {
        if (e.id !== enrollmentId) return e;
        const marks = { ...(e.marks || {}) };
        if (mark === null || isNaN(mark)) {
          delete marks.exam_main;
        } else {
          marks.exam_main = mark;
        }
        return { ...e, marks };
      })
    );

    if (firebaseUser) {
      try {
        await updateEnrollmentExamMark(enrollmentId, mark);
      } catch (e) {
        console.warn('Firestore exam mark error: ', e);
      }
    }
  };

  const updateCourseSettings = async (courseId: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updates } : c)));
    if (firebaseUser) {
      try {
        await updateCourseDoc(courseId, updates);
      } catch (e) {
        console.warn('Firestore course settings error: ', e);
      }
    }
  };

  const sendAnnouncement = async (data: Omit<Announcement, 'id'>) => {
    const id = `ann_${Date.now()}`;
    const newAnn: Announcement = { ...data, id, createdAt: new Date().toISOString() };
    setAnnouncements((prev) => [newAnn, ...prev]);

    if (firebaseUser) {
      try {
        await createAnnouncementDoc(data);
      } catch (e) {
        console.warn('Firestore announcement error: ', e);
      }
    }
    return id;
  };

  const postAssignment = async (data: Omit<Assignment, 'id'>) => {
    const id = `asg_${Date.now()}`;
    const newAsg: Assignment = { ...data, id, createdAt: new Date().toISOString() };
    setAssignments((prev) => [newAsg, ...prev]);

    if (firebaseUser) {
      try {
        await createAssignmentDoc(data);
      } catch (e) {
        console.warn('Firestore assignment error: ', e);
      }
    }
    return id;
  };

  const submitAssignment = async (
    assignmentId: string,
    fileName: string,
    fileType: string,
    fileDataUrl: string,
    notes?: string
  ) => {
    const asg = assignments.find((a) => a.id === assignmentId);
    const id = `sub_${Date.now()}`;
    const newSub: Submission = {
      id,
      assignmentId,
      studentId: user?.uid || 'student',
      studentName: user?.name || 'Student',
      courseCode: asg?.courseCode || 'GENERAL',
      itemTitle: asg?.title || fileName,
      fileName,
      fileType,
      fileDataUrl,
      notes: notes || '',
      submissionDate: new Date().toISOString().slice(0, 10),
      status: 'Submitted',
      mark: null,
      feedback: '',
    };
    setSubmissions((prev) => [newSub, ...prev]);

    if (firebaseUser) {
      try {
        await createSubmissionDoc(newSub);
      } catch (e) {
        console.warn('Firestore submission error: ', e);
      }
    }
    return id;
  };

  const gradeSubmission = async (id: string, mark: string | number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, mark: String(mark), feedback, status: 'Graded' } : s))
    );
    if (firebaseUser) {
      try {
        await gradeSubmissionDoc(id, mark, feedback);
      } catch (e) {
        console.warn('Firestore grade error: ', e);
      }
    }
  };

  const createQuiz = async (data: Omit<Quiz, 'id'>) => {
    const id = `qz_${Date.now()}`;
    const newQz: Quiz = { ...data, id, createdAt: new Date().toISOString() };
    setQuizzes((prev) => [newQz, ...prev]);

    if (firebaseUser) {
      try {
        await createQuizDoc(data);
      } catch (e) {
        console.warn('Firestore quiz error: ', e);
      }
    }
    return id;
  };

  const submitQuizAttempt = async (
    quizId: string,
    answers: Record<string, string>,
    autoSubmitted = false
  ) => {
    const q = quizzes.find((x) => x.id === quizId);
    if (!q) return;

    let objectiveScore = 0;
    let maxScore = 0;
    let needsManual = false;

    q.questions.forEach((qu) => {
      maxScore += qu.marks;
      const given = (answers[qu.id] || '').trim().toLowerCase();
      const expected = (qu.answer || '').trim().toLowerCase();
      if (qu.type === 'short-answer') {
        needsManual = true;
      } else if (given === expected) {
        objectiveScore += qu.marks;
      }
    });

    const attemptId = `att_${quizId}_${user?.uid || 'student'}`;
    const attempt: QuizAttempt = {
      id: attemptId,
      quizId,
      studentId: user?.uid || 'student',
      studentName: user?.name,
      courseCode: q.courseCode,
      answers,
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      objectiveScore,
      manualScore: 0,
      score: needsManual ? null : objectiveScore,
      maxScore,
      needsManual,
      autoSubmitted,
    };

    setQuizAttempts((prev) => [...prev.filter((a) => a.id !== attemptId), attempt]);

    if (firebaseUser) {
      try {
        await setQuizAttemptDoc(attemptId, attempt);
      } catch (e) {
        console.warn('Firestore quiz attempt error: ', e);
      }
    }
  };

  const gradeManualQuizAttempt = async (
    attemptId: string,
    manualScore: number,
    objectiveScore: number
  ) => {
    setQuizAttempts((prev) =>
      prev.map((a) =>
        a.id === attemptId
          ? {
              ...a,
              manualScore,
              score: objectiveScore + manualScore,
              needsManual: false,
              manuallyMarkedAt: new Date().toISOString(),
            }
          : a
      )
    );

    if (firebaseUser) {
      try {
        await setQuizAttemptDoc(attemptId, {
          manualScore,
          score: objectiveScore + manualScore,
          needsManual: false,
          manuallyMarkedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore grade manual quiz error: ', e);
      }
    }
  };

  const setQuizRelease = async (quizId: string, releaseResults: boolean) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, releaseResults } : q))
    );
    if (firebaseUser) {
      try {
        await updateQuizRelease(quizId, releaseResults);
      } catch (e) {
        console.warn('Firestore quiz release error: ', e);
      }
    }
  };

  const uploadStudyFile = async (
    name: string,
    size: number,
    courseCode: string,
    fileData?: string
  ) => {
    const id = `sf_${user?.uid || 'user'}_${Date.now()}`;
    const newFile: StudyFile = {
      id,
      userId: user?.uid || 'user',
      uploaderName: user?.name,
      courseCode,
      name,
      size,
      shared: false,
      fileData,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setStudyFiles((prev) => [newFile, ...prev]);

    if (firebaseUser) {
      try {
        await createStudyFileDoc(newFile, id);
      } catch (e) {
        console.warn('Firestore study file error: ', e);
      }
    }
    return id;
  };

  const toggleShareFile = async (id: string) => {
    setStudyFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, shared: !f.shared } : f))
    );
    if (firebaseUser) {
      const f = studyFiles.find((x) => x.id === id);
      if (f) {
        try {
          await updateStudyFileDoc(id, { shared: !f.shared });
        } catch (e) {
          console.warn('Firestore share file error: ', e);
        }
      }
    }
  };

  const deleteStudyFile = async (id: string) => {
    setStudyFiles((prev) => prev.filter((f) => f.id !== id));
    if (firebaseUser) {
      try {
        await deleteStudyFileDoc(id);
      } catch (e) {
        console.warn('Firestore delete file error: ', e);
      }
    }
  };

  const switchBudgetPlan = (planId: string) => {
    setActivePlanId(planId);
  };

  const createBudgetPlan = async (name: string, currency: string, totalBudget: number) => {
    const newId = `plan_${user?.uid || 'user'}_${Date.now()}`;
    const newPlan: BudgetPlan = {
      id: newId,
      userId: user?.uid || 'user',
      name,
      currency,
      totalBudget,
      active: true,
      items: [
        { id: `b_${Date.now()}`, type: 'BILLS', name: 'ELECTRICITY', amount: 150 },
        { id: `e_${Date.now()}`, type: 'EXPENSES', name: 'CAMPUS GROCERIES', amount: 300 },
        { id: `s_${Date.now()}`, type: 'SAVINGS', name: 'STUDY EMERGENCY', amount: 200 },
        { id: `d_${Date.now()}`, type: 'DEBT', name: 'CAMPUS LOAN', amount: 100 },
      ],
    };
    setBudgetPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newId);

    if (firebaseUser) {
      try {
        await setBudgetPlanDoc(newPlan);
      } catch (e) {
        console.warn('Firestore budget plan error: ', e);
      }
    }
  };

  const updateBudgetLimit = async (limit: number) => {
    if (!activeBudgetPlan) return;
    const updated = { ...activeBudgetPlan, totalBudget: limit };
    setBudgetPlans((prev) => prev.map((p) => (p.id === activeBudgetPlan.id ? updated : p)));

    if (firebaseUser) {
      try {
        await setBudgetPlanDoc(updated);
      } catch (e) {
        console.warn('Firestore budget limit error: ', e);
      }
    }
  };

  const addBudgetItem = async (item: Omit<BudgetItem, 'id'>) => {
    if (!activeBudgetPlan) return;
    const newItem: BudgetItem = {
      ...item,
      id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    const updated = {
      ...activeBudgetPlan,
      items: [...activeBudgetPlan.items, newItem],
    };
    setBudgetPlans((prev) => prev.map((p) => (p.id === activeBudgetPlan.id ? updated : p)));

    if (firebaseUser) {
      try {
        await setBudgetPlanDoc(updated);
      } catch (e) {
        console.warn('Firestore add budget item error: ', e);
      }
    }
  };

  const updateBudgetItem = async (itemId: string, name: string, amount: number) => {
    if (!activeBudgetPlan) return;
    const updatedItems = activeBudgetPlan.items.map((i) =>
      i.id === itemId ? { ...i, name, amount } : i
    );
    const updated = { ...activeBudgetPlan, items: updatedItems };
    setBudgetPlans((prev) => prev.map((p) => (p.id === activeBudgetPlan.id ? updated : p)));

    if (firebaseUser) {
      try {
        await setBudgetPlanDoc(updated);
      } catch (e) {
        console.warn('Firestore update budget item error: ', e);
      }
    }
  };

  const deleteBudgetItem = async (itemId: string) => {
    if (!activeBudgetPlan) return;
    const updatedItems = activeBudgetPlan.items.filter((i) => i.id !== itemId);
    const updated = { ...activeBudgetPlan, items: updatedItems };
    setBudgetPlans((prev) => prev.map((p) => (p.id === activeBudgetPlan.id ? updated : p)));

    if (firebaseUser) {
      try {
        await setBudgetPlanDoc(updated);
      } catch (e) {
        console.warn('Firestore delete budget item error: ', e);
      }
    }
  };

  const saveCycleEntry = async (entry: CycleLog) => {
    const existingLogs = cycleData.logs.filter((l) => l.date !== entry.date);
    const updatedLogs = [entry, ...existingLogs];

    let updatedPeriods = [...cycleData.periods];
    let lastStart = cycleData.lastStart;

    if (['Light', 'Medium', 'Heavy'].includes(entry.flow)) {
      const isRecorded = updatedPeriods.some((p) => p.start === entry.date);
      if (!isRecorded) {
        updatedPeriods = [{ start: entry.date, end: '' }, ...updatedPeriods];
        lastStart = entry.date;
      }
    }

    const updated: CycleData = {
      ...cycleData,
      userId: user?.uid || 'user',
      logs: updatedLogs,
      periods: updatedPeriods,
      lastStart,
    };
    setCycleData(updated);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(updated);
      } catch (e) {
        console.warn('Firestore cycle entry error: ', e);
      }
    }
  };

  const saveCyclePeriod = async (start: string, end: string) => {
    const filtered = cycleData.periods.filter((p) => p.start !== start);
    const updatedPeriods = [{ start, end }, ...filtered].sort((a, b) =>
      b.start.localeCompare(a.start)
    );
    const updated: CycleData = {
      ...cycleData,
      userId: user?.uid || 'user',
      periods: updatedPeriods,
      lastStart: updatedPeriods[0]?.start || start,
      lastEnd: end,
    };
    setCycleData(updated);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(updated);
      } catch (e) {
        console.warn('Firestore cycle period error: ', e);
      }
    }
  };

  const deleteCyclePeriod = async (start: string) => {
    const filtered = cycleData.periods.filter((p) => p.start !== start);
    const updated: CycleData = {
      ...cycleData,
      userId: user?.uid || 'user',
      periods: filtered,
      lastStart: filtered[0]?.start || '',
      lastEnd: filtered[0]?.end || '',
    };
    setCycleData(updated);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(updated);
      } catch (e) {
        console.warn('Firestore delete cycle period error: ', e);
      }
    }
  };

  const saveCycleSettings = async (
    cycleLength: number,
    periodLength: number,
    lastStart: string
  ) => {
    const updated: CycleData = {
      ...cycleData,
      userId: user?.uid || 'user',
      cycleLength,
      periodLength,
      lastStart,
    };
    setCycleData(updated);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(updated);
      } catch (e) {
        console.warn('Firestore cycle settings error: ', e);
      }
    }
  };

  const saveCycleReminders = async (reminders: CycleData['reminders']) => {
    const updated: CycleData = {
      ...cycleData,
      userId: user?.uid || 'user',
      reminders,
    };
    setCycleData(updated);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(updated);
      } catch (e) {
        console.warn('Firestore cycle reminders error: ', e);
      }
    }
  };

  const clearCycleData = async () => {
    const cleared = initialCycleData(user?.uid || 'user');
    cleared.periods = [];
    cleared.logs = [];
    cleared.lastStart = '';
    cleared.lastEnd = '';
    setCycleData(cleared);

    if (firebaseUser) {
      try {
        await setCycleDataDoc(cleared);
      } catch (e) {
        console.warn('Firestore clear cycle data error: ', e);
      }
    }
  };

  const addPersonalTask = async (title: string, desc: string) => {
    const newTask: PersonalTask = {
      id: `task_${Date.now()}`,
      userId: user?.uid || 'user',
      title,
      desc,
      completed: false,
    };
    setPersonalTasks((prev) => [newTask, ...prev]);

    if (firebaseUser) {
      try {
        await createPersonalTaskDoc(newTask);
      } catch (e) {
        console.warn('Firestore add personal task error: ', e);
      }
    }
  };

  const deletePersonalTask = async (id: string) => {
    setPersonalTasks((prev) => prev.filter((t) => t.id !== id));
    if (firebaseUser) {
      try {
        await deletePersonalTaskDoc(id);
      } catch (e) {
        console.warn('Firestore delete personal task error: ', e);
      }
    }
  };

  const createMeeting = async (title: string, courseCode: string) => {
    const newMeeting: LiveMeeting = {
      id: `meet_${Date.now()}`,
      ownerId: user?.uid || 'user',
      courseCode,
      title,
      active: true,
    };
    setMeetings((prev) => [newMeeting, ...prev]);

    if (firebaseUser) {
      try {
        await createMeetingDoc(newMeeting);
      } catch (e) {
        console.warn('Firestore meeting error: ', e);
      }
    }
    return newMeeting.id;
  };

  return (
    <DataContext.Provider
      value={{
        courses,
        enrollments,
        announcements,
        assignments,
        submissions,
        quizzes,
        quizAttempts,
        studyFiles,
        budgetPlans,
        activeBudgetPlan,
        cycleData,
        personalTasks,
        meetings,
        loading,
        dbStatus,
        createCourse,
        updateCourse,
        deleteCourse,
        registerStudentCourse,
        markAttendance,
        markExam,
        updateCourseSettings,
        sendAnnouncement,
        postAssignment,
        submitAssignment,
        gradeSubmission,
        createQuiz,
        submitQuizAttempt,
        gradeManualQuizAttempt,
        setQuizRelease,
        uploadStudyFile,
        toggleShareFile,
        deleteStudyFile,
        switchBudgetPlan,
        createBudgetPlan,
        updateBudgetLimit,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        saveCycleEntry,
        saveCyclePeriod,
        deleteCyclePeriod,
        saveCycleSettings,
        saveCycleReminders,
        clearCycleData,
        addPersonalTask,
        deletePersonalTask,
        createMeeting,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};
