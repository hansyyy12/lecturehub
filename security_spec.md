# Security Specification: LectureHub

## 1. Data Invariants
- **User Role Invariant**: Every UserProfile belongs strictly to the authenticated `uid`. The `role` can only be set to `student` or `lecturer`.
- **Course Ownership**: Courses can only be created by signed-in lecturers (`ownerId == request.auth.uid`). A course cannot be altered or removed by non-owners.
- **Enrollment Access**: Enrollments link a student to a course. The student can create their own enrollment with their `studentId == request.auth.uid`. Both the student and course lecturer can view and manage attendance and marks.
- **Period Cycle Privacy Guarantee**: Cycle care documents located at `/cycleData/{userId}` are strictly isolated so that only the user matching `{userId}` (`request.auth.uid == userId`) can read, write, or query their personal reproductive health logs.
- **Campus Budget Privacy**: Budget plans located at `/budgetPlans/{planId}` are only accessible and mutable by the owning user (`userId == request.auth.uid`).
- **Assignment Submissions**: Submissions can only be uploaded by the student (`studentId == request.auth.uid`). Lecturers can update grading marks and feedback.

## 2. Dirty Dozen Test Vectors
1. **Attempted CycleData Snooping**: An authenticated user `userB` tries to read `/cycleData/userA`. Expected: PERMISSION_DENIED.
2. **CycleData Impersonation**: `userB` tries to write a cycle entry with `{ userId: 'userA' }`. Expected: PERMISSION_DENIED.
3. **Course Code Hijack**: User `studentA` tries to update `ownerId` of `/courses/course1` to themselves. Expected: PERMISSION_DENIED.
4. **Unauthorized Announcement**: `studentA` tries to post an announcement claiming to be the course lecturer. Expected: PERMISSION_DENIED.
5. **Budget Plan Snooping**: `userB` queries `/budgetPlans` without filtering by their own `userId`. Expected: PERMISSION_DENIED.
6. **Submitting on Behalf of Another Student**: `studentB` tries to submit an assignment with `studentId = 'studentA'`. Expected: PERMISSION_DENIED.
7. **Junk Identifier Poisoning**: Writing a document with a 10KB malicious identifier. Expected: PERMISSION_DENIED via `isValidId()`.
8. **Unauthenticated Read on Private Task**: Non-signed-in user queries `/personalTasks`. Expected: PERMISSION_DENIED.
9. **Unauthenticated Write on User Profile**: Writing `/users/uid123` with no `request.auth`. Expected: PERMISSION_DENIED.
10. **Tampering with Another User's File**: User tries to delete `/studyFiles/{fileId}` belonging to another user. Expected: PERMISSION_DENIED.
11. **Spoofed Quiz Attempt**: Student attempts to submit answers for another student's UID. Expected: PERMISSION_DENIED.
12. **Modifying Inactive Deleted Courses**: Unauthenticated or cross-tenant modification of course listings. Expected: PERMISSION_DENIED.
