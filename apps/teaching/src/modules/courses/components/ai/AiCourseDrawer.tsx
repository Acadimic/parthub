import { type IAiCourse } from '@repo/shared/interfaces';
import { AiDrawerFooter, AiPromptStep, AiSteps, type IAiStep } from '@components/app/ai';
import { Modal } from '@repo/ui/app';
import { PositionType } from '@enums';
import { CourseService } from '@services';
import { useCourseLookups, useMaterialLookups, useStandardLookups, useTestPaperLookups } from '@stores';
import { hasErrors, type IAiIssue } from '@utils/ai/common';
import {
  buildCourseBlueprintPrompt,
  DEFAULT_COURSE_SETUP,
  type IAiCourseContext,
  type IAiCourseSetup,
  type IImportedCourse,
  parseAiCourse,
  toImportedCourse,
  totalDays,
  validateAiCourse,
} from '@utils/ai/course-generator';
import { renderCourseCover } from '@utils/ai/course-cover';
import { useAttachment } from '@hooks/attachment.hook';
import { errorToast, getObjectId, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSetState } from 'react-use';
import { AiCourseImportStep } from './AiCourseImportStep';
import { AiCourseSetup } from './AiCourseSetup';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'setup' | 'prompt' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'setup', label: 'Setup', hint: 'Who, how long, how hard' },
  { key: 'prompt', label: 'Prompt', hint: 'Copy to a model' },
  { key: 'import', label: 'Import', hint: 'Paste the JSON' },
];
const NEXT_STEP: Record<Step, Step> = { setup: 'prompt', prompt: 'import', import: 'import' };
const PREVIOUS_STEP: Record<Step, Step> = { setup: 'setup', prompt: 'setup', import: 'prompt' };

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

interface IState {
  step: Step;
  setup: IAiCourseSetup;
  /** The id the prompt carries. The course itself is only created at import. */
  courseId: string;
  jsonText: string;
  isImporting: boolean;
}

/**
 * A course from a syllabus, in three steps: say who it is for and how long, copy the prompt the
 * drawer writes, paste the JSON that comes back. The reply is a plan of days that reuses the
 * workspace's saved lessons and tests by id and lists what still has to be generated; the import
 * creates the course, its plans and its modules, and nothing before that.
 */
