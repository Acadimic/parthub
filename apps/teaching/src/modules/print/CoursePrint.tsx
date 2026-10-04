import { type IPrintCourse, type IPrintPaper, PrintCourse, PrintOptionPicker, PrintShell } from '@repo/ui/print';
import { BlankState } from '@components/others';
import { CourseService, TestPaperService } from '@services';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { buildEyebrow, closePrintTab } from './print-data';

interface IProps {
  courseId: string;
  /** One module to print on its own, or null for the whole course. */
  moduleId: string | null;
}

type QuizVersion = 'questions' | 'answers';

const QUIZ_OPTIONS: { value: QuizVersion; label: string }[] = [
  { value: 'answers', label: 'Quizzes with answers' },
  { value: 'questions', label: 'Quizzes without answers' },
];

interface ISnapshot {
  data: IPrintCourse;
  eyebrow: string;
  /** The footer and tab title: the course, or the module when one is printed alone. */
  title: string;
}

/** Reads the course, its contents and every quiz in it, as one printable snapshot. */
/**
 * The modules to print, each with its place in the course. A single module is read on its own:
 * a whole course's lesson bodies can run to megabytes, and its place comes from the bodiless list.
 */
const loadModules = async (courseId: string, moduleId: string | null) => {
  if (!moduleId) {
    const { data } = await CourseService.getCourseModulesWithContents(courseId);
    return (data ?? []).map((row, index) => ({ row, number: index + 1 }));
  }
  const [{ data: list }, { data: row }] = await Promise.all([
    CourseService.getCourseModulesByCourseId(courseId),
    CourseService.getCourseModuleWithContents(courseId, moduleId),
  ]);
  if (!row) return [];
  // The list is in course order, as the contents route returns it, so the index is the number.
  const position = (list ?? []).findIndex((item) => item._id === moduleId);
  return [{ row, number: position + 1 }];
};

const loadCourse = async (courseId: string, moduleId: string | null): Promise<ISnapshot> => {
  const [{ data: course }, picked] = await Promise.all([
    CourseService.getCourseById(courseId),
    loadModules(courseId, moduleId),
  ]);
  if (!course) throw new Error('This course does not exist, or was deleted.');
  if (!picked.length) throw new Error('This module is not part of the course, or was deleted.');
  const modules = picked.map(({ row }) => row);
  const paperIds = [...new Set(modules.flatMap((row) => row.testPapers.map((paper) => paper._id)))];
  const papers = await Promise.all(
    paperIds.map(async (paperId) => ({
      paperId,
      result: await TestPaperService.getTestPaperSectionsWithQuestions(paperId),
    })),
  );
  const contentsByPaper = new Map(papers.map(({ paperId, result }) => [paperId, result.data]));
  return {
    eyebrow: buildEyebrow('Course', course.standards ?? [], course.subjects ?? []),
    title: moduleId ? modules[0].name : course.name,
    data: {
      course,
      modules: picked.map(({ row, number }) => ({
        module: row,
        number,
        materials: row.materials,
        quizzes: row.testPapers.flatMap((paper) => {
          const contents = contentsByPaper.get(paper._id);
          if (!contents) return [];
          // `version` is set per render from the toolbar, not here; see `withQuizVersion`.
          const printPaper: IPrintPaper = { paper, sections: contents.sections, questions: contents.questions };
          return [{ paper: printPaper, version: 'questions' as const, solutions: 'shown' as const }];
        }),
      })),
    },
  };
};

const withQuizVersion = (data: IPrintCourse, version: QuizVersion): IPrintCourse => ({
  ...data,
  modules: data.modules.map((row) => ({ ...row, quizzes: row.quizzes.map((quiz) => ({ ...quiz, version })) })),
});

/** A course, or one of its modules, as a printout; quizzes print with answers unless `?quizzes=questions`. */
export const CoursePrint = ({ courseId, moduleId }: IProps) => {
  const { query, replace, push } = useRouter();
  const quizVersion: QuizVersion = query.quizzes === 'questions' ? 'questions' : 'answers';
  const [snapshot, setSnapshot] = useState<ISnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    loadCourse(courseId, moduleId)
      .then(setSnapshot)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load this course.'));
  }, [courseId, moduleId]);

  if (error) return <BlankState label="Could not load this course" description={error} className="py-24" />;

  const title = snapshot?.title ?? 'Course';
  return (
    <PrintShell
      documentTitle={title}
      footer={title}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/courses/${courseId}`))}
      controls={
        <PrintOptionPicker
          options={QUIZ_OPTIONS}
          value={quizVersion}
          onChange={(next) => replace({ query: { ...query, quizzes: next } }, undefined, { shallow: true })}
        />
      }
    >
      {snapshot ? (
        <PrintCourse
          data={withQuizVersion(snapshot.data, quizVersion)}
          eyebrow={snapshot.eyebrow}
          scope={moduleId ? 'module' : 'course'}
        />
      ) : null}
    </PrintShell>
  );
};
