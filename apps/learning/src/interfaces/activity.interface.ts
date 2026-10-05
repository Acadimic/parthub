/** What the activity screen shows: the learner's own history, derived from the stores. */

interface IActivityBase {
  id: string;
  /** ISO timestamp of when it happened. */
  at: string;
  courseId: string;
  courseName: string;
  title: string;
}

/** A lesson or test the learner marked complete. */
export interface ILessonActivity extends IActivityBase {
  kind: 'lesson';
  /** "video", "reading" or "test paper", for the icon and the subtitle. */
  contentType: string;
}

/** A submitted test paper attempt, with the server's marking. */
export interface ITestActivity extends IActivityBase {
  kind: 'test';
  testPaperId: string;
  marksObtained: number;
  maxMarks: number;
  /** 0–100. */
  percent: number;
  /** Correct over answered, 0–100; 0 when nothing was answered. */
  accuracy: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeSpentSecs: number;
}

export type IActivityEvent = ILessonActivity | ITestActivity;

export type ActivityKind = IActivityEvent['kind'];

/** One course the learner has started, and how far through it they are. */
export interface ICourseActivity {
  courseId: string;
  name: string;
  completed: number;
  total: number;
  /** 0–100, and 0 for a course with no items. */
  percent: number;
  attempts: number;
  /** The newest event in the course, or `null` before there is one. */
  lastActiveAt: string | null;
}

export interface IActivitySummary {
  startedCourses: number;
  lessonsCompleted: number;
  testsAttempted: number;
  /** Mean score across attempts, 0–100; 0 with no attempts. */
  averagePercent: number;
  bestPercent: number;
  testTimeSecs: number;
  /** Distinct days with any activity in the last 30. */
  activeDaysLast30: number;
}

/** One day of the activity grid. */
export interface IActivityDay {
  /** YYYY-MM-DD. */
  date: string;
  count: number;
}

export type SavedItemKind = 'course' | 'lesson' | 'test' | 'question';

/** A bookmark resolved against the stores: what it points at, and where it lives. */
export interface ISavedItem {
  /** The bookmark row's id. */
  id: string;
  kind: SavedItemKind;
  /** The item's name, or a plain-text preview for a question; a stand-in when the item is not loaded. */
  title: string;
  courseId: string;
  courseName: string;
  /** ISO timestamp of when it was saved; empty when the row carries none. */
  savedAt: string;
  collectionItem: string;
}
