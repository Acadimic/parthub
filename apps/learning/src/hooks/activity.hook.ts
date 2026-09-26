import { type TestPaperResultDto } from '@repo/shared/contracts';
import { CollectionType, Marking } from '@enums';
import {
  type IActivityDay,
  type IActivityEvent,
  type IActivitySummary,
  type ICourseActivity,
  type ILessonActivity,
  type ITestActivity,
} from '@interfaces';
import { type ICourse, useCourseLookups, useMaterialLookups, useTestPaperLookups, useTestPaperStore } from '@stores';
import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';

/** How many days the activity grid covers: twelve full weeks. */
export const ACTIVITY_GRID_DAYS = 84;

const byNewest = (a: { at: string }, b: { at: string }) => b.at.localeCompare(a.at);

/** A course's item count, from the rollups the catalogue already carries. */
const getCourseTotal = (course: ICourse) =>
  (course.stats?.videosCount ?? 0) + (course.stats?.readingsCount ?? 0) + (course.stats?.testsCount ?? 0);

const toTestActivity = (result: TestPaperResultDto, courseName: string): ITestActivity => {
  const results = Object.values(result.resultMaps);
  const correct = results.filter((marking) => marking === Marking.CORRECT).length;
  const incorrect = results.filter((marking) => marking === Marking.INCORRECT).length;
  const answered = correct + incorrect;
  return {
    kind: 'test',
    id: result._id,
    at: result.createdAt ?? '',
    courseId: result.course,
    courseName,
    title: result.title,
    testPaperId: result.testPaper,
    marksObtained: result.marksObtained,
    maxMarks: result.maxMarks,
    percent: result.maxMarks ? Math.round((result.marksObtained / result.maxMarks) * 100) : 0,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    correct,
    incorrect,
    unattempted: results.filter((marking) => marking === Marking.UNATTEMPTED).length,
    timeSpentSecs: result.totalSpendTime,
  };
};

/**
 * The learner's history, read across the course, material and test paper stores. Everything here
 * is derived; the stores stay the source of truth, and the screen loads what they need.
 */
export const useActivity = () => {
  const { getCourses, getCompletedModules, getCourseById } = useCourseLookups();
  const { getMaterialById } = useMaterialLookups();
  const { getTestPaperById } = useTestPaperLookups();
  const results = useTestPaperStore(useShallow((state) => Object.values(state.resultMap)));

  const attempts: ITestActivity[] = results
    .filter((result) => !result.isPractice && !result._deleted && result.createdAt)
    .map((result) => toTestActivity(result, getCourseById(result.course)?.name ?? 'Course'))
    .sort(byNewest);

  const lessons: ILessonActivity[] = getCompletedModules()
    .filter((row) => row.isCompleted)
    .flatMap((row) => {
      const at = row.updatedAt ?? row.createdAt;
      const course = getCourseById(row.course);
      if (!at || !course) return [];
      const isTest = row.collectionRef === CollectionType.TEST_PAPER;
      const item = isTest ? getTestPaperById(row.collectionItem) : getMaterialById(row.collectionItem);
      const lesson: ILessonActivity = {
        kind: 'lesson',
        id: row._id,
        at,
        courseId: row.course,
        courseName: course.name,
        title: item?.name ?? (isTest ? 'A test paper' : 'A lesson'),
        contentType: isTest ? 'test paper' : 'lesson',
      };
      return [lesson];
    })
    .sort(byNewest);

  const events: IActivityEvent[] = [...lessons, ...attempts].sort(byNewest);

  const courses: ICourseActivity[] = getCourses()
    .flatMap((course) => {
      const completed = lessons.filter((lesson) => lesson.courseId === course._id).length;
      const courseAttempts = attempts.filter((attempt) => attempt.courseId === course._id).length;
      if (!completed && !courseAttempts) return [];
      const total = getCourseTotal(course);
      const latest = events.find((event) => event.courseId === course._id);
      const row: ICourseActivity = {
        courseId: course._id,
        name: course.name,
        completed,
        total,
        percent: total ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        attempts: courseAttempts,
        lastActiveAt: latest ? latest.at : null,
      };
      return [row];
    })
    .sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''));

  const since30 = dayjs().subtract(30, 'day').startOf('day');
  const summary: IActivitySummary = {
    startedCourses: courses.length,
    lessonsCompleted: lessons.length,
    testsAttempted: attempts.length,
    averagePercent: attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length)
      : 0,
    bestPercent: attempts.reduce((best, attempt) => Math.max(best, attempt.percent), 0),
    testTimeSecs: attempts.reduce((sum, attempt) => sum + attempt.timeSpentSecs, 0),
    activeDaysLast30: new Set(
      events.filter((event) => dayjs(event.at).isAfter(since30)).map((event) => dayjs(event.at).format('YYYY-MM-DD')),
    ).size,
  };

  const countsByDay = events.reduce<Record<string, number>>((counts, event) => {
    const day = dayjs(event.at).format('YYYY-MM-DD');
    counts[day] = (counts[day] ?? 0) + 1;
    return counts;
  }, {});
  const start = dayjs()
    .startOf('day')
    .subtract(ACTIVITY_GRID_DAYS - 1, 'day');
  const days: IActivityDay[] = Array.from({ length: ACTIVITY_GRID_DAYS }, (_, index) => {
    const date = start.add(index, 'day').format('YYYY-MM-DD');
    return { date, count: countsByDay[date] ?? 0 };
  });

  return { events, lessons, attempts, courses, summary, days };
};
