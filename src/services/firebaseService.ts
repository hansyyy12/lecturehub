import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  UserProfile,
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
  PersonalTask,
  LiveMeeting,
} from '../types';

// Default starter plans for campus budget
export const initialBudgetPlan = (userId: string): BudgetPlan => ({
  id: `plan_${userId}_standard`,
  userId,
  name: 'Standard Semester Plan',
  currency: 'GH₵',
  totalBudget: 5000,
  active: true,
  items: [
    { id: 'b1', type: 'BILLS', name: 'ELECTRICITY', amount: 200 },
    { id: 'b2', type: 'BILLS', name: 'AIRTIME', amount: 50 },
    { id: 'b3', type: 'BILLS', name: 'UTILITIES', amount: 100 },
    { id: 'b4', type: 'BILLS', name: 'APARTMENT HOSTEL', amount: 1200 },
    { id: 'b5', type: 'BILLS', name: 'HEALTH INSURANCE', amount: 300 },
    { id: 'b6', type: 'BILLS', name: 'WATER', amount: 80 },
    { id: 'e1', type: 'EXPENSES', name: 'FOOD/EATING OUT', amount: 600 },
    { id: 'e2', type: 'EXPENSES', name: 'GROCERIES', amount: 500 },
    { id: 'e3', type: 'EXPENSES', name: 'CAMPUS TEXTBOOKS', amount: 200 },
    { id: 'e4', type: 'EXPENSES', name: 'SUBSCRIPTIONS', amount: 150 },
    { id: 'e5', type: 'EXPENSES', name: 'PERSONAL CARE', amount: 120 },
    { id: 'e6', type: 'EXPENSES', name: 'PRINTING & PHOTOCOPY', amount: 100 },
    { id: 'd1', type: 'DEBT', name: 'CAMPUS TRANSPORT DUE', amount: 150 },
    { id: 'd2', type: 'DEBT', name: 'STUDENT LOAN PORTION', amount: 300 },
    { id: 's1', type: 'SAVINGS', name: 'EMERGENCY CAMPUS FUND', amount: 300 },
    { id: 's2', type: 'SAVINGS', name: 'LAPTOP REPAIR SAVINGS', amount: 200 },
    { id: 's3', type: 'SAVINGS', name: 'CHECKING WALLET', amount: 350 },
  ],
});

export const initialCycleData = (userId: string): CycleData => ({
  userId,
  cycleLength: 28,
  periodLength: 5,
  lastStart: '2026-10-02',
  lastEnd: '2026-10-06',
  periods: [
    { start: '2026-09-04', end: '2026-09-08' },
    { start: '2026-10-02', end: '2026-10-06' },
  ],
  logs: [
    {
      date: '2026-10-02',
      flow: 'Heavy',
      mood: 'Calm',
      energy: 'Low',
      symptoms: ['Cramps', 'Fatigue'],
      notes: 'Day 1 of cycle. Drinking warm ginger tea.',
    },
    {
      date: '2026-10-03',
      flow: 'Medium',
      mood: 'Good',
      energy: 'Normal',
      symptoms: ['Headache'],
      notes: 'Studied GIS lecture slides in library.',
    },
  ],
  reminders: {
    period: true,
    log: true,
    ovulation: false,
    time: '20:00',
  },
});

