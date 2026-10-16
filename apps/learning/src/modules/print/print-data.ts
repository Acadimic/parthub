import { type IPrintCourse, type IPrintQuiz } from '@repo/ui/print';
import { CourseService } from '@services';
import {
  type ICourse,
  type ICourseModule,
  useCourseStore,
  useEnrollmentStore,
  useMaterialStore,
  useQuestionStore,
  useSelectorStore,
  useStandardStore,
  useTestPaperStore,
} from '@stores';
import { getAbsoluteUrl, getCoursePath } from '@utils/helpers';

/**
 * A quiz always prints with its correct answers; the worked solutions follow only once the learner
 * has submitted it, which is when the result screen reveals them. Practice sittings do not count.
 */
export const readQuiz = (testPaperId: string): IPrintQuiz | null => {
  const testPapers = useTestPaperStore.getState();
  const paper = testPapers.getTestPaperById(testPaperId);
  if (!paper) return null;
  const sections = testPapers.getTestPaperSectionsByIds(paper.sections ?? []);
  const questions = useQuestionStore.getState().getQuestionsBySectionIds(sections.map((section) => section._id));
  const isSubmitted = testPapers.getMyAttemptsByTestPaperId(testPaperId).length > 0;
  return { paper: { paper, sections, questions }, version: 'answers', solutions: isSubmitted ? 'shown' : 'hidden' };
};

/** The course's full public address for the closing panel; a draft has none anyone else could open. */
export const getPrintCourseUrl = (course: ICourse): string | null =>
  course.isPublished ? getAbsoluteUrl(getCoursePath(course)) : null;

/** "Course · Class 11 · Physics": a kind, then the standards and subjects the course is tagged with. */
export const buildEyebrow = (kind: string, course: ICourse) => {
  const { getStandardsByIds, getSubjectsByIds } = useStandardStore.getState();
  return [
    kind,
    ...getStandardsByIds(course.standards ?? []).map((row) => row.name),
    ...getSubjectsByIds(course.subjects ?? []).map((row) => row.name),
  ].join(' · ');
};

/**
 * Loads a course's syllabus, with the learner's seats and results, and refuses one the learner
 * cannot open. Returns the course and its modules in course order. The outline, not the contents:
 * a long course's lesson bodies run to megabytes, and only a whole-course printout needs them.
 */
export const loadEnrolledCourse = async (courseId: string): Promise<{ course: ICourse; modules: ICourseModule[] }> => {
  const courses = useCourseStore.getState();
  if (!courses.getCourseById(courseId)) await courses.loadCourses();
  const course = useCourseStore.getState().getCourseById(courseId);
  if (!course) throw new Error('It may have been unpublished, or the link is no longer valid.');
  // A paper in a course another organization published is only readable through that course.
  useSelectorStore.getState().setSelectedCourseId(courseId);
  await Promise.all([
    courses.loadCourseOutline(courseId),
    courses.loadCoursePlans(courseId),
    useEnrollmentStore.getState().loadMyEnrollments(),
    useTestPaperStore.getState().loadMyResults(),
  ]);
  const failure = useCourseStore.getState().getError('courseModules');
  if (failure) throw new Error(failure);
  const isPaid = useCourseStore
    .getState()
    .getPlansByCourseId(courseId)
    .some((plan) => plan.amount > 0);
  // The server strips lesson bodies without a seat, so this would print an empty course.
  if (isPaid && !useEnrollmentStore.getState().getActiveEnrollment(courseId)) {
    throw new Error(`${course.name} is a paid course. Enrol to print its lessons and quizzes.`);
  }
  const modules = useCourseStore
    .getState()
    .getCourseModuleByCourseId(courseId)
    .sort((a, b) => a.day - b.day);
  return { course, modules };
};

export const loadQuizzes = (paperIds: string[]) =>
  Promise.all(
    [...new Set(paperIds)].map((paperId) => useTestPaperStore.getState().loadTestPaperSectionsWithQuestions(paperId)),
  );

export interface IPrintCourseSnapshot {
  data: IPrintCourse;
  eyebrow: string;
  /** The footer and tab title: the course, or the module when one is printed alone. */
  title: string;
}

/**
 * The lesson bodies the syllabus left out: one module's from its own route, or the whole course's.
 * Either way they land in the material store over the outline's bodiless rows.
 */
const loadLessons = async (courseId: string, moduleId: string | null) => {
  if (!moduleId) {
    await useCourseStore.getState().loadCourseModules(courseId);
    const failure = useCourseStore.getState().getError('courseModules');
    if (failure) throw new Error(failure);
    return;
  }
  const { data } = await CourseService.getCourseModuleContents(courseId, moduleId);
  if (!data) throw new Error('This module could not be loaded.');
  useMaterialStore.getState().addMaterials(data.materials);
};

/**
 * A course the learner can open, or one module of it, with every lesson body and quiz in: what a
 * printout or the book shows.
 */
export const loadPrintCourse = async (courseId: string, moduleId: string | null): Promise<IPrintCourseSnapshot> => {
  const { course, modules } = await loadEnrolledCourse(courseId);
  // Numbered before filtering, so a module printed alone keeps its place in the course.
  const numbered = modules.map((row, index) => ({ row, number: index + 1 }));
  const picked = moduleId ? numbered.filter(({ row }) => row._id === moduleId) : numbered;
  if (!picked.length) throw new Error('This module is not part of the course, or was removed.');
  await Promise.all([loadLessons(courseId, moduleId), loadQuizzes(picked.flatMap(({ row }) => row.testPapers ?? []))]);
  return {
    eyebrow: buildEyebrow('Course', course),
    title: moduleId ? picked[0].row.name : course.name,
    data: {
      course,
      courseUrl: getPrintCourseUrl(course),
      modules: picked.map(({ row, number }) => ({
        module: row,
        number,
        materials: useMaterialStore.getState().getMaterialsByIds(row.materials ?? []),
        quizzes: (row.testPapers ?? []).flatMap((paperId) => readQuiz(paperId) ?? []),
      })),
    },
  };
};

/** The print page opens in a tab of its own, so Close closes it; opened directly, it goes back. */
export const closePrintTab = (fallback: () => void) => {
  window.close();
  fallback();
};

export const toErrorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : 'Could not load this.');
