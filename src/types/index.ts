export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  accountId?: string;
  indexNo?: string;
  level?: string;
  phone?: string;
  code?: string;
  createdAt?: string;
}

export interface Course {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  level: string;
  code: string;
  semester?: string;
  days: string[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendanceMark?: number;
  quizWeight?: number;
  attendanceWeight?: number;
  assignmentWeight?: number;
  examMax?: number;
  caShare?: number;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  studentId: string;
  accountId: string;
  fullName: string;
  indexNo: string;
  phone: string;
  level: string;
  attendance?: Record<string, 'Present' | 'Absent' | 'Late'>;
  marks?: Record<string, number | string>;
  registeredAt?: string;
}

export interface Announcement {
  id: string;
  courseId?: string;
  courseCode: string;
  courseName: string;
  level?: string;
  title: string;
  message: string;
  appliesDate: string;
  author: string;
  authorId: string;
  createdAt?: string;
}

export interface Assignment {
  id: string;
  ownerId: string;
  courseCode: string;
  type: 'Assignment' | 'Quiz' | 'Project';
  title: string;
  due: string;
  desc?: string;
  createdAt?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  courseCode: string;
  itemTitle: string;
  fileName: string;
  fileType: string;
  fileDataUrl?: string;
  notes?: string;
  submissionDate: string;
  status: 'Submitted' | 'Graded';
  mark?: string | number | null;
  feedback?: string;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: string[];
  answer: string;
  marks: number;
}

export interface Quiz {
  id: string;
  ownerId: string;
  courseCode: string;
  title: string;
  duration: number;
  startAt?: string;
  endAt?: string;
  releaseResults: boolean;
  questions: QuizQuestion[];
  createdAt?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  courseCode: string;
  answers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
  objectiveScore?: number;
  manualScore?: number;
  score: number | null;
  maxScore: number;
  needsManual?: boolean;
  autoSubmitted?: boolean;
  manuallyMarkedAt?: string;
}

export interface StudyFile {
  id: string;
  userId: string;
  uploaderName?: string;
  courseCode: string;
  name: string;
  size: number;
  shared: boolean;
  fileData?: string;
  addedAt: string;
}

export type BudgetItemType = 'BILLS' | 'EXPENSES' | 'SAVINGS' | 'DEBT';

export interface BudgetItem {
  id: string;
  type: BudgetItemType;
  name: string;
  amount: number;
}

export interface BudgetPlan {
  id: string;
  userId: string;
  name: string;
  currency: string;
  totalBudget: number;
  items: BudgetItem[];
  active?: boolean;
  updatedAt?: string;
}

export interface CyclePeriod {
  start: string;
  end: string;
}

export interface CycleLog {
  date: string;
  flow: string;
  mood: string;
  energy: string;
  symptoms: string[];
  notes?: string;
}

export interface CycleData {
  userId: string;
  cycleLength: number;
  periodLength: number;
  lastStart: string;
  lastEnd: string;
  periods: CyclePeriod[];
  logs: CycleLog[];
  reminders: {
    period: boolean;
    log: boolean;
    ovulation: boolean;
    time: string;
  };
  updatedAt?: string;
}

export interface PersonalTask {
  id: string;
  userId: string;
  title: string;
  desc?: string;
  completed?: boolean;
  createdAt?: string;
}

export interface LiveMeeting {
  id: string;
  ownerId: string;
  courseCode: string;
  title: string;
  active?: boolean;
  createdAt?: string;
}