/* -------------------------------------------------------------
 * 1. User Profiles
 * -----------------------------------------------------------*/
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUsers(
  callback: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ ...d.data() } as UserProfile));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateUserDoc(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserDoc(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


/* -------------------------------------------------------------
 * 2. Courses
 * -----------------------------------------------------------*/
export function subscribeCourses(
  callback: (courses: Course[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'courses';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createCourseDoc(course: Omit<Course, 'id'>, id?: string): Promise<string> {
  const courseId = id || `crs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `courses/${courseId}`;
  try {
    await setDoc(doc(db, 'courses', courseId), {
      ...course,
      createdAt: new Date().toISOString(),
    });
    return courseId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCourseDoc(courseId: string, updates: Partial<Course>): Promise<void> {
  const path = `courses/${courseId}`;
  try {
    await updateDoc(doc(db, 'courses', courseId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCourseDoc(courseId: string): Promise<void> {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------
 * 3. Enrollments
 * -----------------------------------------------------------*/
export function subscribeEnrollments(
  callback: (enrollments: Enrollment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'enrollments';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createEnrollmentDoc(enrollment: Omit<Enrollment, 'id'>): Promise<string> {
  const enrollmentId = `enr_${enrollment.studentId}_${enrollment.courseId}`;
  const path = `enrollments/${enrollmentId}`;
  try {
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      ...enrollment,
      registeredAt: enrollment.registeredAt || new Date().toISOString(),
    });
    return enrollmentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEnrollmentAttendance(
  enrollmentId: string,
  date: string,
  status: 'Present' | 'Absent' | 'Late' | ''
): Promise<void> {
  const path = `enrollments/${enrollmentId}`;
  try {
    const snap = await getDoc(doc(db, 'enrollments', enrollmentId));
    if (!snap.exists()) return;
    const data = snap.data() as Enrollment;
    const att = { ...(data.attendance || {}) };
    if (!status) {
      delete att[date];
    } else {
      att[date] = status;
    }
    await updateDoc(doc(db, 'enrollments', enrollmentId), { attendance: att });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateEnrollmentExamMark(
  enrollmentId: string,
  mark: number | null
): Promise<void> {
  const path = `enrollments/${enrollmentId}`;
  try {
    const snap = await getDoc(doc(db, 'enrollments', enrollmentId));
    if (!snap.exists()) return;
    const data = snap.data() as Enrollment;
    const marks = { ...(data.marks || {}) };
    if (mark === null || isNaN(mark)) {
      delete marks.exam_main;
    } else {
      marks.exam_main = mark;
    }
    await updateDoc(doc(db, 'enrollments', enrollmentId), { marks });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------
 * 4. Announcements
 * -----------------------------------------------------------*/
export function subscribeAnnouncements(
  callback: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'announcements';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createAnnouncementDoc(announcement: Omit<Announcement, 'id'>): Promise<string> {
  const id = `ann_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `announcements/${id}`;
  try {
    await setDoc(doc(db, 'announcements', id), {
      ...announcement,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/* -------------------------------------------------------------
 * 5. Assignments
 * -----------------------------------------------------------*/
export function subscribeAssignments(
  callback: (assignments: Assignment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'assignments';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createAssignmentDoc(assignment: Omit<Assignment, 'id'>): Promise<string> {
  const id = `asg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `assignments/${id}`;
  try {
    await setDoc(doc(db, 'assignments', id), {
      ...assignment,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/* -------------------------------------------------------------
 * 6. Submissions
 * -----------------------------------------------------------*/
export function subscribeSubmissions(
  callback: (submissions: Submission[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'submissions';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSubmissionDoc(submission: Omit<Submission, 'id'>): Promise<string> {
  const id = `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `submissions/${id}`;
  try {
    await setDoc(doc(db, 'submissions', id), {
      ...submission,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function gradeSubmissionDoc(
  submissionId: string,
  mark: string | number,
  feedback: string
): Promise<void> {
  const path = `submissions/${submissionId}`;
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      mark: String(mark),
      feedback,
      status: 'Graded',
      gradedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/* -------------------------------------------------------------
 * 7. Quizzes & Quiz Attempts
 * -----------------------------------------------------------*/
export function subscribeQuizzes(
  callback: (quizzes: Quiz[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'quizzes';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createQuizDoc(quiz: Omit<Quiz, 'id'>): Promise<string> {
  const id = `qz_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `quizzes/${id}`;
  try {
    await setDoc(doc(db, 'quizzes', id), {
      ...quiz,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateQuizRelease(quizId: string, releaseResults: boolean): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    await updateDoc(doc(db, 'quizzes', quizId), { releaseResults });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeQuizAttempts(
  callback: (attempts: QuizAttempt[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'quizAttempts';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizAttempt));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function setQuizAttemptDoc(attemptId: string, attempt: Partial<QuizAttempt>): Promise<void> {
  const path = `quizAttempts/${attemptId}`;
  try {
    await setDoc(doc(db, 'quizAttempts', attemptId), attempt, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* -------------------------------------------------------------
 * 8. Study Files
 * -----------------------------------------------------------*/
export function subscribeStudyFiles(
  callback: (files: StudyFile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'studyFiles';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyFile));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createStudyFileDoc(file: Omit<StudyFile, 'id'>, customId?: string): Promise<string> {
  const id = customId || `sf_${file.userId}_${Date.now()}`;
  const path = `studyFiles/${id}`;
  try {
    await setDoc(doc(db, 'studyFiles', id), file);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStudyFileDoc(fileId: string, updates: Partial<StudyFile>): Promise<void> {
  const path = `studyFiles/${fileId}`;
  try {
    await updateDoc(doc(db, 'studyFiles', fileId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyFileDoc(fileId: string): Promise<void> {
  const path = `studyFiles/${fileId}`;
  try {
    await deleteDoc(doc(db, 'studyFiles', fileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------
 * 9. Budget Plans
 * -----------------------------------------------------------*/
export function subscribeBudgetPlans(
  userId: string,
  callback: (plans: BudgetPlan[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'budgetPlans';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BudgetPlan));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function setBudgetPlanDoc(plan: BudgetPlan): Promise<void> {
  const path = `budgetPlans/${plan.id}`;
  try {
    await setDoc(doc(db, 'budgetPlans', plan.id), {
      ...plan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBudgetPlanDoc(planId: string): Promise<void> {
  const path = `budgetPlans/${planId}`;
  try {
    await deleteDoc(doc(db, 'budgetPlans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------
 * 10. Cycle Care Tracker
 * -----------------------------------------------------------*/
export function subscribeCycleData(
  userId: string,
  callback: (cycleData: CycleData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `cycleData/${userId}`;
  return onSnapshot(
    doc(db, 'cycleData', userId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as CycleData) : null);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function setCycleDataDoc(data: CycleData): Promise<void> {
  const path = `cycleData/${data.userId}`;
  try {
    await setDoc(doc(db, 'cycleData', data.userId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* -------------------------------------------------------------
 * 11. Personal Tasks
 * -----------------------------------------------------------*/
export function subscribePersonalTasks(
  userId: string,
  callback: (tasks: PersonalTask[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'personalTasks';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PersonalTask));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPersonalTaskDoc(task: Omit<PersonalTask, 'id'>): Promise<string> {
  const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `personalTasks/${id}`;
  try {
    await setDoc(doc(db, 'personalTasks', id), {
      ...task,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePersonalTaskDoc(taskId: string): Promise<void> {
  const path = `personalTasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'personalTasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------
 * 12. Live Meetings
 * -----------------------------------------------------------*/
export function subscribeMeetings(
  callback: (meetings: LiveMeeting[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'meetings';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LiveMeeting));
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createMeetingDoc(meeting: Omit<LiveMeeting, 'id'>): Promise<string> {
  const id = `meet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `meetings/${id}`;
  try {
    await setDoc(doc(db, 'meetings', id), {
      ...meeting,
      createdAt: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/* -------------------------------------------------------------
 * Seed Initial Starter Data if Database is Fresh
 * -----------------------------------------------------------*/
export async function seedInitialFirestoreDataIfEmpty(currentUid: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    if (!snap.empty) {
      return; // Already populated
    }

    const lecturerId = currentUid || 'lecturer_ama_mensah';

    const defaultCourses: Omit<Course, 'id'>[] = [
      {
        ownerId: lecturerId,
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
        ownerId: lecturerId,
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
        ownerId: lecturerId,
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
        ownerId: lecturerId,
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

    const courseIds: string[] = [];
    for (let i = 0; i < defaultCourses.length; i++) {
      const cId = `course_${i + 1}`;
      await setDoc(doc(db, 'courses', cId), {
        ...defaultCourses[i],
        createdAt: new Date().toISOString(),
      });
      courseIds.push(cId);
    }

    // Default Assignment
    await setDoc(doc(db, 'assignments', 'asg_1'), {
      ownerId: lecturerId,
      courseCode: 'GIS400-P9M',
      type: 'Assignment',
      title: 'GIS Mapping Assignment 1',
      due: '2026-10-25',
      desc: 'Create a vector map showing advanced spatial distribution and submit docx or pdf.',
      createdAt: new Date().toISOString(),
    });

    // Default Live Quiz
    await setDoc(doc(db, 'quizzes', 'quiz_1'), {
      ownerId: lecturerId,
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
          text: 'Raster data models represent geographical space using a continuous matrix of square grid cells or pixels.',
          type: 'true-false',
          options: ['True', 'False'],
          answer: 'True',
          marks: 5,
        },
        {
          id: 'q3',
          text: 'Define the distinction between spatial and attribute data in GIS.',
          type: 'short-answer',
          options: [],
          answer: 'Spatial data represents geometric locations while attribute data describes properties.',
          marks: 10,
        },
      ],
      createdAt: new Date().toISOString(),
    });

    // Default Announcement
    await setDoc(doc(db, 'announcements', 'ann_1'), {
      courseId: courseIds[1],
      courseCode: 'GIS400-P9M',
      courseName: 'Introduction to GIS',
      level: 'Level 400',
      title: 'GIS Lab Session - Venue Update',
      message: 'Please take note that tomorrow afternoon practical lab will be held in Lecture Hall B.',
      appliesDate: '2026-10-21',
      author: 'Dr. Ama Mensah',
      authorId: lecturerId,
      createdAt: new Date().toISOString(),
    });

    // Default Meeting
    await setDoc(doc(db, 'meetings', 'meet_1'), {
      ownerId: lecturerId,
      courseCode: 'GIS400-P9M',
      title: 'Live Lecture: Coordinate Systems (Level 400)',
      active: true,
      createdAt: new Date().toISOString(),
    });

    // Seed Directory Users (Super Admin, Lecturer, Students)
    const initialUsers: UserProfile[] = [
      {
        uid: 'super_admin_hans',
        name: 'Hans Super Admin',
        email: 'hansyyy12@gmail.com',
        role: 'admin',
        accountId: 'ADM-001',
        phone: '+233 24 000 0001',
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'demo_lecturer_ama_mensah',
        name: 'Dr. Ama Mensah',
        email: 'lecturer@hub.edu',
        role: 'lecturer',
        accountId: 'LEC-1001',
        phone: '+233 24 112 3456',
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'demo_student_kofi_mensah',
        name: 'Kofi Mensah',
        email: 'student@hub.edu',
        role: 'student',
        indexNo: 'UE12345',
        level: 'Level 200',
        accountId: 'STU-201',
        phone: '+233 20 987 6543',
        code: 'GIS400-P9M',
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'student_serwaa_boakye',
        name: 'Serwaa Boakye',
        email: 'serwaa@hub.edu',
        role: 'student',
        indexNo: 'UE28491',
        level: 'Level 100',
        accountId: 'STU-108',
        phone: '+233 27 555 4321',
        code: 'GIS100-X7K',
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'student_kwame_ansah',
        name: 'Kwame Ansah',
        email: 'kwame@hub.edu',
        role: 'student',
        indexNo: 'UE99142',
        level: 'Level 400',
        accountId: 'STU-402',
        phone: '+233 50 123 7890',
        code: 'GIS400-P9M',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const u of initialUsers) {
      await setDoc(doc(db, 'users', u.uid), {
        ...u,
        updatedAt: serverTimestamp(),
      });
    }

    // Seed default enrollments for class lists
    await setDoc(doc(db, 'enrollments', 'enroll_seed_201'), {
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
    });

    await setDoc(doc(db, 'enrollments', 'enroll_seed_108'), {
      id: 'enroll_seed_108',
      courseId: 'course_1',
      courseCode: 'GIS100-X7K',
      courseName: 'Introduction to GIS',
      studentId: 'student_serwaa_boakye',
      accountId: 'STU-108',
      fullName: 'Serwaa Boakye',
      indexNo: 'UE28491',
      phone: '+233 27 555 4321',
      level: 'Level 100',
      attendance: {
        '2026-10-18': 'Present',
      },
      marks: {
        exam_main: 88,
      },
      registeredAt: '2026-10-17',
    });
  } catch (err) {
    console.warn('Initial seeding skipped or error: ', err);
  }
}
