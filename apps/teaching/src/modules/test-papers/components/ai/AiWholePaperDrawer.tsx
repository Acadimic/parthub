import { type QuestionDto } from '@repo/shared/contracts';
import { ArrowLeftIcon, ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { Button, Modal } from '@repo/ui/app';
import { PaperType, PositionType, QuestionType, SectionCategoryType, SectionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { QuestionService, TestPaperService } from '@services';
import {
  useQuestionLookups,
  useSelectorLookups,
  useStandardLookups,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import {
  buildTestPaperPrompt,
  DEFAULT_DIFFICULTY,
  EXAM_STYLES,
  type IAiBlueprint,
  type IAiContext,
  type IAiIssue,
  type IImportedQuestion,
  LANGUAGES,
  parseAiPaper,
  toImportedQuestions,
  validateAiPaper,
} from '@utils/ai/test-paper-generator';
import { planWholePaperSections, WHOLE_PAPER_DEFAULTS, wholePaperName } from '@utils/ai/test-paper-plan';
import { defaultMarkings as APP_DEFAULT_MARKINGS } from '@utils/constants';
import { errorToast, getObjectId, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useSetState } from 'react-use';
import { AiImportStep } from './AiImportStep';
import { AiPromptStep } from './AiPromptStep';
import { AiSteps, type IAiStep } from './AiSteps';
import { AiWholePaperSetup, type IWholePaperSetup } from './AiWholePaperSetup';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'setup' | 'prompt' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'setup', label: 'Setup', hint: 'Standard and subjects' },
  { key: 'prompt', label: 'Prompt', hint: 'Copy to a model' },
  { key: 'import', label: 'Import', hint: 'Paste the JSON' },
];

interface IState {
  step: Step;
  setup: IWholePaperSetup;
  /** The id the prompt carries. The paper itself is only created at import. */
  paperId: string;
  jsonText: string;
  isImporting: boolean;
}

const INITIAL_SETUP: IWholePaperSetup = {
  standards: [],
  subjects: [],
  totalQuestions: WHOLE_PAPER_DEFAULTS.totalQuestions,
  examStyle: EXAM_STYLES[0],
  language: LANGUAGES[0],
  instructions: '',
};

/**
 * A whole paper from a standard and, optionally, subjects. Everything else is decided here — the
 * name, quiz type, thirty minutes, one section per subject, the type mix, solutions on — and shown
 * before the prompt is written, so the teacher only ever answers the two questions a system cannot.
 */
export const AiWholePaperDrawer = ({ isOpen, onClose }: IProps) => {
  const router = useRouter();
  const standardStore = useStandardLookups();
  const testPaperStore = useTestPaperLookups();
  const questionStore = useQuestionLookups();
  const { setSelectedTestPaperId } = useSelectorLookups();
  const [state, setState] = useSetState<IState>({
    step: 'setup',
    setup: INITIAL_SETUP,
    paperId: getObjectId(),
    jsonText: '',
    isImporting: false,
  });
  const [issues, setIssues] = useState<IAiIssue[]>([]);
  const [imported, setImported] = useState<IImportedQuestion[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setState({ step: 'setup', setup: INITIAL_SETUP, paperId: getObjectId(), jsonText: '' });
    setIssues([]);
    setImported([]);
    // Chapters are what the prompt lists per section; the list page has no reason to have loaded them.
    if (standardStore.shouldLoad('chapters')) standardStore.loadOrgChapters();
  }, [isOpen]);

  const standards = standardStore.getStandardsByIds(state.setup.standards);
  const subjectItems: ISelectItem[] = standardStore.getStandardsSubjectItems(state.setup.standards);
  const subjectIds = state.setup.subjects.length ? state.setup.subjects : subjectItems.map((item) => item.value);
  const subjects = subjectIds
    .map((id) => standardStore.getSubjectById(id))
    .filter((subject): subject is NonNullable<typeof subject> => !!subject);
  const chapters = standardStore
    .getChapters()
    .filter((chapter) => state.setup.standards.includes(chapter.standard) && subjectIds.includes(chapter.subject));
  const context: IAiContext = { standards, subjects, chapters };
  const paperName = wholePaperName(standards, state.setup.subjects.length ? subjects : []);

  const plan = useMemo(
    () =>
      planWholePaperSections(
        state.setup.totalQuestions,
        state.setup.subjects.length ? subjects : [],
        chapters,
        APP_DEFAULT_MARKINGS,
      ),
    [state.setup.totalQuestions, state.setup.subjects, subjects.length, chapters.length],
  );

  const blueprint: IAiBlueprint = {
    testPaperId: state.paperId,
    paperName,
    sections: plan,
    difficulty: DEFAULT_DIFFICULTY,
    examStyle: state.setup.examStyle,
    language: state.setup.language,
    includeSolutions: true,
    instructions: state.setup.instructions,
  };
  const prompt = useMemo(() => buildTestPaperPrompt(blueprint, context), [blueprint, context]);

  const checkJson = (text: string) => {
    setState({ jsonText: text });
    const parsed = parseAiPaper(text);
    if (!parsed.paper) {
      setIssues(parsed.issues);
      setImported([]);
      return;
    }
    const all = [
      ...parsed.issues,
      ...validateAiPaper(parsed.paper, {
        testPaperId: state.paperId,
        sectionIds: new Set<string>(),
        standardIds: new Set(standards.map((standard) => standard._id)),
        subjectIds: new Set(subjects.map((subject) => subject._id)),
        chapters,
      }),
    ];
    setIssues(all);
    setImported(
      all.some((issue) => issue.level === 'error')
        ? []
        : toImportedQuestions(parsed.paper, {
            standard: standards[0]?._id ?? '',
            subject: subjects[0]?._id ?? '',
            markingsFor: (_section, type) => APP_DEFAULT_MARKINGS[type],
          }),
    );
  };

  const importPaper = async () => {
    if (!imported.length || state.isImporting) return;
    setState({ isImporting: true });
    const created = { paperId: '', sectionIds: [] as string[], questionIds: [] as string[] };
    try {
      // 1. The paper, with the defaults the setup step showed.
      const paper = testPaperStore.createTestPaper();
      created.paperId = paper._id;
      testPaperStore.patchTestPaper(paper._id, {
        name: paperName,
        standards: state.setup.standards,
        // No subjects means every subject of the standard; the server takes an empty list for that, not the ALL marker.
        subjects: state.setup.subjects,
        paperType: PaperType.QUIZ,
        durationMins: WHOLE_PAPER_DEFAULTS.durationMins,
        year: new Date().getFullYear(),
        isNew: false,
      });
      // 2. One section per section in the file.
      const sectionIdByRef = new Map<string, string>();
      for (const item of imported) {
        if (sectionIdByRef.has(item.section.ref)) continue;
        const section = testPaperStore.createTestPaperSection(
          SectionType.SECTION,
          SectionCategoryType.CUSTOM,
          structuredClone(APP_DEFAULT_MARKINGS),
          item.section.name,
        );
        created.sectionIds.push(section._id);
        sectionIdByRef.set(item.section.ref, section._id);
      }
      testPaperStore.patchTestPaper(paper._id, { sections: [...sectionIdByRef.values()] });
      const toSave = useTestPaperStore.getState().getTestPaperById(paper._id) ?? paper;
      await TestPaperService.upsertTestPaper(toSave);
      for (const sectionId of created.sectionIds) {
        const section = useTestPaperStore.getState().getTestPaperSectionById(sectionId);
        if (section) await TestPaperService.upsertTestPaperSection(section);
        testPaperStore.patchTestPaperSection(sectionId, { isNew: false });
      }
      // 3. The questions, in one request.
      const dtos: QuestionDto[] = imported.map((item) => {
        const sectionId = sectionIdByRef.get(item.section.ref) ?? '';
        const questionType = item.dto.questionType ?? QuestionType.SINGLE_CHOICE;
        const draft = questionStore.createQuestion({
          section: sectionId,
          standard: item.dto.standard ?? state.setup.standards[0] ?? '',
          subject: item.dto.subject,
          questionType,
          markings: item.dto.markings ?? APP_DEFAULT_MARKINGS[questionType],
        });
        created.questionIds.push(draft._id);
        const { standard: _s, subject: _j, questionType: _t, markings: _m, ...rest } = item.dto;
        questionStore.patchQuestion(draft._id, rest);
        return { ...draft, ...rest, section: sectionId };
      });
      const result = await QuestionService.bulkUpsertQuestions(dtos);
      if (result?.data) questionStore.addQuestions(result.data.map((question) => ({ ...question, isNew: false })));
      created.questionIds.forEach((id) => questionStore.patchQuestion(id, { isNew: false }));
      successToast({ message: `"${paperName}" created with ${dtos.length} questions.` });
      onClose();
      setSelectedTestPaperId(paper._id);
      await testPaperStore.reloadTestPaper(paper._id);
      router.push(`/test-papers/${paper._id}`);
    } catch (error) {
      created.questionIds.forEach((id) => questionStore.removeQuestionById(id));
      created.sectionIds.forEach((id) => testPaperStore.removeTestPaperSection(id));
      if (created.paperId) testPaperStore.removeTestPaper(created.paperId);
      reportError(error, 'Could not create the paper.');
    } finally {
      setState({ isImporting: false });
    }
  };

  const goNext = () => {
    if (state.step === 'setup') {
      if (!state.setup.standards.length) {
        errorToast({ message: 'Pick at least one standard.' });
        return;
      }
      setState({ step: 'prompt' });
    } else if (state.step === 'prompt') setState({ step: 'import' });
  };
  const stepIndex = STEPS.findIndex((step) => step.key === state.step);
  const hasErrors = issues.some((issue) => issue.level === 'error');

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate a test paper with AI"
      description="Choose a standard, copy the prompt into any model, paste its JSON back. The paper, its sections and questions are created on import."
      isOpen={isOpen}
      onClose={() => !state.isImporting && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <AiSteps steps={STEPS} current={state.step} onSelect={(step) => setState({ step })} />
          {state.step === 'setup' ? (
            <AiWholePaperSetup
              setup={state.setup}
              onChange={(fields) => setState({ setup: { ...state.setup, ...fields } })}
              standardItems={standardStore.getStandardItems()}
              subjectItems={subjectItems}
              plan={plan}
              paperName={paperName}
              durationMins={WHOLE_PAPER_DEFAULTS.durationMins}
              subjects={subjects}
            />
          ) : null}
          {state.step === 'prompt' ? <AiPromptStep prompt={prompt} paperName={paperName} /> : null}
          {state.step === 'import' ? (
            <AiImportStep text={state.jsonText} onChangeText={checkJson} issues={issues} imported={imported} />
          ) : null}
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button isSubtle text="Close" onClick={onClose} disabled={state.isImporting} />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {stepIndex > 0 ? (
              <Button
                isSecondary
                text="Back"
                leftsection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
                onClick={() => setState({ step: state.step === 'import' ? 'prompt' : 'setup' })}
                disabled={state.isImporting}
              />
            ) : null}
            {state.step !== 'import' ? (
              <Button
                text={state.step === 'setup' ? 'Write the prompt' : 'I have the JSON'}
                rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
                onClick={goNext}
              />
            ) : (
              <Button
                text="Create the paper"
                leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
                onClick={importPaper}
                disabled={!imported.length || hasErrors}
                isLoading={state.isImporting}
              />
            )}
          </div>
        </div>
      }
    />
  );
};
