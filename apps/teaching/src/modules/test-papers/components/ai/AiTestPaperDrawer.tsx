import { type QuestionDto } from '@repo/shared/contracts';
import { type IAiTestPaper } from '@repo/shared/interfaces';
import { ArrowLeftIcon, ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { Button, Modal } from '@repo/ui/app';
import { PositionType, QuestionType, SectionCategoryType, SectionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { QuestionService, TestPaperService } from '@services';
import {
  type ITestPaperSection,
  useQuestionLookups,
  useStandardLookups,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import {
  buildTestPaperPrompt,
  DEFAULT_DIFFICULTY,
  EMPTY_COUNTS,
  EXAM_STYLES,
  type IAiBlueprint,
  type IAiContext,
  type IAiIssue,
  type IImportedQuestion,
  LANGUAGES,
  parseAiPaper,
  toImportedQuestions,
  totalCount,
  validateAiPaper,
} from '@utils/ai/test-paper-generator';
import { ALL, defaultMarkings as APP_DEFAULT_MARKINGS } from '@utils/constants';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { useEffect, useMemo, useState } from 'react';
import { useSetState } from 'react-use';
import { type TestPaperDto } from '@repo/shared/contracts';
import { AiBlueprintStep, type IPlanRow } from './AiBlueprintStep';
import { AiPromptStep, AiSteps, type IAiStep } from '@components/app/ai';
import { AiImportStep } from './AiImportStep';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  testPaper: TestPaperDto;
  sections: ITestPaperSection[];
  /** The section whose "Generate" opened the drawer, ticked and given a default count. */
  initialSectionId?: string;
}

/** How many questions a ticked section asks for before the teacher changes it. */
const DEFAULT_QUESTION_COUNT = 20;

type Step = 'blueprint' | 'prompt' | 'import';
const STEPS: IAiStep<Step>[] = [
  { key: 'blueprint', label: 'Blueprint', hint: 'What to generate' },
  { key: 'prompt', label: 'Prompt', hint: 'Copy to a model' },
  { key: 'import', label: 'Import', hint: 'Paste the JSON' },
];

interface IState {
  step: Step;
  rows: IPlanRow[];
  blueprint: Omit<IAiBlueprint, 'sections' | 'testPaperId' | 'paperName'>;
  jsonText: string;
  isImporting: boolean;
}

const newRow = (section?: ITestPaperSection, isEnabled = false): IPlanRow => ({
  key: section?._id ?? `new-${Date.now()}`,
  sectionId: section?._id,
  name: section?.name ?? '',
  counts: { ...EMPTY_COUNTS, singleChoice: isEnabled ? DEFAULT_QUESTION_COUNT : 0 },
  chapterIds: [],
  topics: '',
  defaultMarkings: section?.defaultMarkings,
  isEnabled,
});

/**
 * Generate a paper with any model, in three steps: describe what is wanted, copy the prompt the
 * drawer writes, paste the JSON that comes back. The drawer never calls a model itself, so a
 * teacher can use whichever one they have, and the import checks the reply against the paper —
 * ids, counts, answer keys — before a single question is written.
 */
export const AiTestPaperDrawer = ({ isOpen, onClose, testPaper, sections, initialSectionId }: IProps) => {
  const standardStore = useStandardLookups();
  const testPaperStore = useTestPaperLookups();
  const questionStore = useQuestionLookups();
  const [state, setState] = useSetState<IState>({
    step: 'blueprint',
    rows: [],
    blueprint: {
      difficulty: DEFAULT_DIFFICULTY,
      examStyle: EXAM_STYLES[0],
      language: LANGUAGES[0],
      includeSolutions: true,
      instructions: '',
    },
    jsonText: '',
    isImporting: false,
  });
  const [issues, setIssues] = useState<IAiIssue[]>([]);
  const [imported, setImported] = useState<IImportedQuestion[]>([]);

  // Rows follow the paper's sections each time the drawer opens; the section that opened it starts ticked.
  useEffect(() => {
    if (!isOpen) return;
    // The section that opened the drawer, else the first one, starts ticked with the default count.
    const ticked = sections.some((section) => section._id === initialSectionId) ? initialSectionId : sections[0]?._id;
    const rows = sections.map((section) => newRow(section, section._id === ticked));
    if (!rows.length) rows.push({ ...newRow(undefined, true), name: 'Section A' });
    setState({ step: 'blueprint', rows, jsonText: '' });
    setIssues([]);
    setImported([]);
  }, [isOpen, initialSectionId, sections.length]);

  // The workspace data the prompt lists and the validator checks against.
  const context: IAiContext = useMemo(() => {
    const standards = standardStore.getStandardsByIds(testPaper.standards ?? []);
    const standardIds = standards.map((standard) => standard._id);
    const paperSubjects = (testPaper.subjects ?? []).filter((id) => id !== ALL);
    const subjectIds = paperSubjects.length
      ? paperSubjects
      : standardStore.getStandardsSubjectItems(standardIds).map((item) => item.value);
    const subjects = subjectIds
      .map((id) => standardStore.getSubjectById(id))
      .filter((subject): subject is NonNullable<typeof subject> => !!subject);
    const chapters = standardStore
      .getChapters()
      .filter((chapter) => standardIds.includes(chapter.standard) && subjectIds.includes(chapter.subject));
    return { standards, subjects, chapters };
  }, [testPaper, standardStore]);

  const chapterItems: ISelectItem[] = useMemo(
    () =>
      context.chapters.map((chapter) => ({
        label: chapter.name,
        value: chapter._id,
        group: `${standardStore.getStandardById(chapter.standard)?.name ?? ''} · ${standardStore.getSubjectById(chapter.subject)?.name ?? ''}`,
      })),
    [context, standardStore],
  );

  const enabledRows = state.rows.filter((row) => row.isEnabled);
  const plannedCount = enabledRows.reduce((sum, row) => sum + totalCount(row.counts), 0);
  const difficultySum =
    state.blueprint.difficulty.easy + state.blueprint.difficulty.medium + state.blueprint.difficulty.hard;

  const blueprint: IAiBlueprint = {
    testPaperId: testPaper._id,
    paperName: testPaper.name,
    sections: enabledRows.map((row) => ({ ...row, name: row.name.trim() || 'Untitled section' })),
    ...state.blueprint,
  };
  const prompt = useMemo(() => buildTestPaperPrompt(blueprint, context), [blueprint, context]);

  const blueprintProblem = (): string | null => {
    if (!enabledRows.length) return 'Tick at least one section.';
    if (!plannedCount) return 'Ask for at least one question.';
    if (enabledRows.some((row) => !row.sectionId && !row.name.trim())) return 'Name every new section.';
    if (difficultySum !== 100) return 'The difficulty shares should add up to 100%.';
    return null;
  };

  const markingsFor = (sectionRef: string, sectionId: string | undefined, type: QuestionType) => {
    const existing = sections.find((section) => section._id === sectionId);
    const planned = state.rows.find((row) => row.sectionId === sectionId || row.key === sectionRef);
    return (existing?.defaultMarkings ?? planned?.defaultMarkings ?? APP_DEFAULT_MARKINGS)[type];
  };

  // Every keystroke re-checks the reply; a fully valid one is also turned into the rows to preview.
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
        testPaperId: testPaper._id,
        sectionIds: new Set(sections.map((section) => section._id)),
        standardIds: new Set(context.standards.map((standard) => standard._id)),
        subjectIds: new Set(context.subjects.map((subject) => subject._id)),
        chapters: context.chapters,
      }),
    ];
    setIssues(all);
    setImported(
      all.some((issue) => issue.level === 'error')
        ? []
        : toImportedQuestions(parsed.paper, {
            standard: context.standards[0]?._id ?? '',
            subject: context.subjects[0]?._id ?? '',
            markingsFor: (section, type) => markingsFor(section.ref, section.sectionId, type),
          }),
    );
  };

  /** A section the file asks for that the paper does not have yet, saved before its questions. */
  const createSection = async (paper: IAiTestPaper['sections'][number]): Promise<string> => {
    const source = sections[0];
    const section = testPaperStore.createTestPaperSection(
      SectionType.SECTION,
      SectionCategoryType.CUSTOM,
      source?.defaultMarkings ?? structuredClone(APP_DEFAULT_MARKINGS),
      paper.name,
    );
    const current = useTestPaperStore.getState().getTestPaperById(testPaper._id) ?? testPaper;
    testPaperStore.patchTestPaper(testPaper._id, {
      sections: [...new Set([...(current.sections ?? []), section._id])],
    });
    const toSave = useTestPaperStore.getState().getTestPaperById(testPaper._id) ?? current;
    await Promise.all([TestPaperService.upsertTestPaper(toSave), TestPaperService.upsertTestPaperSection(section)]);
    testPaperStore.patchTestPaperSection(section._id, { isNew: false });
    return section._id;
  };

  const importQuestions = async () => {
    if (!imported.length || state.isImporting) return;
    setState({ isImporting: true });
    const created: string[] = [];
    try {
      const sectionIdByRef = new Map<string, string>();
      for (const item of imported) {
        if (sectionIdByRef.has(item.section.ref)) continue;
        sectionIdByRef.set(item.section.ref, item.section.sectionId ?? (await createSection(item.section)));
      }
      const dtos: QuestionDto[] = imported.map((item) => {
        const sectionId = sectionIdByRef.get(item.section.ref) ?? '';
        const questionType = item.dto.questionType ?? QuestionType.SINGLE_CHOICE;
        const draft = questionStore.createQuestion({
          section: sectionId,
          standard: item.dto.standard ?? context.standards[0]?._id ?? '',
          subject: item.dto.subject,
          questionType,
          markings: item.dto.markings ?? APP_DEFAULT_MARKINGS[questionType],
        });
        created.push(draft._id);
        const { standard: _s, subject: _j, questionType: _t, markings: _m, ...rest } = item.dto;
        questionStore.patchQuestion(draft._id, rest);
        return { ...questionStore.getQuestionById(draft._id), ...draft, ...rest, section: sectionId };
      });
      const result = await QuestionService.bulkUpsertQuestions(dtos);
      if (result?.data) questionStore.addQuestions(result.data.map((question) => ({ ...question, isNew: false })));
      created.forEach((id) => questionStore.patchQuestion(id, { isNew: false }));
      successToast({ message: `${dtos.length} ${dtos.length === 1 ? 'question' : 'questions'} imported.` });
      onClose();
      await Promise.all([
        testPaperStore.reloadTestPaper(testPaper._id),
        testPaperStore.loadTestPaperSectionsWithQuestions(testPaper._id),
      ]);
    } catch (error) {
      created.forEach((id) => questionStore.removeQuestionById(id));
      reportError(error, 'Could not import the questions.');
    } finally {
      setState({ isImporting: false });
    }
  };

  const goNext = () => {
    if (state.step === 'blueprint') {
      const problem = blueprintProblem();
      if (problem) {
        errorToast({ message: problem });
        return;
      }
      setState({ step: 'prompt' });
    } else if (state.step === 'prompt') setState({ step: 'import' });
  };
  const goBack = () => setState({ step: state.step === 'import' ? 'prompt' : 'blueprint' });
  const stepIndex = STEPS.findIndex((step) => step.key === state.step);
  const hasErrors = issues.some((issue) => issue.level === 'error');

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[52rem] md:max-w-[92%]"
      title="Generate with AI"
      description="Describe the paper, copy the prompt into any model, paste its JSON back. Nothing is saved until you import."
      isOpen={isOpen}
      onClose={() => !state.isImporting && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <AiSteps steps={STEPS} current={state.step} onSelect={(step) => setState({ step })} />

          {state.step === 'blueprint' ? (
            <AiBlueprintStep
              blueprint={blueprint}
              rows={state.rows}
              chapterItems={chapterItems}
              onChangeBlueprint={(fields) => setState({ blueprint: { ...state.blueprint, ...fields } })}
              onChangeRow={(key, fields) =>
                setState({ rows: state.rows.map((row) => (row.key === key ? { ...row, ...fields } : row)) })
              }
              onAddRow={() =>
                setState({
                  rows: [
                    ...state.rows,
                    { ...newRow(undefined, true), name: `Section ${String.fromCharCode(65 + state.rows.length)}` },
                  ],
                })
              }
              onRemoveRow={(key) => setState({ rows: state.rows.filter((row) => row.key !== key) })}
            />
          ) : null}
          {state.step === 'prompt' ? <AiPromptStep prompt={prompt} fileName={testPaper.name} /> : null}
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
              {state.step === 'blueprint'
                ? `${plannedCount} ${plannedCount === 1 ? 'question' : 'questions'} planned`
                : `Step ${stepIndex + 1} of ${STEPS.length}`}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {stepIndex > 0 ? (
              <Button
                isSecondary
                text="Back"
                leftsection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
                onClick={goBack}
                disabled={state.isImporting}
              />
            ) : null}
            {state.step !== 'import' ? (
              <Button
                text={state.step === 'blueprint' ? 'Write the prompt' : 'I have the JSON'}
                rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
                onClick={goNext}
              />
            ) : (
              <Button
                text={`Import ${imported.length || ''} ${imported.length === 1 ? 'question' : 'questions'}`.replace(
                  '  ',
                  ' ',
                )}
                leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
                onClick={importQuestions}
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