export const AiCourseDrawer = ({ isOpen, onClose }: IProps) => {
  const router = useRouter();
  const standardStore = useStandardLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const courseStore = useCourseLookups();
  const { uploadFilesToS3 } = useAttachment();
  const [state, setState] = useSetState<IState>({
    step: 'setup',
    setup: DEFAULT_COURSE_SETUP,
    courseId: getObjectId(),
    jsonText: '',
    isImporting: false,
  });
  const [issues, setIssues] = useState<IAiIssue[]>([]);
  const [file, setFile] = useState<IAiCourse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setState({ step: 'setup', setup: DEFAULT_COURSE_SETUP, courseId: getObjectId(), jsonText: '' });
    setIssues([]);
    setFile(null);
    // The prompt lists chapters and every saved test paper; the list page has loaded neither.
    if (standardStore.shouldLoad('orgChapters')) standardStore.loadOrgChapters();
    if (testPaperStore.shouldLoad('testPapers')) testPaperStore.loadTestPapers();
  }, [isOpen]);

  // Saved lessons for the chosen standards, fetched when the choice changes. The promise is kept so
  // the prompt step can wait for it: a prompt written before the lessons arrive would offer none
  // for reuse, and the model would ask for lessons the workspace already has.
  const materialsLoad = useRef<Promise<void> | null>(null);
  useEffect(() => {
    if (!isOpen || !state.setup.standards.length) return;
    materialsLoad.current = materialStore.loadStandardsMaterials(state.setup.standards);
  }, [isOpen, state.setup.standards.join(',')]);

  const context: IAiCourseContext | null = useMemo(() => {
    if (!state.setup.standards.length) return null;
    const standards = standardStore.getStandardsByIds(state.setup.standards);
    const subjectIds = state.setup.subjects.length
      ? state.setup.subjects
      : standardStore.getStandardsSubjectItems(state.setup.standards).map((item) => item.value);
    const subjects = standardStore.getSubjectsByIds(subjectIds);
    const chapters = standardStore
      .getChapters()
      .filter((chapter) => state.setup.standards.includes(chapter.standard) && subjectIds.includes(chapter.subject));
    const materials = materialStore
      .getMaterialsByStandardIds(state.setup.standards)
      .filter((material) => !material.isNew && (!material.subject || subjectIds.includes(material.subject)));
    const testPapers = testPaperStore.getTestPapersByStandardIds(state.setup.standards).filter((paper) => !paper.isNew);
    return { courseId: state.courseId, standards, subjects, chapters, materials, testPapers };
  }, [state.setup.standards, state.setup.subjects, state.courseId, standardStore, materialStore, testPaperStore]);

  const prompt = useMemo(
    () => (context ? buildCourseBlueprintPrompt(state.setup, context) : ''),
    [state.setup, context],
  );

  const imported: IImportedCourse | null = useMemo(() => {
    if (!file || !context || hasErrors(issues)) return null;
    return toImportedCourse(file, state.setup, context, courseStore.getCourses().length);
  }, [file, issues, context, state.setup]);

  // Session titles by module id, for the preview; the sessions themselves are a later phase.
  const sessionTitles = useMemo(() => {
    const titles = new Map<string, string>();
    if (!file || !imported) return titles;
    const days = file.weeks.flatMap((week) => week.days ?? []);
    imported.modules.forEach((courseModule, index) => {
      const title = days[index]?.session?.title;
      if (title) titles.set(courseModule._id, title);
    });
    return titles;
  }, [file, imported]);

  const checkJson = (text: string) => {
    setState({ jsonText: text });
    const parsed = parseAiCourse(text);
    if (!parsed.file || !context) {
      setIssues(parsed.issues);
      setFile(null);
      return;
    }
    setIssues([...parsed.issues, ...validateAiCourse(parsed.file, state.setup, context)]);
    setFile(parsed.file);
  };

  const importCourse = async () => {
    if (!imported || state.isImporting) return;
    setState({ isImporting: true });
    let isCourseWritten = false;
    try {
      // A cover drawn from the name and subjects, so the card is never blank. Optional: a course
      // without one is still a course, and the form can replace it.
      let attachments = imported.course.attachments ?? [];
      try {
        const subtitle = [
          context?.standards.map((row) => row.name).join(', '),
          context?.subjects.map((row) => row.name).join(', '),
        ]
          .filter(Boolean)
          .join(' · ');
        const cover = await renderCourseCover({ title: imported.course.name, subtitle, seed: imported.course._id });
        attachments = await uploadFilesToS3(imported.course._id, [cover]);
      } catch {
        attachments = [];
      }
      const saved = await CourseService.upsertCourseAndPlans({
        course: { ...imported.course, attachments },
        plans: imported.plans,
      });
      isCourseWritten = true;
      const modules = await CourseService.bulkUpsertCourseModules(imported.modules);
      if (saved?.data) {
        courseStore.addCourses([saved.data.course]);
        courseStore.addPlans(saved.data.plans);
      }
      if (modules?.data) courseStore.addCourseModules(modules.data);
      const owed = imported.pendingLessons + imported.pendingTests;
      successToast({
        message: `"${imported.course.name}" created with ${countLabel(imported.modules.length, 'day')}.`,
        description: owed
          ? `${countLabel(imported.pendingLessons, 'lesson')} and ${countLabel(imported.pendingTests, 'quiz').replace('quizs', 'quizzes')} still to generate.`
          : undefined,
      });
      onClose();
      router.push(`/courses/${imported.course._id}`);
    } catch (error) {
      // A course with no modules would sit on the list half-made, so the write is undone.
      if (isCourseWritten) {
        await CourseService.upsertCourseAndPlans({
          course: { ...imported.course, _deleted: true },
          plans: imported.plans.map((plan) => ({ ...plan, _deleted: true })),
        }).catch(() => undefined);
      }
      reportError(error, 'Could not create the course.');
    } finally {
      setState({ isImporting: false });
    }
  };

  const goNext = async () => {
    if (state.step === 'setup') {
      if (!context) {
        errorToast({ message: 'Pick at least one standard.' });
        return;
      }
      await Promise.all([
        materialsLoad.current,
        testPaperStore.isLoading('testPapers') ? testPaperStore.loadTestPapers() : null,
      ]);
    }
    setState({ step: NEXT_STEP[state.step] });
  };
  const goBack = () => setState({ step: PREVIOUS_STEP[state.step] });
  const stepIndex = STEPS.findIndex((step) => step.key === state.step);
  const footerNote =
    state.step === 'setup'
      ? `${countLabel(totalDays(state.setup), 'day')} planned`
      : `Step ${stepIndex + 1} of ${STEPS.length}`;

  const renderStep = () => {
    if (state.step === 'setup') {
      return (
        <AiCourseSetup
          setup={state.setup}
          onChange={(fields) => setState({ setup: { ...state.setup, ...fields } })}
          standardItems={standardStore.getStandardItems()}
          subjectItems={standardStore.getStandardsSubjectItems(state.setup.standards)}
          context={context}
          isLoadingLessons={materialStore.isLoading('materials')}
        />
      );
    }
    if (state.step === 'prompt') return <AiPromptStep prompt={prompt} fileName="course blueprint" subject="lessons" />;
    return (
      <AiCourseImportStep
        text={state.jsonText}
        onChangeText={checkJson}
        issues={issues}
        imported={imported}
        sessionTitles={sessionTitles}
      />
    );
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate a course with AI"
      description="Say who it is for and how long, copy the prompt into any model with web search, paste its JSON back. Nothing is saved until you import."
      isOpen={isOpen}
      onClose={() => !state.isImporting && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <AiSteps steps={STEPS} current={state.step} onSelect={(step) => setState({ step })} />
          {renderStep()}
        </div>
      }
      footer={
        <AiDrawerFooter
          note={footerNote}
          isFirstStep={stepIndex === 0}
          isLastStep={state.step === 'import'}
          nextLabel={state.step === 'setup' ? 'Write the prompt' : 'I have the JSON'}
          importLabel={imported ? `Create course with ${countLabel(imported.modules.length, 'day')}` : 'Create course'}
          canImport={!!imported && !hasErrors(issues)}
          isImporting={state.isImporting}
          onClose={onClose}
          onBack={goBack}
          onNext={goNext}
          onImport={importCourse}
        />
      }
    />
  );
};
