import { type IPrintCourse, PrintCourse, PrintShell } from '@repo/ui/print';
import { BlankState } from '@components/others';
import { CourseService } from '@services';
import { useCourseStore, useMaterialStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { buildEyebrow, closePrintTab, loadEnrolledCourse, loadQuizzes, readQuiz, toErrorMessage } from './print-data';

interface IProps {
  courseId: string;
  /** One module to print on its own, or null for the whole course. */
  moduleId: string | null;
}

interface ISnapshot {
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

const loadCourse = async (courseId: string, moduleId: string | null): Promise<ISnapshot> => {
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
      modules: picked.map(({ row, number }) => ({
        module: row,
        number,
        materials: useMaterialStore.getState().getMaterialsByIds(row.materials ?? []),
        quizzes: (row.testPapers ?? []).flatMap((paperId) => readQuiz(paperId) ?? []),
      })),
    },
  };
};

/** A course the learner can open, or one module of it, as a printout. */
export const CoursePrint = ({ courseId, moduleId }: IProps) => {
  const { push } = useRouter();
  const [snapshot, setSnapshot] = useState<ISnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    loadCourse(courseId, moduleId)
      .then(setSnapshot)
      .catch((reason: unknown) => setError(toErrorMessage(reason)));
  }, [courseId, moduleId]);

  if (error) return <BlankState label="Could not print this" description={error} className="py-24" />;

  const title = snapshot?.title ?? 'Course';
  return (
    <PrintShell
      documentTitle={title}
      footer={title}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/courses/${courseId}/modules`))}
      controls={
        <span className="text-xs text-muted-foreground">
          Quizzes print with their answers; solutions print for the ones you have submitted.
        </span>
      }
    >
      {snapshot ? (
        <PrintCourse data={snapshot.data} eyebrow={snapshot.eyebrow} scope={moduleId ? 'module' : 'course'} />
      ) : null}
    </PrintShell>
  );
};
